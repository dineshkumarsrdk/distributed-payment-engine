const db = require('../config/db');

const transferFunds = async (req, res) => {
    const { fromAccountId, toAccountId, referenceId, amount } = req.body;

    if (!fromAccountId || !toAccountId || !referenceId || !amount) {
        return res.status(400).json({ error: 'fromAccountId, toAccountId, referenceId and amount are required.' });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be greater than zero.' });
    }

    if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: 'Source and destination accounts must be different.' })
    }

    // acquire dedicated client for transaction block
    const client = await db.getClient();

    try {
        // start ACID transaction
        await client.query('BEGIN');

        // row-level Lock with Deadlock Prevention
        // sort IDs so concurrent requests always acquire locks in the exact same order
        const accounts = [fromAccountId, toAccountId].sort((a, b) => a - b);

        // locks the rows so no concurrent transactions can happen
        const lockQuery = `
            SELECT id, balance FROM accounts 
            WHERE id IN ($1, $2)
            ORDER BY id FOR UPDATE
        `
        const lockResult = await client.query(lockQuery, accounts);

        if (lockResult.rows.length !== 2) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'One or both accounts do not exist.' });
        }

        // identifing locked source and target objects from result set
        const sourceAccount = lockResult.rows.find(acc => acc.id === parseInt(fromAccountId));
        // const targetAccount = lockResult.rows.find(acc => acc.id === parseInt(toAccountId));

        const currentSourceBalance = parseFloat(sourceAccount.balance);
        if (currentSourceBalance <= transferAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        // deduct from source account
        await client.query(
            'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
            [transferAmount, fromAccountId]
        );

        // credit to target account
        await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [transferAmount, toAccountId]
        );

        // double entry ledger logs
        // debit entry for source account
        await client.query(
            'INSERT INTO ledger_entries (account_id, amount, entry_type, reference_id) VALUES ($1, $2, $3, $4)',
            [fromAccountId, -transferAmount, 'DEB', referenceId]
        );

        // credit entry for destination account
        await client.query(
            'INSERT INTO ledger_entries (account_id, amount, entry_type, reference_id) VALUES ($1, $2, $3, $4)',
            [toAccountId, transferAmount, 'CRE', referenceId]
        );

        // commit Transaction
        await client.query('COMMIT');

        return res.status(200).json({
            message: 'Transfer completed successfully',
            referenceId,
            transferredAmount: transferAmount,
            fromAccountId,
            toAccountId
        });
    } catch (error) {
        // rollback transaction state on error
        await client.query('ROLLBACK');
        console.error('Transfer Transaction Failed:', error);
        return res.status(500).json({ error: 'Transaction failed and was safely rolled back.' });
    } finally {
        // release client connection back to pool
        client.release();
    }
};

module.exports = { transferFunds };