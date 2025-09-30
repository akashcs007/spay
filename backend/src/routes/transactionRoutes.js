// src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const tokenService = require('../services/tokenService');

/**
 * POST /api/transactions/complete
 * SIMULATED ENDPOINT: Triggers the core token creation logic upon successful sale completion.
 * This endpoint simulates a webhook notification from an external escrow service (like Stripe).
 */
router.post('/complete', async (req, res) => {
    // Data expected from the frontend demo or a real webhook
    const { transactionId, buyerId, sellerId, totalFiatPaid } = req.body; 

    if (!sellerId || !totalFiatPaid || totalFiatPaid <= 0) {
        return res.status(400).json({ 
            error: 'Invalid Input', 
            detail: 'Seller ID and positive total fiat paid are required.' 
        });
    }

    // --- In a real application, security checks and transaction record retrieval happen here ---

    try {
        // Call the core service to handle fee calculation and token credit
        const result = await tokenService.processSaleCompletion(
            buyerId, 
            sellerId, 
            totalFiatPaid
        );

        res.status(200).json({
            message: 'Transaction completed, tokens credited.',
            transactionId: transactionId || Date.now(),
            ...result,
            details: `Seller credited ${result.tokensCredited} Tokens. Platform charged $${result.feeCharged} fee.`
        });

    } catch (err) {
        console.error('Transaction completion error:', err);
        res.status(500).json({ 
            error: 'Failed to complete transaction and process tokens.', 
            detail: err.message 
        });
    }
});

module.exports = router;
