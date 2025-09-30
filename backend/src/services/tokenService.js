// src/services/tokenService.js

const db = require('../config/db');
const TRANSACTION_FEE = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE);
const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE_FIAT); // $1 = 1 Token

/**
 * Executes the core escrow and token creation logic upon successful sale completion.
 * @param {number} buyerId - The ID of the user who bought the item.
 * @param {number} sellerId - The ID of the user who sold the item.
 * @param {number} fiatAmount - The initial fiat amount paid by the buyer (e.g., 100).
 * @returns {object} An object containing the fee amount and tokens credited.
 */
async function processSaleCompletion(buyerId, sellerId, fiatAmount) {
    // 1. Calculate Fee
    const feeAmount = fiatAmount * TRANSACTION_FEE;
    const sellerFiatNet = fiatAmount - feeAmount;

    // 2. Convert net fiat to Tokens
    // Assuming 1 Token = $1 for simplicity (as defined in .env)
    const tokensToCredit = Math.round(sellerFiatNet / TOKEN_VALUE);

    // --- Database Transaction Start (CRITICAL for financial integrity) ---
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 3. Update Seller's Wallet (Credit Tokens)
        await client.query(
            'UPDATE wallets SET token_balance = token_balance + $1 WHERE user_id = $2',
            [tokensToCredit, sellerId]
        );

        // 4. Log the Token Creation (Ledger)
        await client.query(
            'INSERT INTO token_ledger (user_id, type, amount, source_fiat) VALUES ($1, $2, $3, $4)',
            [sellerId, 'CREDIT_SALE', tokensToCredit, sellerFiatNet]
        );
        
        // 5. Update Transaction Status
        // (In a real app, you would update the specific transaction record here)

        await client.query('COMMIT');
        
        // 6. (SIMULATED) Escrow Payout: Transfer fee to company account and fiat to seller's redemption pool.
        console.log(`[ESCROW] Fee paid to Company: $${feeAmount.toFixed(2)}`);
        
        return { 
            feeCharged: feeAmount.toFixed(2), 
            tokensCredited: tokensToCredit 
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Token processing failed:', error);
        throw new Error('Transaction failed. Funds retained in escrow.');
    } finally {
        client.release();
    }
}


/**
 * Allows a user to redeem their tokens for fiat currency.
 * @param {number} userId - The ID of the user redeeming tokens.
 * @param {number} tokensToRedeem - The amount of tokens to convert back to cash.
 */
async function redeemTokens(userId, tokensToRedeem) {
    const fiatRedemptionAmount = tokensToRedeem * TOKEN_VALUE;
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Check current token balance
        const walletResult = await client.query('SELECT token_balance FROM wallets WHERE user_id = $1', [userId]);
        if (walletResult.rows.length === 0 || walletResult.rows[0].token_balance < tokensToRedeem) {
            throw new Error('Insufficient token balance.');
        }

        // 2. Debit/Burn Tokens from Wallet
        await client.query(
            'UPDATE wallets SET token_balance = token_balance - $1 WHERE user_id = $2',
            [tokensToRedeem, userId]
        );

        // 3. Log the Token Redemption (Ledger)
        await client.query(
            'INSERT INTO token_ledger (user_id, type, amount, source_fiat) VALUES ($1, $2, $3, $4)',
            [userId, 'DEBIT_REDEMPTION', -tokensToRedeem, -fiatRedemptionAmount]
        );
        
        await client.query('COMMIT');
        
        // 4. (SIMULATED) Payout to User's Bank
        console.log(`[PAYOUT] Payout initiated for User ${userId}: $${fiatRedemptionAmount.toFixed(2)}`);

        return { 
            fiatRedeemed: fiatRedemptionAmount.toFixed(2)
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Redemption failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    processSaleCompletion,
    redeemTokens
};