const bitvavo = require('bitvavo')().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET,
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    WSURL: 'wss://ws.bitvavo.com/v2/',
    DEBUGGING: false
})

async function getBudget(req, res) {
    let response;

    try {
        response = await bitvavo.account();

        if (response && response.fees && response.fees.volume) {
            res.status(200).json(response.fees.volume);
        }
    } catch (error) {
        res.status(200).json({error: 'cant reach api'});
    }
}

module.exports = {
    getBudget
};
