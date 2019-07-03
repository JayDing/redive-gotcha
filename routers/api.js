const express = require('express');
const router = express.Router();
const charController = require('../controllers').characters;

router.get('/api/charList', charController.list);