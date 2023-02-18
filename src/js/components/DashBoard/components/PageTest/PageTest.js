import React, { Component } from 'react';

// import helpers
import Helpers from '../../../../helpers';

// import constants
import TestingParameters from '../../../../constants/TestingParameters';
import Scenarios from '../../../../constants/Scenarios';
import scenarios from '../../../../scenarios';
import MessageTypes from '../../../../constants/MessageTypes';
import Markets from '../../../../constants/Markets';

// import components
import Chart from './../Chart/Chart';
import Logger from './../Logger/Logger';
import Feedback from './../Feedback/Feedback';
import Threads from './../Threads/Threads';
import ScenarioForm from './components/ScenarioForm/ScenarioForm';

import style from './style/test.scss';

class PageTest extends Component {
    constructor(props) {
        super(props);

        // if you make threads with smaller budgets, the decreased transaction costs are still a percentage,
        // and that percentage wont weight up to the percentage of increased value

        // todo: move to external json
        this.config = {
            // how may threads can run at the same time. more threads means more opportunities, but each will have less value
            threads: {
                range: [10, 1, 5, 7, 12, 15, 20], // [1, 5, 7, 12, 15, 20], 20 (999 for unlimited) 100? so threads get into profit sooner?
                index: 0,
                simultaneously: 10, // how many threads can be started at the same time
                maxBudget: 0.01, // this percentage determines how much each tread takes out of the wallet // 0.15
                calculated: false
            },
            // a general score combined of several factors (less means more risk)
            buyingScore: {
                range: [125, 25, 50, 100, 200, 350, 500], // [25, 50, 100, 200, 350, 500], // 100 // 125?
                index: 0,
                calculated: false
            },
            // a general score combined of several factors (less means more risk)
            sellingScore: {
                range: [50, 10, 30, 90, 120, 200], // [10, 30, 50, 90, 120, 200], // 50
                index: 0,
                calculated: false
            },
            // how much within regression range must the rate be, before buying (higher buys at better rate, but risks missing opportunities)
            buyingDelta: {
                range: [0.1, 0.05, 0.35, 0.6, 0.9], // [0.05, 0.1, 0.35, 0.6, 0.9], // 0.1
                index: 0,
                calculated: false
            },
            // how much within regression range must the rate be, before selling (lower sells quicker, but possibly at less profit)
            sellingDelta: {
                range: [0.6, 0.1, 0.3, 0.8, 1], // [0.1, 0.3, 0.6, 0.8, 1], // 0.6
                index: 0,
                calculated: false
            },
            // what kind of regression to use (linear is more accurate, polynomial is more predictive)
            regression: {
                range: ['polynomial4', 'linear'], // ['polynomial4', 'linear'], // 'polynomial4'
                index: 0,
                calculated: false
            },
            // how many historic rates to collect before buyingScore can be calculated (too high: no room to buy on a spike)
            buyingHistory: {
                range: [60, 30, 120, 240, 300], // [30, 60, 120, 240], // [30, 60, 120, 240, 300], // 60 (5 minutes with a refresh of 5000ms)
                index: 0,
                calculated: false
            },
            // how many historic rates to collect before sellingScore can be calculated (too high: no room to sell on a drop)
            sellingHistory: {
                range: [12, 6, 30, 60, 120], // [6, 12, 30, 60, 120], // 12 (1 minute with a refresh of 5000ms)
                index: 0,
                calculated: false
            },
            // how many retrieved rates to skip after buying currency (this is a manual parameter, tests will always return 0)
            buyingCoolDown: {
                range: [3, 0, 2, 5, 10, 20, 50, 100, 150, 300], // [0, 2, 5, 10, 20, 50, 100, 150, 300], // 3 (this prevents missed opportunities on high drops)
                index: 0,
                calculated: false
            }
        }

        // ensure the calculated flag is set for parameters without a range
        Object.keys(this.config).forEach(param => { this.config[param].calculated = this.config[param].range.length === 1 })

        // stores various timers used by the application
        this.timers = {
            buyingCoolDown: 0
        }

        this.wallet = 10000;

        this.state = {
            selectedScenarios: [], // collection
            scenarioIndex: 0, // scenario
            scenarioStep: 0, // value
            bestConfigs: [],
            tempBestConfig: {},
            updateInterval: 0,
            rate: 0,
            maxChartValues: (3600 * 1000) / 5000, // 720,
            rateValues: [],
            testChart: null,
            regressionValues: [],
            threads: [],
            walletStart: 10000,
            market: Markets.Bitcoin,
            messages: [],
            transactionRate: 0.005,
            randomHighLowRatio: .5, // when scenario is random, what is the chance for peak (> .5) / drop (< .5) ?
            liveRates: [] // holds actual live values coming from PageLive, to run the hourly test on
        };

        this.updateTests = this.updateTests.bind(this);
        this.updateRate = this.updateRate.bind(this);
        this.updateFeedback = this.updateFeedback.bind(this);
        this.logMessage = this.logMessage.bind(this);
        this.submitScenarioForm = this.submitScenarioForm.bind(this);
        this.getConfiguration = this.getConfiguration.bind(this);
        this.getProfitSuccessRate = this.getProfitSuccessRate.bind(this);
        this.getBestConfigs = this.getBestConfigs.bind(this);
        this.getTempBestConfig = this.getTempBestConfig.bind(this);
        this.getRates = this.getRates.bind(this);
        this.startAutomatedTest = this.startAutomatedTest.bind(this);
        this.stopTest = this.stopTest.bind(this);
        this.createThread = this.createThread.bind(this);
        this.updateThreads = this.updateThreads.bind(this);
        this.resetScenarioForNextTest = this.resetScenarioForNextTest.bind(this);
        this.getScenarioRate = this.getScenarioRate.bind(this);
    }

    componentDidMount() {
        this.updateTests();

        // show some statistics
        this.logMessage(`market: ${this.state.market}`);
        this.logMessage(`updateInterval: ${this.state.updateInterval}`);
        this.logMessage(`maxChartValues: ${this.state.maxChartValues}`);
        this.logMessage(`wallet: ${this.wallet}`);

        // setInterval(this.startAutomatedTest, 3600000);
        setInterval(this.startAutomatedTest, 3600000);
    }

    startAutomatedTest() {
        if (!this.props.runAutomatedTest) {
            return null;
        }

        if (this.state.selectedScenarios.length) {
            return this.logMessage('could not start automated test, test running', MessageTypes.WARNING);
        }

        if (!this.props.liveRates) {
            return this.logMessage('no valid rates were found, cannot run automated test', MessageTypes.ERROR);
        }

        this.logMessage(`starting automated hourly test with ${this.props.liveRates.length} values`);

        this.setState({
            selectedScenarios: ['automatedTest']
        });
    }

    /**
     * Returns the next un-calculated testing parameter
     */
    getTestingParameter() {
        if (!this.config.threads.calculated) { return TestingParameters.THREADS }
        if (!this.config.buyingScore.calculated) { return TestingParameters.BUYING_SCORE }
        if (!this.config.sellingScore.calculated) { return TestingParameters.SELLING_SCORE }
        if (!this.config.buyingDelta.calculated) { return TestingParameters.BUYING_DELTA }
        if (!this.config.sellingDelta.calculated) { return TestingParameters.SELLING_DELTA }
        if (!this.config.regression.calculated) { return TestingParameters.REGRESSION }
        if (!this.config.buyingHistory.calculated) { return TestingParameters.BUYING_HISTORY }
        if (!this.config.sellingHistory.calculated) { return TestingParameters.SELLING_HISTORY }
        if (!this.config.buyingCoolDown.calculated) { return TestingParameters.BUYING_COOL_DOWN }

        return null;
    }

    /**
     * Resets the current scenario, stores its values as bestConfig (if better), then moves to next testing parameter
     */
    resetScenarioForNextTest() {
        const { threads, bestConfigs, walletStart } = this.state;
        const config = this.config;

        // if there are threads running, end them and add their current asset value back to the wallet
        let newValues = 0;

        while (threads.length) {
            threads.forEach(thread => {
                newValues += this.calculateLiveValue(thread.inEuro, thread.startRate);
                this.removeThread(thread.id);
            });
        }

        // also update the local var
        this.wallet += newValues;

        // with all thread values in wallet, check if profit is higher than previous best (if it exists), then overwrite it
        // note that it should always be defined as a percentage, in case other scenarios simply work with higher rates
        const profit = this.wallet / walletStart;

        this.logMessage(`profit made: €${this.wallet - walletStart} (${profit} * wallet)`)

        // if there is no profit set in the current best config, or it is lower than the current, overwrite it
        if (!this.state.tempBestConfig.hasOwnProperty('profit') ||
            parseFloat(this.state.tempBestConfig.profit) < profit
        ) {
            this.setState({
                tempBestConfig: {
                    profit: profit.toFixed(6),
                    ...this.getConfiguration()
                }
            });
        }

        let testingParameter = this.getTestingParameter();

        if (testingParameter) {
            if (config[testingParameter].index === config[testingParameter].range.length - 1) {

                // this was the last parameter in parameter range, set calculated to true
                config[testingParameter].calculated = true;

                // extract the best of the set for this parameter
                const bestValueForParameter = this.state.tempBestConfig[testingParameter];

                // persist the best parameter in the config so next to-be calculated parameter is calculated with the best of the previous one
                config[testingParameter].index = config[testingParameter].range.indexOf(bestValueForParameter);

                this.logMessage(`done testing all values in range for ${testingParameter}`)

                // retrieve next testing parameter (if available. otherwise it will jump to next scenario a bit further down)
                testingParameter = this.getTestingParameter();
            } else {

                // since the index was not at the last parameter in the range, move to next parameter in the range
                config[testingParameter].index++;
                this.logMessage(`moving to next parameter value in range (${this.config[testingParameter].range[this.config[testingParameter].index]})`)
            }
        }

        if (!testingParameter) {

            // tested all parameters, moving to next scenario (if available)
            this.logMessage(`done testing scenario: ${this.state.selectedScenarios[this.state.scenarioIndex]}`)

            // above you can see tempBestConfig is always set to the most profitable test run for the current scenario
            // and since the above code also always picks the best parameter you can be sure tempBestConfig is the best
            // config possible (please double check this at some point). Therefore its save to save it to bestConfigs
            // as being the best config for this scenario.
            // todo: consider renaming bestConfigs to bestScenarioConfigs for clarity
            bestConfigs.push(this.state.tempBestConfig);

            if (this.state.scenarioIndex < this.state.selectedScenarios.length - 1) {

                // move to next scenario
                this.setState({
                    scenarioIndex: this.state.scenarioIndex + 1, // move index one up
                    tempBestConfig: {} // reset tempBestConfig for next scenario
                }, () => {
                    this.logMessage(`now testing scenario: ${this.state.selectedScenarios[this.state.scenarioIndex]}`)
                })

                // ensure the calculated flag is unset for parameters with a range and reset the index, too
                Object.keys(config).forEach(param => {
                    config[param].calculated = config[param].range.length === 1;
                    config[param].index = 0;
                });

                // in case the new scenario is RANDOM, ensure previously calculated RANDOM scenario values are cleared
                if (this.state.selectedScenarios[this.state.scenarioIndex] === Scenarios.RANDOM) {
                    scenarios[this.state.selectedScenarios[this.state.scenarioIndex]] = [scenarios[this.state.selectedScenarios[this.state.scenarioIndex]][0]];
                }

            } else {

                // ran all scenarios
                this.logMessage(`profit success rate: ${this.getProfitSuccessRate()} / ${this.state.bestConfigs.length}`);

                // reset calculated and index
                Object.keys(config).forEach(param => {
                    config[param].calculated = true;
                    config[param].index = 0;
                });

                // calculate the best config by using median on all config parameters
                const avgConfig = {};

                Object.keys(bestConfigs[0]).forEach(key => {

                    // skip these parameters since they cannot be calculated as median
                    const invalidKeyIds = ['regression', 'profit', 'scenario', 'maxBudget'];

                    if (!invalidKeyIds.includes(key)) {
                        const tc = [];

                        bestConfigs.forEach(bc => {
                            tc.push(bc[key])
                        });

                        avgConfig[key] = Helpers.Utils.median(tc);
                    }
                });

                // the regression parameter should still be copied to config, but not as a median (its a string)
                // so figure out which value was most often selected by the testing algorithm
                const tempRegressionResult = [];

                bestConfigs.forEach(bc => {
                    tempRegressionResult.push(bc.regression);
                });

                // save the regression parameter string that was most often chosen
                avgConfig.regression = Helpers.Utils.mostFrequent(tempRegressionResult);

                if (bestConfigs.length > 1) {

                    // save avgConfig
                    Object.keys(avgConfig).forEach(key => {
                        if (config[key]) {
                            config[key].range = [avgConfig[key]];
                        }
                    });
                }

                console.log('outputting best avg config:')
                this.outputConfig();

                // if there is at least one bestConfig the results can be passed on to pageLive (if setting is active)
                if (this.state.bestConfigs.length >= 1) {
                    if (this.props.autoAddConfig && this.state.selectedScenarios[0] === 'automatedTest') {
                        this.logMessage('done running automated test, sending results')
                        this.props.storeTestConfig(avgConfig);
                    }
                }

                // clear selected scenarios so testing ends
                this.setState({
                    bestConfigs: [],
                    selectedScenarios: [],
                    tempBestConfig: {},
                    scenarioStep: 0 // todo: at least I think it should be 0..?
                });

                // reset the calculated flag for each parameter
                Object.keys(config).forEach(param => {
                    config[param].calculated = config[param].range.length === 1;
                    config[param].index = 0;
                });
            }
        }

        // clear timers
        Helpers.TimerUtils.clearTimers(this.timers);

        this.wallet = walletStart;

        // clear parameters used by test
        this.setState({
            threads: [],
            regressionValues: [],
            rateValues: [],
            scenarioStep: 0 // reset scenario step (dont reset the index or it will keep running the first scenario)
        });
    }

    /**
     * Outputs how many scenarios were able to return a profit
     */
    getProfitSuccessRate() {
        let profitCounter = 0;

        this.state.bestConfigs.forEach(bestConfig => {
            if (bestConfig.profit && bestConfig.profit > 1) {
                profitCounter++
            }
        });

        return profitCounter;
    }

    submitScenarioForm(event) {
        event.preventDefault();

        const selectedScenarios = [];
        let checkboxes = document.querySelectorAll('#scenarioForm input[type=checkbox]:checked')

        for (let i = 0; i < checkboxes.length; i++) {
            selectedScenarios.push(checkboxes[i].value)
        }

        this.setState({
            selectedScenarios
        });
    }

    /**
     * Stores given rate in the rates table (up to maxChartValues) if timer threshold is exceeded
     */
    storeRates(nextRate) {
        const rates = this.state.rateValues;

        rates.push(nextRate);

        if (rates.length >= this.state.maxChartValues) {
            rates.shift();
        }

        this.setState({
            rateValues: rates
        });
    }

    /**
     * Gets the next rate from the mocked scenario
     */
    getScenarioRate() {
        const currentScenario = scenarios[this.state.selectedScenarios[this.state.scenarioIndex]];

        if (this.state.selectedScenarios[this.state.scenarioIndex] === Scenarios.RANDOM) {
            if (currentScenario.length < this.state.maxChartValues) {
                let lastValue = currentScenario[currentScenario.length - 1];

                // determine the next increase/decrease step. 500 is a magic number that results in a believable number
                let step = Math.random() * (lastValue / 500);

                // randomise whether to add or subtract (.5 is exactly random, anything higher means decreasing rate)
                step = Math.random() < this.state.randomHighLowRatio
                    ? lastValue + step
                    : lastValue - step

                currentScenario.push(
                    step
                );
            }

            this.state.scenarioStep++;

            // set new rate
            this.setState({
                rate: currentScenario[this.state.scenarioStep]
            });

            this.storeRates(parseFloat(this.state.rate));
            this.updateChart();

            if (this.state.rateValues.length >= this.state.maxChartValues - 1) {

                // for scenario.RANDOM, end scenario when maxChartValues is reached (others end when last value is reached)
                this.resetScenarioForNextTest();
            }
        } else if (this.state.selectedScenarios[0] === 'automatedTest') {

            // detected another special case, this time being the automated test
            this.state.scenarioStep++;

            if (this.state.scenarioStep === this.props.liveRates.length) {
                this.resetScenarioForNextTest();
            } else {

                // set new rate
                this.state.rate = this.props.liveRates[this.state.scenarioStep];

                this.storeRates(parseFloat(this.state.rate));
                this.updateChart();
            }
        } else if ((this.state.scenarioStep + 1) < currentScenario.length) {

            // move to the next step (value) in the scenario
            this.state.scenarioStep++;

            // set new rate
            this.state.rate = currentScenario[this.state.scenarioStep];

            this.storeRates(parseFloat(this.state.rate));
            this.updateChart();

        } else {

            // scenario exhausted
            this.resetScenarioForNextTest();
        }
    }

    /**
     * Updates either the scenario rate or the real rate
     */
    updateRate() {
        this.getScenarioRate();
    }

    /**
     * Calculates the current market value for all running threads
     */
    getLiveValue() {
        let totalLiveValues = 0;

        this.state.threads.forEach(thread => {
            const transactionCosts = this.transactionRate * thread.inEuro;

            const liveValue = ((this.state.rate / thread.startRate) * thread.inEuro) - transactionCosts;

            totalLiveValues += liveValue;
        });

        return totalLiveValues;
    }

    updateChart() {

        // do not show automated tests. they slow down a lot
        if (this.state.selectedScenarios[0] !== 'automatedTest' && this.props.active) {
            const testChart = Helpers.DashBoardUtils.getChart('testChart', this.state.testChart, this.state.rateValues, this.config, 'blue');

            this.setState({
                testChart
            });
        }
    }

    updateRegression() {
        const regressionValues = Helpers.DashBoardUtils.getRegression(this.state.testChart);

        if (regressionValues) {

            this.setState({
                regressionValues
            });
        }
    }

    /**
     * Helper that outputs testing status
     */
    updateFeedback() {
        let output = 'select one or more scenarios to run';

        if (this.state.selectedScenarios[this.state.scenarioIndex]) {
            output=`testing scenario: ${this.state.selectedScenarios[this.state.scenarioIndex]}`

            // extend with parameter if available
            if (this.getTestingParameter()) {
                output+=`, parameter: ${this.getTestingParameter()} (${this.config[this.getTestingParameter()].index+1}/${this.config[this.getTestingParameter()].range.length})`
            }
        }

        document.querySelector('#testFeedback').innerHTML = output;
    }

    /**
     * Helper to deplete timers if needed
     */
    updateTimers() {
        this.timers = Helpers.TimerUtils.depleteTimers(this.timers);
    }

    /**
     * Calculates thread budget according to wallet, open threads and config
     * * todo: could be reused
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

        const buyingScore = Helpers.DashBoardUtils.getBuyingScore(this.config, this.state.rateValues, this.state.regressionValues);

        // is the buyingScore within range?
        if (buyingScore < this.config.buyingScore.range[this.config.buyingScore.index]) {
            return;
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

            // console.log('I could start ', threadCount, 'threads right now..')

            this.createThread(buyingScore);

            this.wallet = this.wallet - this.getBudget()
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
            return;
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

        const newThreads = Object.assign([], this.state.threads);

        newThreads.push(thread);

        this.setState({
            threads: newThreads,
        });

        // set the coolDown timer to the configured max
        this.timers.buyingCoolDown = this.config.buyingCoolDown.range[this.config.buyingCoolDown.index];

        this.logMessage(`bought ${(budget / this.state.rate).toFixed(10)} ${this.state.market} with a value of € ${budget.toFixed(2)} (buyingScore: ${buyingScore.toFixed(0)})`, MessageTypes.FINANCIAL);
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
            scenario: this.state.selectedScenarios[this.state.scenarioIndex],
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

            this.updateFeedback(`sold ${thread.inCrypto.toFixed(10)} ${this.state.market} with original value of € ${thread.inEuro.toFixed(2)} for € ${newValue.toFixed(2)} (sellingScore: ${sellingScore.toFixed(0)})`);
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

    getBestConfigs() {
        console.log(this.state.bestConfigs)
    }

    getTempBestConfig() {
        console.log(this.state.tempBestConfig)
    }

    getRates() {
        console.log(this.state.rateValues)
    }

    stopTest() {
        this.setState({
            selectedScenarios: []
        });
    }

    updateTests() {
        this.updateFeedback();

        if (this.state.selectedScenarios.length) {
            this.updateThreads();
            this.checkOpportunities();
            this.updateRate();
            this.updateRegression();
            this.updateTimers();
        }

        setTimeout(this.updateTests, this.state.updateInterval);
    }

    render() {
        return (
            <main className={ !this.props.active ? 'hidden' : '' }>
                <div id="testChartContainer" className={style.test}>
                    <main>
                        <Chart id="testChart" />
                        <Logger messages={ this.state.messages } />
                    </main>
                </div>

                <nav className={ style.pageControls }>
                    <button onClick={ this.stopTest }>pause test</button>
                    <button onClick={ this.outputConfig }>config</button>
                    <button onClick={ this.getBestConfigs }>bestConfigs</button>
                    <button onClick={ this.getTempBestConfig }>tempBestConfig</button>
                    <button onClick={ this.getRates }>rates</button>
                </nav>

                <Feedback id="testFeedback" />

                { !this.state.selectedScenarios.length
                    ? <ScenarioForm submitScenarioForm={ this.submitScenarioForm }/>
                    : null }

                <section onClick={ event => { this.forceSell(event) } }>
                    <Threads>
                        { Helpers.DashBoardUtils.getThreadsTable(this.state.threads, this.state.rate, this.state.market) }
                    </Threads>
                </section>

            </main>
        );
    }
}

export default PageTest;
