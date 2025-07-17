const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const GloCoinService = require('../services/glocoinService');
const WithdrawalProcessor = require('../services/withdrawalProcessor');

const router = express.Router();
const gloCoinService = new GloCoinService();
const withdrawalProcessor = new WithdrawalProcessor();

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later' }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = gloCoinService.verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

/**
 * POST /api/glocoin/register
 * Register a new user
 */
router.post('/register', authLimiter, [
    body('username')
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-50 characters, alphanumeric and underscore only'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('full_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be 2-100 characters'),
    body('phone')
        .optional()
        .isMobilePhone('en-IN')
        .withMessage('Valid Indian mobile number required')
], handleValidationErrors, async (req, res) => {
    try {
        const result = await gloCoinService.registerUser(req.body);
        
        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: result.user
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/glocoin/login
 * User login
 */
router.post('/login', authLimiter, [
    body('username')
        .notEmpty()
        .withMessage('Username or email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
    try {
        const result = await gloCoinService.loginUser(req.body);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Login successful',
                token: result.token,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =============================================================================
// WALLET & BALANCE ROUTES
// =============================================================================

/**
 * GET /api/glocoin/wallet
 * Get user wallet information
 */
router.get('/wallet', generalLimiter, authenticateToken, async (req, res) => {
    try {
        const result = await gloCoinService.getUserWallet(req.user.userId);
        
        if (result.success) {
            res.json({
                success: true,
                wallet: result.wallet
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/glocoin/credit
 * Credit Glo Coins to user (Admin only - for testing)
 */
router.post('/credit', generalLimiter, authenticateToken, [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('description')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Description must be under 255 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { amount, description } = req.body;
        
        const result = await gloCoinService.creditGloCoins(
            req.user.userId, 
            amount, 
            description || 'Manual credit'
        );
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Glo Coins credited successfully',
                transaction: result.transaction
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Credit error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =============================================================================
// WITHDRAWAL ROUTES
// =============================================================================

/**
 * POST /api/glocoin/withdraw
 * Initiate withdrawal request
 */
router.post('/withdraw', generalLimiter, authenticateToken, [
    body('glo_amount')
        .isFloat({ min: 0.01 })
        .withMessage('Glo Coin amount must be greater than 0'),
    body('withdrawal_method')
        .isIn(['bank_transfer', 'upi'])
        .withMessage('Withdrawal method must be bank_transfer or upi'),
    body('beneficiary_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Beneficiary name is required'),
    body('bank_account_number')
        .if(body('withdrawal_method').equals('bank_transfer'))
        .notEmpty()
        .withMessage('Bank account number is required for bank transfer'),
    body('ifsc_code')
        .if(body('withdrawal_method').equals('bank_transfer'))
        .notEmpty()
        .withMessage('IFSC code is required for bank transfer'),
    body('upi_id')
        .if(body('withdrawal_method').equals('upi'))
        .notEmpty()
        .withMessage('UPI ID is required for UPI transfer')
], handleValidationErrors, async (req, res) => {
    try {
        // Validate withdrawal request
        const validation = withdrawalProcessor.validateWithdrawalRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        const result = await gloCoinService.initiateWithdrawal(req.user.userId, req.body);
        
        if (result.success) {
            // Process withdrawal immediately (in production, this might be queued)
            const processingResult = await withdrawalProcessor.processWithdrawal(result.withdrawal.request_id);
            
            res.json({
                success: true,
                message: 'Withdrawal request submitted and processed',
                withdrawal: result.withdrawal,
                processing: processingResult
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/glocoin/withdrawals
 * Get withdrawal history
 */
router.get('/withdrawals', generalLimiter, authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const result = await gloCoinService.getWithdrawalHistory(req.user.userId, limit);
        
        if (result.success) {
            res.json({
                success: true,
                withdrawals: result.withdrawals
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/glocoin/withdrawal/:id
 * Get specific withdrawal status
 */
router.get('/withdrawal/:id', generalLimiter, authenticateToken, async (req, res) => {
    try {
        const withdrawalId = parseInt(req.params.id);
        const result = await withdrawalProcessor.getWithdrawalStatus(withdrawalId);
        
        if (result.success) {
            res.json({
                success: true,
                withdrawal: result.withdrawal
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get withdrawal status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =============================================================================
// TRANSACTION HISTORY ROUTES
// =============================================================================

/**
 * GET /api/glocoin/transactions
 * Get transaction history
 */
router.get('/transactions', generalLimiter, authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await gloCoinService.getTransactionHistory(req.user.userId, limit);
        
        if (result.success) {
            res.json({
                success: true,
                transactions: result.transactions
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =============================================================================
// UTILITY ROUTES
// =============================================================================

/**
 * GET /api/glocoin/exchange-rate
 * Get current exchange rate
 */
router.get('/exchange-rate', generalLimiter, async (req, res) => {
    try {
        res.json({
            success: true,
            exchange_rate: {
                glo_to_inr: 3.0,
                inr_to_glo: 1/3.0,
                last_updated: new Date().toISOString(),
                currency: 'INR'
            }
        });
    } catch (error) {
        console.error('Get exchange rate error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/glocoin/convert
 * Convert between Glo Coins and INR (for display purposes)
 */
router.post('/convert', generalLimiter, [
    body('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    body('from')
        .isIn(['glo', 'inr'])
        .withMessage('From currency must be glo or inr'),
    body('to')
        .isIn(['glo', 'inr'])
        .withMessage('To currency must be glo or inr')
], handleValidationErrors, async (req, res) => {
    try {
        const { amount, from, to } = req.body;
        
        let convertedAmount;
        if (from === 'glo' && to === 'inr') {
            convertedAmount = gloCoinService.gloToInr(amount);
        } else if (from === 'inr' && to === 'glo') {
            convertedAmount = gloCoinService.inrToGlo(amount);
        } else {
            convertedAmount = amount; // Same currency
        }
        
        res.json({
            success: true,
            conversion: {
                from_amount: parseFloat(amount),
                from_currency: from,
                to_amount: parseFloat(convertedAmount.toFixed(8)),
                to_currency: to,
                exchange_rate: from === 'glo' ? 3.0 : 1/3.0
            }
        });
    } catch (error) {
        console.error('Convert error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
