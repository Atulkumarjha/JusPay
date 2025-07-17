const express = require('express');
const router = express.Router();
const WithdrawalProcessor = require('../services/withdrawalProcessor');
const { authenticateJWT } = require('../middleware/auth');

const withdrawalProcessor = new WithdrawalProcessor();

/**
 * Bank Account Monitoring API Routes
 * For viewing mock bank account changes during Glo Coin withdrawals
 */

// Get bank account details
router.get('/account/:accountNumber', authenticateJWT, async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = withdrawalProcessor.getBankAccountDetails(accountNumber);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ Bank account details error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get bank account details'
        });
    }
});

// Get bank transaction history
router.get('/account/:accountNumber/transactions', authenticateJWT, async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = withdrawalProcessor.getBankTransactionHistory(accountNumber, limit);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ Bank transaction history error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction history'
        });
    }
});

// Generate bank statement
router.get('/account/:accountNumber/statement', authenticateJWT, async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const days = parseInt(req.query.days) || 30;
        
        const result = withdrawalProcessor.generateBankStatement(accountNumber, days);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ Bank statement error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate bank statement'
        });
    }
});

// Get all mock bank accounts (admin only)
router.get('/accounts/all', authenticateJWT, async (req, res) => {
    try {
        const result = withdrawalProcessor.getAllMockBankAccounts();
        res.json(result);
    } catch (error) {
        console.error('❌ Get all accounts error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get bank accounts'
        });
    }
});

// Create mock bank account for user
router.post('/account/create', authenticateJWT, async (req, res) => {
    try {
        const { name, userId } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Account holder name is required'
            });
        }

        const userDetails = {
            name: name,
            userId: userId || req.user.userId
        };

        const account = withdrawalProcessor.createMockBankAccount(userDetails);
        
        res.json({
            success: true,
            message: 'Mock bank account created successfully',
            account: account
        });
    } catch (error) {
        console.error('❌ Create bank account error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create bank account'
        });
    }
});

module.exports = router;
