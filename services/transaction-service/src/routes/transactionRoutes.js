const express = require('express');

const { initiateTransfer } = require('../controllers/transactionController');

const router = express.Router();

router.post('/transfer', initiateTransfer);

module.exports = router;