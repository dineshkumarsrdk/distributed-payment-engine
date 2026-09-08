const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogsController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/:accountId', getAuditLogs);

module.exports = router;