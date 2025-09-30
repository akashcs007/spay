// backend/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware to protect routes (ensure user is logged in)
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (Format: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user ID to the request object
            req.userId = decoded.id;

            next();
        } catch (error) {
            console.error('JWT verification failed:', error);
            // Crucial: return here to stop execution after sending response
            return res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        // Crucial: return here to stop execution after sending response
        return res.status(401).json({ error: 'Not authorized, no token.' });
    }
};

module.exports = { protect }; // <-- Ensure it exports as a NAMED property
