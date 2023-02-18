require('dotenv').config();
const app = require('./express/app');

const PORT = 8008;

async function init() {
    app.listen(PORT, () => {
        console.log(`Express server started on port ${PORT}.`);
    });
}

init();
