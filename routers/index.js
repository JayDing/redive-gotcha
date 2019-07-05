const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;

router.get('/', charController.gotcha, (req, res) => {
    if(res.locals.rows) {
        res.render('index', { page: 'index', charList: res.locals.rows });
    } else {
        res.status(400).send('No data!!');
    }
});

router.get('/settings', charController.list, (req, res) => {
    if(res.locals.rows) {
        res.render('settings', { page: 'settings', charList: res.locals.rows });
    } else {
        res.status(400).send('No data!!');
    }
});

router.post('/settings', express.urlencoded({ extended: true }), charController.update, (req, res) => {
    if(res.locals.queryResult) {
        res.redirect(301, '/settings');
    } else {
        res.status(400).send('Update Failed!!');
    }
});


router.get('/toImg', charController.toImg);
router.get('/toImg/:file', charController.getImg);

router.post('/linewebhook', charController.bot());

module.exports = router;
