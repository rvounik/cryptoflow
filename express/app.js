const express = require('express');
const cors = require('cors');
const nocache = require('nocache');

const app = express();

// parse requests and responses as urlencoded and json
// since 4.16: https://stackoverflow.com/questions/47232187/express-json-vs-bodyparser-json/47232318#47232318
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// apply cors middleware and set it to include credentials on cross-origin requests
app.use(cors({ credentials: true, origin: true }));

// disable cache
app.use(nocache());

// define routes
const routes = {
    rate: require('./routes/rate.js'),
    budget: require('./routes/budget.js')
};

// middleware that adds an allow-origin header for the dev domain
const setOriginHeader = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:9009');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
};

app.get(
    `/rate`,
    cors(),
    setOriginHeader,
    routes.rate.getRate
);

app.get(
    `/budget`,
    cors(),
    setOriginHeader,
    routes.budget.getBudget
);

module.exports = (app);
