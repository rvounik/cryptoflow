import React, { Component } from 'react';

const TimerUtils = {
    /**
     * Deplete timers if needed
     */
    depleteTimers(timers) {
        Object.keys(timers).forEach(timer => {
            if (timers[timer] > 0) {
                timers[timer]--;
            }
        });

        return timers;
    },

    /**
     * Set given timer to given value
     */
    setTimer(timers, timer, value) {
        timers[timer] = value;

        return timers;
    },

    /**
     * Clears timers
     */
    clearTimers(timers) {
        Object.keys(timers).forEach(timer => {
            timers[timer] = 0;
        });

        return timers;
    },

    /**
     * Returns a date- or timeStamp
     */
    getTimeStamp(short) {
        if (short) {
            return new Date().toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }

        return new Date().toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }
}

export default TimerUtils;
