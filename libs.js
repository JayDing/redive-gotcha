const request = require('request');

let cron = (ms, fn) => {
    let cb = () => {
        clearTimeout(timeout);
        timeout = setTimeout(cb, ms);
        fn();
    }

    let timeout = setTimeout(cb, ms);
}

let startKeepAlive = () => {
    cron(20 * 60 * 1000, () => {
        request('https://redive-gotcha.herokuapp.com/', (err, res, body) => {
            if(err) {
                console.error(err);
            } else {
                console.log('Are you alive? ', res.statusCode === 200);
            }
        });
    });
}

module.exports = { cron, startKeepAlive };