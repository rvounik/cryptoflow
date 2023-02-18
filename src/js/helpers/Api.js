import AppConfig from './../../../config/App.config.js';
import ErrorTypes from '../constants/ErrorTypes';

export default class Api {

    /**
     * generic express request method
     * @param {string} endpoint - endpoint to call
     * @param {string} method - method to use
     * @param {object} body - post body in json format (optional)
     * @param {boolean} retry - set to true if this is a retry attempt (after calling refresh token endpoint)
     * @returns {Promise} resolved (with result) or rejected (with errors) promise
     */
    static expressRequest(endpoint, method, body = null, retry = false) {
        const self = this;

        const cachedRequest = {
            endpoint,
            method,
            body
        };

        return new Promise((resolve, reject) => {
            fetch(endpoint, {
                method: method,
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body
            })
                .then(response => {

                    /* note that a 400 resolves the Promise further down with an errors object (for field highlighting) */

                    let responseFromRetriedRequest = null;

                    if (response.status === 401 || response.status === 403) {

                        if (retry === false) {

                            // encountered 401/403, attempt to refresh access token to see if that solves it
                            responseFromRetriedRequest = new Promise((resolve, reject) => {
                                fetch(`${AppConfig.api.baseUrl}${AppConfig.api.refreshToken}`, {
                                    method: 'POST',
                                    credentials: 'include',
                                    redirect: 'follow',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                    },
                                    mode: 'cors'
                                }).then(() => {

                                    // the refresh request returned, to see if there was a new access token created, re-run
                                    // the original request (only if retry is still false, to prevent infinite loop)
                                    if (!retry) {
                                        self.expressRequest(cachedRequest.endpoint, cachedRequest.method, cachedRequest.body, true)
                                            .then(result => {

                                                // got valid response from the original request that was retried
                                                resolve(result);
                                            })
                                            .catch(() => {

                                                // request failed again, assume unauthorised
                                                reject(new Error(ErrorTypes.UNAUTHORISED));
                                            });
                                    }
                                })
                            });
                        } else {

                            // this was not the retried, but the original request. should throw Error so its picked up for retrying
                            throw new Error(ErrorTypes.UNAUTHORISED);
                        }
                    }

                    if (response.status === 409) {
                        throw new Error(ErrorTypes.UNIQUE_VIOLATION);
                    }

                    if (response.status === 500) {
                        throw new Error(ErrorTypes.INTERNAL_SERVER_ERROR);
                    }

                    if (responseFromRetriedRequest) {

                        // got a response from the original request that was retried
                        return resolve(responseFromRetriedRequest);
                    } else {
                        return response;
                    }
                })
                .then(response => response.json()) // convert to json
                .then(result => {

                    // resolve with result (may contain validation errors)
                    resolve(result)
                })
                .catch(errors => {

                    // any other type of error (usually database or server related) are rejected (consider logging here)
                    reject(errors)
                });
        });
    }
}

// todo: add propTypes
