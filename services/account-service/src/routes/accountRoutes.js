const express = require('express');
const { createAccount, getAccountById, compensateTransfer } = require('../controllers/accountController');
const { transferFunds } = require('../controllers/fundTransferController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.post('/', createAccount);
router.get('/:id', getAccountById);
router.post('/transfer', transferFunds);
router.post('/compensate', compensateTransfer);

module.exports = router;