const db = require('../config/db');

const createAccount = async (req, res) => {
    const { userId, initialDeposit, currency } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required.' });
    }

    const deposit = initialDeposit ? parseFloat(initialDeposit) : 0.00;
    if (deposit < 0) {
        return res.status(400).json({ error: 'Initial deposit cannot be negative.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO accounts (user_id, balance, currency) VALUES ($1, $2, $3) RETURNING *`,
            [userId, deposit, currency]
        );
        return res.status(201).json({
            message: 'Account created successfully',
            account: result.rows[0],
        });
    } catch (error) {
        console.error('Create Account Error:', error);
        return res.status(500).json({ error: 'Failed to create account.' });
    }
};

const getAccountById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found.' });
        }
        // console.log('get account', result);
        return res.status(200).json({ account: result.rows[0] });
    } catch (error) {
        console.error('Get Account Error:', error);
        return res.status(500).json({ error: 'Failed to fetch account.' });
    }
};

const compensateTransfer = async (req, res) => {
    const { originalReferenceId, reason } = req.body;

    if (!originalReferenceId) {
        return res.status(400).json({ error: 'originalReferenceId is required.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const originalEntries = await client.query(
            `SELECT account_id, entry_type, amount FROM ledger_entries WHERE reference_id = $1`,
            [originalReferenceId]
        );

        const debitEntry = originalEntries.rows.find(e => e.entry_type === 'DEB');
        const creditEntry = originalEntries.rows.find(e => e.entry_type === 'CRE');
        const reversalAmount = Math.abs(parseFloat(debitEntry.amount));
        const compensationRef = `REV-${originalReferenceId}`;

        const accountIds = [debitEntry.account_id, creditEntry.account_id].sort((a, b) => a - b);
        await client.query('SELECT id FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', accountIds);

        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [reversalAmount, debitEntry.account_id]);
        await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [reversalAmount, creditEntry.account_id]);

        await client.query(
            'INSERT INTO ledger_entries (account_id, amount, entry_type, reference_id) VALUES ($1, $2, $3, $4)',
            [debitEntry.account_id, reversalAmount, 'CRE', compensationRef]
        );
        await client.query(
            'INSERT INTO ledger_entries (account_id, amount, entry_type, reference_id) VALUES ($1, $2, $3, $4)',
            [creditEntry.account_id, -reversalAmount, 'DEB', compensationRef]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            message: 'Compensation successful. Funds reverted.',
            compensationRef,
            reason
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Compensation Failed:', error);
        return res.status(500).json({ error: 'Failed to compensate transaction.' });
    } finally {
        client.release();
    }
}

module.exports = { createAccount, getAccountById, compensateTransfer };