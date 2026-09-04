const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
});

const initDb = async () => {
    const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'INR',
            balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ledger_entries (
            id SERIAL PRIMARY KEY,
            account_id INT NOT NULL REFERENCES accounts(id),
            amount NUMERIC(15, 2) NOT NULL,
            entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEB', 'CRE')),
            reference_id VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `

    try {
        await pool.query(createTablesQuery);
        console.log('[Account Service DB] Accounts and Ledger tables verified.');
    } catch (error) {
        console.error('[Account Service DB] Error initializing schema:', error);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    initDb
};