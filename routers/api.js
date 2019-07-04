const express = require('express');
const router = express.Router();
const charController = require('../controllers').characters;

router.get('/', (req, res) => res.status(200).send({
    message: 'Hello API!'
}));
router.get('/charList', charController.list);

module.exports = router;