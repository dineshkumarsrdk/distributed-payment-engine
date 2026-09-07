const express = require('express');

const {getAuditLogs} = require('../controllers/auditLogsController');

const router = express.Router();

router.get('/:accountId', getAuditLogs);

module.exports = router;