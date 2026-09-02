const bcrypt = require('bcrypt');
const db = require('../config/db');

const register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES $1 $2 RETURNING id, email, created_at',
            [email, passwordHash]
        );

        return res.status(201).json(
            {
                message: 'User registered successfully',
                user: newUser.rows[0],
            }
        )
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
};

module.exports = { register };