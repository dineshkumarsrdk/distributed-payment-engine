const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
    const { accountId } = req.params;
    try {
        const auditLog = await AuditLog.find({
            $or: [
                { debtorAccountId: parseInt(accountId) },
                { creditorAccountId: parseInt(accountId) }
            ]
        }).sort({ createdAt: -1 });
        return res.status(200).json({ accountId, count: auditLog.length, auditLog });
    } catch (error) {
        console.error('Fetch Audit Logs Error:', error);
        return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
}

module.exports = {getAuditLogs};