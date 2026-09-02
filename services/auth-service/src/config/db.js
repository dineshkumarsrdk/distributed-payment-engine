const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.PORT
});

// auto-initialize relational tables if they do not exist
const initDb = async () => {
    const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try{
    await pool.query(createUsersTableQuery);
    console.log('[Auth Service DB] Users table verified/created.');
  } catch(error) {
    console.error('[Auth Service DB] Error initializing table:', error);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDb
};