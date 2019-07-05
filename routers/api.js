const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;

router.get('/', (req, res) => res.status(200).send({
    message: 'redive gotcha!'
}));

router.get('/charList', charController.list, (req, res) => res.send(res.locals.rows));
router.get('/gotcha', charController.gotcha, (req, res) => res.send(res.locals.rows));

module.exports = router;