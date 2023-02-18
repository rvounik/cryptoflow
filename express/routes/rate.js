const bitvavo = require('bitvavo')().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET,
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    WSURL: 'wss://ws.bitvavo.com/v2/',
    DEBUGGING: false
})

async function getRate(req, res) {
    let response;
    let price = null;

    try {
        response = await bitvavo.tickerPrice({ market: 'BTC-EUR' });

        if (response && response.price) {
            price = response.price;

            res.status(200).json(parseFloat(price));
        }
    } catch (error) {
        res.status(200).json({error: 'cant reach api'});
    }

}

module.exports = {
    getRate
};
