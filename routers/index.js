const path = require('path');
const apiFallback = require('connect-history-api-fallback');

const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;

router.get('/gotcha', charController.gotcha, (req, res) => {
    if(res.locals.rows) {
        res.render('index', { page: 'index', charList: res.locals.rows });
    } else {
        res.status(400).send('No data!!');
    }
});

router.get('/toImg/:type', charController.toImg);
router.get('/getImg/:file', charController.getImg);

router.post('/linewebhook', charController.bot());

router.get(/^\/settings\/.*$/, apiFallback(), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/dist/index.html'));
});

module.exports = router;
