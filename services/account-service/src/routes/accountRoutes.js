const express = require('express');
const { createAccount, getAccountById } = require('../controllers/accountController');
const { transferFunds } = require('../controllers/fundTransferController');

const router = express.Router();

router.post('/', createAccount);
router.get('/:id', getAccountById);
router.post('/transfer', transferFunds);

module.exports = router;