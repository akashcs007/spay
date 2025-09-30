// src/routes/walletRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const tokenService = require('../services/tokenService'); 

/**
 * GET /api/wallet/balance
 * Protected route to view the logged-in user's token balance.
 */
router.get('/balance', protect, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT token_balance, fiat_balance FROM wallets WHERE user_id = $1',
            [req.userId] // User ID is attached by the 'protect' middleware
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found for this user.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching wallet balance:', err);
        res.status(500).json({ error: 'Failed to retrieve wallet information.' });
    }
});


/**
 * POST /api/wallet/redeem
 * Protected route to redeem tokens for fiat cash.
 * Requires: tokensToRedeem in the body.
 */
router.post('/redeem', protect, async (req, res) => {
    const { tokensToRedeem } = req.body;
    const userId = req.userId;

    if (!tokensToRedeem || tokensToRedeem <= 0 || isNaN(tokensToRedeem)) {
        return res.status(400).json({ error: 'Invalid redemption amount.', detail: 'Tokens to redeem must be a positive number.' });
    }

    try {
        // Use the core token service logic
        const result = await tokenService.redeemTokens(userId, tokensToRedeem);

        res.status(200).json({
            message: 'Token redemption successful. Fiat payout simulated.',
            ...result,
            details: `Successfully redeemed ${tokensToRedeem} Tokens for $${result.fiatRedeemed}. Payout initiated.`
        });

    } catch (err) {
        // Handle errors thrown from tokenService (e.g., insufficient balance)
        res.status(400).json({ error: 'Redemption failed.', detail: err.message });
    }
});

module.exports = router;
