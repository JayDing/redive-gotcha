const express = require('express');
const router = express.Router();

const charController = require('../controllers').characters;
const poolsController = require('../controllers').pools;

router.get('/', (req, res) => res.status(200).send({
    message: 'redive gotcha!'
}));

router.get('/charList/:type', charController.list, (req, res) => res.json(res.locals.rows));
router.post('/charList/update/:type', express.json(), charController.update, (req, res) => res.json(res.locals.queryResult)); 

router.get('/pools', poolsController.list, (req, res) => res.json(res.locals.rows));
router.post('/pools/update', express.json(), poolsController.update, (req, res) => res.json(res.locals.queryResult));

module.exports = router;