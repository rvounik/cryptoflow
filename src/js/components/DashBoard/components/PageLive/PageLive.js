import React, { Component } from 'react';

// import helpers
import Helpers from '../../../../helpers';

// import constants
import Moods from '../../../../constants/Moods';
import MessageTypes from '../../../../constants/MessageTypes';
import Markets from '../../../../constants/Markets';
import AppConfig from '../../../../../../config/App.config';

// import components
import Chart from './../Chart/Chart';
import Logger from './../Logger/Logger';
import Threads from './../Threads/Threads';
import Feedback from './../Feedback/Feedback';

import style from './style/pagelive.scss';

class PageLive extends Component {
    constructor(props) {
        super(props);

        // todo: move to external json
        this.config = {
            // how may threads can run at the same time. more threads means more opportunities, but each will have less value
            threads: {
                range: [100],
                index: 0,
                simultaneously: 10, // how many threads can be started at the same time
                maxBudget: 0.1, // this percentage determines how much each tread takes out of the wallet
                calculated: true
            },
            // a general score combined of several factors (less means more risk)
            buyingScore: {
                range: [100],
                index: 0,
                calculated: true
            },
            // a general score combined of several factors (less means more risk)
            sellingScore: {
                range: [50],
                index: 0,
                calculated: true
            },
            // how much within regression range must the rate be, before buying (higher buys at better rate, but risks missing opportunities)
            buyingDelta: {
                range: [0.1],
                index: 0,
                calculated: true
            },
            // how much within regression range must the rate be, before selling (lower sells quicker, but possibly at less profit)
            sellingDelta: {
                range: [0.6],
                index: 0,
                calculated: true
            },
            // what kind of regression to use (linear is more accurate, polynomial is more predictive)
            regression: {
                range: ['polynomial4'],
                index: 0,
                calculated: true
            },
            // how many historic rates to collect before buyingScore can be calculated (too high: no room to buy on a spike)
            buyingHistory: {
                range: [30],
                index: 0,
                calculated: true
            },
            // how many historic rates to collect before sellingScore can be calculated (too high: no room to sell on a drop)
            sellingHistory: {
                range: [12],
                index: 0,
                calculated: true
            },
            // how many retrieved rates to skip after buying currency (this is a manual parameter, tests will always return 0)
            buyingCoolDown: {
                range: [0],
                index: 0,
                calculated: true
            }
        }

        // stores various timers used by the application
        this.timers = {
            buyingCoolDown: 0, // stores the timer after buying crypto before new can be bought
            moodCountDown: 0 // stores the timer for the emoji that reflects the machine state
        }

        this.wallet = 10000;// the live wallet

        this.state = {
            updateInterval: 5000,
            rate: 0,
            maxChartValues: (3600 * 1000) / 5000, // with an interval of 5000ms, this results in 720 values for one hour
            rateValues: [],
            liveChart: null,
            regressionValues: [],
            threads: [],
            walletStart: 10000, // the initial wallet
            market: Markets.Bitcoin,
            messages: [],
            transactionRate: 0.005
        };


        this.update = this.update.bind(this);
        this.updateRate = this.updateRate.bind(this);
        this.updateFeedback = this.updateFeedback.bind(this);
        this.logMessage = this.logMessage.bind(this);
        this.updateMood = this.updateMood.bind(this);
        this.softReset = this.softReset.bind(this);
        this.hardReset = this.hardReset.bind(this);
        this.forceSell = this.forceSell.bind(this);
        this.forceBuy = this.forceBuy.bind(this);
    }

    componentDidMount() {
        this.update();

        // show some statistics
        this.logMessage(`market: ${this.state.market}`);
        this.logMessage(`updateInterval: ${this.state.updateInterval}`);
        this.logMessage(`maxChartValues: ${this.state.maxChartValues}`);
        this.logMessage(`wallet: ${this.wallet}`);
        this.getLiveBudget();
    }

    componentDidUpdate() {
        const { testConfig } = this.props;

        if (this.props.runAutomatedTest && testConfig && Object.keys(testConfig).length) {
            this.logMessage('received results from automated test:');

            Object.keys(this.config).forEach(key => {
                if (testConfig[key] || testConfig[key] === 0) {

                    // todo: more assertion and error handling, please. this is critical

                    this.logMessage(`replaced ${key} from ${this.config[key].range[this.config[key].index]} to ${testConfig[key]} `);
                    this.config[key].range = [testConfig[key]];
                } else {
                    this.logMessage(`could not find key ${key} in testConfig after automated test, skipping`, MessageTypes.WARNING)
                }
            });

            this.props.clearTestConfig();
        }
    }

    /**
     * Gets the live budget from the API
     * todo: extract to Api (and rename that to ApiUtils while at it)
     */
    getLiveBudget() {
        Helpers.Api.expressRequest(
            `${AppConfig.api.baseUrl}/budget`,
            'GET'
        ).then(result => {
            this.logMessage(`live budget: ${result}`, result <= 0 ? MessageTypes.ERROR : MessageTypes.MESSAGE);
        }).catch(() => {
            this.logMessage('cant reach api!', MessageTypes.ERROR);
        });
    };

    /**
     * Gets the live rate from the API
     */
    getLiveRate() {
        Helpers.Api.expressRequest(
            `${AppConfig.api.baseUrl}/rate`,
            'GET'
        ).then(result => {

            // ensure it actually changed or it will pollute your regression results
            if (result !== this.state.rate) {
                this.setState({
                    rate: result
                }, () => {
                    this.storeRates(parseFloat(this.state.rate));
                })
            }
        }).catch(() => {
            this.logMessage('cant reach api!', MessageTypes.ERROR);
        });
    };

    /**
     * Stores given rate in the rates table (up to maxChartValues) if timer threshold is exceeded
     */
    storeRates(nextRate) {
        const rates = this.state.rateValues;

        rates.push(nextRate);

        this.updateChart();

        if (rates.length >= this.state.maxChartValues) {
            rates.shift();
        }

        this.setState({
            rateValues: rates
        });

        // helper to pass it on to pageTest
        this.props.storeLiveRates(this.state.rateValues);
    }

    /**
     * Updates the real rate
     */
    updateRate() {
        this.getLiveRate();
    }

    /**
     * Updates the wallet indicator in the header
     */
    updateLiveWallet() {
        const liveValue = this.getLiveValue();

        document.querySelector('#liveWallet').innerHTML= `<br/><span>Live wallet: € ${(liveValue + this.wallet).toFixed(2)}</span><span>wallet + value of running threads<br />minus transaction costs</span>`;
    }

    /**
     * Calculates the current market value for all running threads
     */
    getLiveValue() {
        let totalLiveValues = 0;

        this.state.threads.forEach(thread => {
            const transactionCosts = this.state.transactionRate * thread.inEuro;

            const liveValue = ((this.state.rate / thread.startRate) * thread.inEuro) - transactionCosts;

            totalLiveValues += liveValue;
        });

        return totalLiveValues;
    }

    updateChart() {
        const liveChart = Helpers.DashBoardUtils.getChart('liveChart', this.state.liveChart, this.state.rateValues, this.config);

        this.setState({
            liveChart
        });
    }

    updateRegression() {
        const regressionValues = Helpers.DashBoardUtils.getRegression(this.state.liveChart);

        if (regressionValues) {

            this.setState({
                regressionValues
            });
        }
    }

    /**
     * Helper that outputs feedback
     */
    updateFeedback(feedback = null) {
        if (this.getFeedback(feedback)) {
            document.querySelector('#liveFeedback').innerHTML = this.getFeedback(feedback);
        }
    }

    /**
     * Retrieves current status or sets the provided feedback immediately
     */
    getFeedback(feedback) {
        if (feedback) {
            return feedback;
        }

        if (this.config.threads.range[this.config.threads.index] === 0) {
            return 'new threads are disabled, it is now safe to exit';
        }

        const minValuesRequired = this.config.buyingHistory.range[this.config.buyingHistory.index];
        let parsedValues = '';

        if (this.state.rateValues.length < minValuesRequired) {
            parsedValues = `(collecting data: ${this.state.rateValues.length}/${this.config.buyingHistory.range[this.config.buyingHistory.index]})`;
            this.updateMood(Moods.SLEEPING);
        }

        return `retrieving live bitcoin rate ${parsedValues}`;
    }

    /**
     * The mood, shown as an emoji in the header, reflects what the code is doing
     */
    updateMood(mood) {
        if (this.timers.moodCountDown === 0 || mood === Moods.SELLING || mood === Moods.BUYING || mood === Moods.COOLING) {
            this.timers = Helpers.TimerUtils.setTimer(this.timers,'moodCountDown', 5);

            document.querySelector('#mood').innerHTML = mood;

            this.setDocumentTitle(mood, (this.getLiveValue() + this.wallet).toFixed(2));
        }
    }

    /**
     * Updates the document title with given mood and wallet value
     */
    setDocumentTitle(mood, wallet) {
        document.title = `${mood} CryptoFlow: € ${wallet}`;
    }

    /**
     * Helper to deplete timers if needed
     */
    updateTimers() {
        this.timers = Helpers.TimerUtils.depleteTimers(this.timers);
    }

    /**
     * Calculates thread budget according to wallet, open threads and config
     * todo: could be reused
     */
    getBudget() {
        const maxThreadsCount = this.config.threads.range[this.config.threads.index];

        // this way budget is always equal for each created thread
        let budget = maxThreadsCount === 999
            ? this.wallet / 2 // for infinite threads, take half the wallet
            : this.wallet / (maxThreadsCount - this.state.threads.length) // for specified threads, take out an equal part of the wallet

        // ensure budget taken out of wallet is never bigger than the configured maxBudget * walletStart
        if (budget > (this.config.threads.maxBudget * this.wallet)) {
            budget = this.config.threads.maxBudget * this.wallet;
        }

        return budget;
    }

    /**
     * This will check if a potential gain is detected, and if so, start a new watcher thread to benefit and keep track of it
     */
    checkOpportunities() {
        const maxThreads = this.config.threads.range[this.config.threads.index];

        if (!this.state.rate || this.state.rateValues.length < this.config.buyingHistory.range[this.config.buyingHistory.index]) {
            return null;
        }

        this.updateMood(Moods.THINKING);

        const buyingScore = Helpers.DashBoardUtils.getBuyingScore(this.config, this.state.rateValues, this.state.regressionValues);

        // is the buyingScore within range?
        if (buyingScore < this.config.buyingScore.range[this.config.buyingScore.index]) {
            return this.updateMood(Moods.SLEEPING);
        }

        // is there room for a new thread?
        const maxThreadsCount = this.config.threads.range === null
            ? 999
            : maxThreads;

        if (maxThreadsCount === 999 || this.state.threads.length < maxThreadsCount) {
            let threadCount = this.config.threads.simultaneously;

            if((maxThreads - this.state.threads.length) < threadCount) {
                threadCount = maxThreads - this.state.threads.length;
            }

            for (let tc = 0; tc < (buyingScore/1000 * threadCount).toFixed(0); tc++) {
                this.createThread(buyingScore);
            }
        }
    }

    /**
     * Returns the current value of a single asset bought in the past by recalculating it against the current rate
     * todo: this name is very confusing since so similar to getLiveValue please change names to reflect
     */
    calculateLiveValue(originalValue, startRate) {
        return (this.state.rate / startRate) * originalValue;
    }

    /**
     * Adds a thread (if limit not reached) with the right initial props
     */
    createThread(buyingScore) {
        if (this.timers.buyingCoolDown > 0) {
            return this.updateMood(Moods.COOLING);
        }

        // find next unused id
        let nextId = 1;

        while (this.state.threads.filter(thread => thread.id === nextId).length > 0) {
            nextId++;
        }

        const budget = this.getBudget();

        const thread = {
            id: nextId, // a unique identifier
            timestamp: Helpers.TimerUtils.getTimeStamp(), // a time stamp
            startRate: this.state.rate, // rate at which crypto was bought
            inEuro: budget, // initial worth of assets in euro
            inCrypto: budget / this.state.rate // how much crypto was bought
        }

        // todo: update database, then:
        this.state.threads.push(thread);

        this.wallet -= budget;

        // set the coolDown timer to the configured max
        this.timers.buyingCoolDown = this.config.buyingCoolDown.range[this.config.buyingCoolDown.index];

        const message = `bought ${(budget / this.state.rate).toFixed(10)} ${this.state.market} with a value of € ${budget.toFixed(2)} (buyingScore: ${buyingScore.toFixed(0)})`;
        this.logMessage(message, MessageTypes.FINANCIAL)
        this.updateFeedback(message);
        this.updateMood(Moods.BUYING);
    }

    /**
     * Removes a running thread
     */
    removeThread(id) {
        let i = 0;

        while (i < this.state.threads.length) {
            if (this.state.threads[i].id === id) {
                this.state.threads.splice(i, 1);

                break;
            }

            i++;
        }
    }

    /**
     * Iterates active threads and checks to see if this is the right time to sell
     */
    updateThreads() {
        if (!this.state.threads.length) {
            return null;
        }

        const sellingScore = Helpers.DashBoardUtils.getSellingScore(this.config, this.state.rateValues, this.state.regressionValues);

        this.state.threads.forEach(thread => {
            if (this.state.rate > thread.startRate) {
                const transactionCosts = this.state.transactionRate * thread.inEuro;
                const liveValue = this.calculateLiveValue(thread.inEuro, thread.startRate);
                const value = liveValue - transactionCosts;

                this.updateMood(Moods.THINKING)

                if (sellingScore >= this.config.sellingScore.range[this.config.sellingScore.index]) {
                    if (value > thread.inEuro) {
                        this.sell(thread.id);
                    }
                }
            }
        });
    }

    /**
     * Logs given message with given type in the messages window
     */
    logMessage(message, type = MessageTypes.MESSAGE) {
        const timestamp = Helpers.TimerUtils.getTimeStamp(true);

        this.state.messages.push({
            type,
            timestamp,
            message
        });
    }

    /**
     * Returns all active configuration parameters in a single object
     */
    getConfiguration() {
        const config = this.config;

        return {
            buyingScore: config.buyingScore.range[config.buyingScore.index],
            sellingScore: config.sellingScore.range[config.sellingScore.index],
            buyingDelta: config.buyingDelta.range[config.buyingDelta.index],
            sellingDelta: config.sellingDelta.range[config.sellingDelta.index],
            threads: config.threads.range[config.threads.index],
            maxBudget: config.threads.maxBudget,
            regression: config.regression.range[config.regression.index],
            buyingHistory: config.buyingHistory.range[config.buyingHistory.index],
            sellingHistory: config.sellingHistory.range[config.sellingHistory.index],
            buyingCoolDown: config.buyingCoolDown.range[config.buyingCoolDown.index]
        };
    }

    /**
     * Helper that removes a thread and adds its value back into the wallet
     */
    sell(threadId) {
        let thread = this.state.threads.filter(thread => thread.id === parseInt(threadId));

        if (!thread || !thread[0] || thread.length > 1) {
            return this.logMessage('could not determine thread!', MessageTypes.ERROR);
        } else {

            thread = thread[0];

            const sellingScore = Helpers.DashBoardUtils.getSellingScore(this.config, this.state.rateValues, this.state.regressionValues);
            const transactionCosts = this.state.transactionRate * thread.inEuro;

            const newValue = this.calculateLiveValue(thread.inEuro, thread.startRate) - transactionCosts;
            const message =`sold ${thread.inCrypto.toFixed(10)} ${this.state.market} with original value of € ${thread.inEuro.toFixed(2)} for € ${newValue.toFixed(2)} (sellingScore: ${sellingScore.toFixed(0)})`;
            this.logMessage(message, MessageTypes.FINANCIAL);
            this.updateFeedback(message);
            this.wallet += newValue;
            this.removeThread(thread.id);
        }
    }

    /**
     * Outputs current config in the output area
     */
    outputConfig = () => {
        const currentConfig = this.getConfiguration();

        Object.keys(currentConfig).map(key => {
            this.logMessage(`${key} : ${currentConfig[key]}`)
        })
    }

    /**
     * Resets max threads so no new ones will be started
     */
    softReset() {
        if (confirm('this will stop creating new threads, you sure?')) {
            this.config.threads.range = [0];
        }
    }

    /**
     * Immediately sells off all threads (at a possible loss)
     */
    hardReset() {
        if (confirm('this will force sale of all threads at a loss, you sure?')) {
            this.config.threads.range=[0];

            this.state.threads.forEach(thread => {
                this.sell(thread.id);
            });
        }
    }

    // todo: only for testing! remove when releasing to production!
    forceBuy() {
        if (confirm('Are you sure you want to force buy?')) {
            this.logMessage('the next transaction was forced by user', MessageTypes.WARNING)
            this.createThread(Helpers.DashBoardUtils.getBuyingScore(this.config, this.state.rateValues, this.state.regressionValues));
        }
    }

    /**
     * Immediately sells the selected thread (at a possible loss)
     */
    forceSell(event) {
        const threadId = event.target.id;

        if (confirm('Are you sure you want to sell this thread at a possible loss?')) {
            this.logMessage('the next transaction was forced by user', MessageTypes.WARNING)
            this.sell(threadId)
        }
    }

    update() {
        this.updateFeedback();
        this.updateThreads();
        this.checkOpportunities();
        this.updateRate();
        this.updateRegression();
        this.updateLiveWallet();
        this.updateTimers();

        // call update again in a timeout
        setTimeout(this.update, this.state.updateInterval);
    };

    render() {
        return (
            <main className={ !this.props.active ? 'hidden' : '' }>
                <div id="liveChartContainer" className={ style.live }>
                    <main>
                        <Chart id="liveChart" />
                        <Logger messages={ this.state.messages } />
                    </main>
                </div>

                <nav className={ style.pageControls }>
                    <button onClick={ this.outputConfig }>config</button>
                    <button className="danger" onClick={ this.softReset }>soft reset</button>
                    <button className="danger" onClick={ this.hardReset }>hard reset</button>
                    <button className="danger" onClick={ this.forceBuy }>force buy</button>
                </nav>

                <Feedback id="liveFeedback" />

                <section onClick={ event => { this.forceSell(event) } }>
                    <Threads>
                        { Helpers.DashBoardUtils.getThreadsTable(this.state.threads, this.state.rate, this.state.market) }
                    </Threads>
                </section>
            </main>
        );
    }
}

export default PageLive;
