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
        console.log('get account', result);
        return res.status(200).json({ account: result.rows[0] });
    } catch (error) {
        console.error('Get Account Error:', error);
        return res.status(500).json({ error: 'Failed to fetch account.' });
    }
};

module.exports = { createAccount, getAccountById };