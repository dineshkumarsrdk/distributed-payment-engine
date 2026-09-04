const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');

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
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
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

// user login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }

    try {
        const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length == 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) }
        );

        await redisClient.set(
            `session:${user.id}`,
            accessToken,
            { EX: parseInt(process.env.JWT_EXPIRES_IN) }
        );

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            expiresIn: process.env.JWT_EXPIRES_IN
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
}

const logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        await redisClient.del(`session:${userId}`);
        return res.status(200).json({ message: 'Logged out successfully. Session revoked.' });
    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({ error: 'Internal server error during logout.' });
    }
}

const getProfile = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

module.exports = { register, login, logout, getProfile };