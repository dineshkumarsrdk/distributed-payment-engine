const express = require('express');
const { createAccount, getAccountById } = require('../controllers/accountController');

const router = express.Router();

router.post('/', createAccount);
router.get('/:id', getAccountById);

module.exports = router;