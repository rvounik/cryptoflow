# CRYPTOFLOW

Continuously "backtesting" multi-threaded automated cryptocurrency trader. Uses plain Javascript and Express as a backend service to connect to the Bitvavo API. It allows running test scenarios with various buy/sell threshold settings. The most profitable is then stored and used to do actual live trading. This is a repeated cycle.

![Alt text](/src/assets/screenshot.png?raw=true "screenshot")

## Prerequisites

- a local .env file containing valid APIKEY and APISECRET for connecting with the bitvavo api
- yarn
- node v16. I recommend using NVM:

nvm use 16                       ; always do this before running the commands below

## Installation

`yarn install`                   ; install dependencies

## Development

`yarn run build:dev --watch`    ; build FE sources (and activate the watcher)

`yarn start`                    ; start backend

`php -S 127.0.0.1:9009 -t web/` ; start frontend

`yarn run lint`                 ; check for lint

## Notes

- on that last url you will find the application
- there is no database (yet) so to make this really efficient you need to leave it running
