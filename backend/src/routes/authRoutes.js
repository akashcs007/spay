// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// --- Register User ---
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 1. Insert new user (Note: 'full_name' uses a DEFAULT value set in the database schema)
        const userResult = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );
        const userId = userResult.rows[0].id;
        
        // 2. Create an initial wallet for the new user
        await db.query(
            'INSERT INTO wallets (user_id, token_balance, fiat_balance) VALUES ($1, 0, 0)',
            [userId]
        );

        // Optional: Generate token for immediate login after registration
        const token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({ message: 'User registered and wallet created successfully.', userId, token });
    } catch (err) {
        // Handle duplicate email (23505) or other DB errors
        res.status(500).json({ 
            error: 'Registration failed.', 
            detail: err.message.includes('23505') ? 'Email already in use.' : err.message 
        });
    }
});

// --- Login User ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid Credentials.', detail: 'User not found.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials.', detail: 'Password incorrect.' });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ token, userId: user.id });
    } catch (err) {
        res.status(500).json({ error: 'Login failed.', detail: err.message });
    }
});

module.exports = router;
