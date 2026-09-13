const { randomUUID } = require('crypto');
const { publishEvent } = require('../utils/producer');
const logger = require('../utils/logger');

const initiateTransfer = async (req, res) => {
    const correlationId = req.headers['x-correlation-id'];
    const { fromAccountId, toAccountId, amount, referenceId } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !referenceId) {
        return res.status(400).json({ error: 'fromAccountId, toAccountId, amount, and referenceId are required.', });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be greater than zero.' });
    }
    if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: 'Source and destination accounts must be distinct.' });
    }

    // generate a unique transaction id
    const transactionId = randomUUID();

    // event payload
    const eventPayload = {
        transactionId,
        referenceId,
        fromAccountId: parseInt(fromAccountId),
        toAccountId: parseInt(toAccountId),
        amount: transferAmount,
        status: 'PENDING',
        timestamp: new Date().toISOString()
    };

    try {
        const routingKey = process.env.ROUTING_KEY;
        await publishEvent(routingKey, eventPayload, correlationId);
        logger.info(correlationId, `Accepted and queued transaction ${transactionId}`);
        return res.status(202).json({
            message: 'Transaction request accepted and queued for processing.',
            transactionId,
            referenceId,
            correlationId,
            status: 'PENDING',
        });
    } catch (error) {
        console.error('Initiate Transfer Ingestion Error:', error);
        return res.status(500).json({ error: 'Failed to queue transaction for execution.' });
    }
};

module.exports = { initiateTransfer };