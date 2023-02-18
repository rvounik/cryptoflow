import React, { Component } from 'react';

const Utils = {

    /* returns the average of the given array of values */
    arrayAverage(arr) {
        return arr.reduce((p, c) => p + c, 0);
    },

    /* returns the median of the given array of numbers */
    median(numbers) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }

        return sorted[middle];
    },

    /* returns the most frequent value of the given array */
    mostFrequent(arr) {
        const hashmap = arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        },{})

        return Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b)
    }
}

export default Utils;
