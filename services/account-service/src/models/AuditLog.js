const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        referenceId: { type: String, required: true, index: true },
        debtorAccountId: { type: String, required: true, index: true },
        creditorAccountId: { type: String, required: true, index: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
        failureReason: { type: String, default: null },
        metadata: {
            ipAddress: { type: String },
            userAgent: { type: String }
        }
    },
    {
        timestamps: true // adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);