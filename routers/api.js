const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;

router.get('/', (req, res) => res.status(200).send({
    message: 'redive gotcha!'
}));

router.get('/charList/:type', charController.list, (req, res) => res.json(res.locals.rows));
router.post('/charList/update/:type', express.json(), charController.update, (req, res) => res.json(res.locals.queryResult)); 

module.exports = router;