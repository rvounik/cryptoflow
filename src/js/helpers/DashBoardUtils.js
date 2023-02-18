import React, { Component } from 'react';
import Chart from 'chart.js/auto';

import Moods from "../constants/Moods";
import Helpers from "./index";

const DashBoardUtils = {
    getChart(id, element, rateValues, config, lineColor = 'red') {
        const ctx = document.getElementById(id);

        const graphValues = rateValues.map((val, index) => {
            return {
                x: index,
                y: val
            }
        });

        if (element) {
            element.destroy();
        }

        return new Chart(ctx, {
            type: 'line',
            plugins: [
                ChartRegressions
            ],
            data: {
                datasets: [
                    {
                        label: rateValues[rateValues.length - 1] || '',
                        data: graphValues,
                        regressions: {
                            type: config.regression.range[config.regression.index],
                            line: { color: lineColor, width: 2 },
                            calculation: { precision: 10, order: 2 }
                        }
                    }
                ]
            },
            options: {
                legend: {
                    display: true
                },
                responsive: true,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        display: false // there is no need to show an axis with timestamps since its linear
                    }
                }
            }
        });
    },

    getRegression(element) {
        let regression = null;
        let points = null;

        if (element && ChartRegressions && ChartRegressions.getDataset(element, 0) && ChartRegressions.getDataset(element, 0)) {
            regression = ChartRegressions.getDataset(element, 0);

            if (regression && regression.sections && regression.sections[0] && regression.sections[0].result && regression.sections[0].result.points) {
                points = regression.sections[0].result.points;

                // store the whole regression points array for easier access
                return points;
            }
        }
    },

    /**
     * Draws a table with threads and their specifications
     * todo: convert to JSX-style approach so its easier to add click events etc.
     */
    getThreadsTable(threads, rate ,market) {
            return <React.Fragment>
                <table>
                    <thead>
                    <tr>
                        <td>THREAD</td>
                        <td>TIME</td>
                        <td>START RATE</td>
                        <td>EURO</td>
                        <td>{ market }</td>
                        <td>LIVE</td>
                        <td>ACTIONS</td>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        threads.map(thread => {
                        const liveValue = (rate / thread.startRate) * thread.inEuro;

                        return <tr key={ thread.id }>
                            <td>{ thread.id }</td>
                            <td>{ thread.timestamp }</td>
                            <td>{ thread.startRate }</td>
                            <td>€ { thread.inEuro.toFixed(2) }</td>
                            <td>{ thread.inCrypto }</td>
                            <td>€ { liveValue.toFixed(2) }</td>
                            <td><button className="danger" id={ thread.id }>force sell</button></td>
                            </tr>
                        })
                    }
                    </tbody>
                </table>
            </React.Fragment>;
    },

    /**
     * Returns a score indicating whether this is a good time to buy
     */
    getBuyingScore(config, rateValues, regressionValues) {
        const buyingHistory = config.buyingHistory.range[config.buyingHistory.index];
        const buyingDelta = config.buyingDelta.range[config.buyingDelta.index];

        if (!rateValues || rateValues.length < buyingHistory || regressionValues.length < buyingHistory) {
            return 0;
        }

        const lastRateValues = [];
        const lastRegressionValues = [];

        // store past entries in lookup tables
        for (let i = 0; i < buyingHistory; i++) {
            lastRateValues.push(rateValues[rateValues.length - 1 - i]);
            lastRegressionValues.push(regressionValues[regressionValues.length - 1 - i][1]);
        }

        // since they are built-up in reverse, normalise them again
        lastRateValues.reverse();
        lastRegressionValues.reverse();

        // what was the highest rate and delta to regression of the past parsed entries
        const lowestRate = Math.min(...lastRateValues);
        const lowestRegression = lastRegressionValues[lastRateValues.indexOf(lowestRate)]; // todo: this is a code smell
        const lowestDelta = lowestRegression - lowestRate;

        // what is the current rate and delta to regression
        const currentRate = lastRateValues[lastRateValues.length - 1];
        const currentRegression = lastRegressionValues[lastRegressionValues.length - 1];
        const currentDelta = currentRegression - currentRate;

        let buyingScore = 0;

        // ensures the peak is behind us
        if (!isNaN(currentRegression) && currentRate >= lowestRate) {

            // ensures current rate is lower than regression
            if (currentRate <= currentRegression) {
                if ((lowestDelta * buyingDelta) < currentDelta) {
                    buyingScore = 100 * (currentDelta / lowestDelta);
                }
            }
        }

        return buyingScore;
    },

    /**
     * Returns a score indicating whether this is a good time to sell
     */
    getSellingScore(config, rateValues, regressionValues) {
        const sellingHistory = config.sellingHistory.range[config.sellingHistory.index];
        const sellingDelta = config.sellingDelta.range[config.sellingDelta.index];

        if (!rateValues || rateValues.length < sellingHistory || regressionValues.length < sellingHistory) {
            return 0;
        }

        const lastRateValues = [];
        const lastRegressionValues = [];

        // store past entries in lookup tables
        for (let i = 0; i < sellingHistory; i++) {
            lastRateValues.push(rateValues[rateValues.length - 1 - i]);
            lastRegressionValues.push(regressionValues[regressionValues.length - 1 - i][1]);
        }

        // since they are built-up in reverse, normalise them again
        lastRateValues.reverse();
        lastRegressionValues.reverse();

        // what was the highest rate and delta to regression of the past parsed entries
        const highestRate = Math.max(...lastRateValues);
        const highestRegression = lastRegressionValues[lastRateValues.indexOf(highestRate)];
        const highestDelta = highestRate - highestRegression;

        // what is the current rate and delta to regression
        const currentRate = lastRateValues[lastRateValues.length - 1];
        const currentRegression = lastRegressionValues[lastRegressionValues.length - 1];
        const currentDelta = currentRate - currentRegression;

        let sellingScore = 0;

        // ensures the peak is behind us or we are right at it
        if (currentRate <= highestRate) {

            // in case rare is equal to highest rate, the regression must be within range
            if (currentRate === highestRate) {
                if ((currentRate / currentRegression) > sellingDelta) {
                    sellingScore = 100 * (currentDelta / highestDelta);
                }
            } else {

                // if it is not, we dont care about being in range
                sellingScore = 100 * (currentDelta / highestDelta);
            }
        }

        return sellingScore;
    }
}

export default DashBoardUtils;
