const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');

class GloCoinService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'glocoin_secret_key_2025';
        this.exchangeRate = 3.0; // 1 Glo Coin = 3 INR
        this.withdrawalFeePercent = 2.0; // 2% withdrawal fee
    }

    // User Authentication
    async registerUser(userData) {
        try {
            // Validate required fields
            const { username, email, password, full_name, phone } = userData;
            
            if (!username || !email || !password || !full_name) {
                throw new Error('Missing required fields');
            }

            // Check if user already exists
            const existingUser = await db.getUserByUsername(username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            const existingEmail = await db.getUserByEmail(email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            // Hash password
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Create user
            const result = await db.createUser({
                username,
                email,
                password_hash,
                full_name,
                phone: phone || null
            });

            if (result.id) {
                // Get created user with wallet info
                const newUser = await db.getUserById(result.id);
                
                console.log(`✅ New user registered: ${username} (ID: ${result.id})`);
                console.log(`🏦 Wallet created: ${newUser.wallet_address}`);

                return {
                    success: true,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        full_name: newUser.full_name,
                        wallet_address: newUser.wallet_address,
                        glo_balance: 0,
                        inr_equivalent: 0
                    }
                };
            } else {
                throw new Error('Failed to create user');
            }
        } catch (error) {
            console.error('❌ User registration error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async loginUser(credentials) {
        try {
            const { username, password } = credentials;
            
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            // Get user by username or email
            let user = await db.getUserByUsername(username);
            if (!user) {
                user = await db.getUserByEmail(username);
            }

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            console.log(`✅ User logged in: ${username}`);

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    wallet_address: user.wallet_address,
                    glo_balance: parseFloat(user.glo_balance) || 0,
                    inr_equivalent: parseFloat(user.inr_equivalent) || 0,
                    kyc_status: user.kyc_status
                }
            };
        } catch (error) {
            console.error('❌ Login error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Glo Coin Management
    async creditGloCoins(userId, amount, description = 'Admin credit') {
        try {
            const referenceId = `credit_${Date.now()}_${uuidv4().substr(0, 8)}`;
            
            const result = await db.updateGloBalance(
                userId, 
                amount, 
                'credit', 
                description, 
                referenceId
            );

            console.log(`💰 Credited ${amount} Glo Coins to user ${userId}`);
            console.log(`📊 New balance: ${result.newBalance} Glo Coins (₹${result.inrEquivalent})`);

            return {
                success: true,
                transaction: {
                    type: 'credit',
                    glo_amount: parseFloat(amount),
                    inr_amount: parseFloat(amount) * this.exchangeRate,
                    new_balance: result.newBalance,
                    reference_id: referenceId
                }
            };
        } catch (error) {
            console.error('❌ Credit error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async debitGloCoins(userId, amount, description = 'Debit transaction') {
        try {
            const referenceId = `debit_${Date.now()}_${uuidv4().substr(0, 8)}`;
            
            const result = await db.updateGloBalance(
                userId, 
                amount, 
                'debit', 
                description, 
                referenceId
            );

            console.log(`💸 Debited ${amount} Glo Coins from user ${userId}`);
            console.log(`📊 New balance: ${result.newBalance} Glo Coins (₹${result.inrEquivalent})`);

            return {
                success: true,
                transaction: {
                    type: 'debit',
                    glo_amount: parseFloat(amount),
                    inr_amount: parseFloat(amount) * this.exchangeRate,
                    new_balance: result.newBalance,
                    reference_id: referenceId
                }
            };
        } catch (error) {
            console.error('❌ Debit error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Withdrawal Management
    async initiateWithdrawal(userId, withdrawalData) {
        try {
            const { glo_amount, withdrawal_method, bank_account_number, ifsc_code, upi_id, beneficiary_name } = withdrawalData;

            // Validate withdrawal amount
            if (!glo_amount || glo_amount <= 0) {
                throw new Error('Invalid withdrawal amount');
            }

            // Get user wallet
            const user = await db.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const currentBalance = parseFloat(user.glo_balance) || 0;
            if (currentBalance < glo_amount) {
                throw new Error('Insufficient Glo Coin balance');
            }

            // Calculate amounts
            const inrAmount = parseFloat(glo_amount) * this.exchangeRate;
            const processingFee = (inrAmount * this.withdrawalFeePercent) / 100;
            const netAmount = inrAmount - processingFee;

            // Minimum withdrawal check
            if (netAmount < 10) {
                throw new Error('Minimum withdrawal amount is ₹10 after fees');
            }

            // Create withdrawal request
            const withdrawalRequest = {
                user_id: userId,
                glo_amount: parseFloat(glo_amount),
                inr_amount: inrAmount,
                withdrawal_method: withdrawal_method || 'bank_transfer',
                bank_account_number: bank_account_number || null,
                ifsc_code: ifsc_code || null,
                upi_id: upi_id || null,
                beneficiary_name: beneficiary_name || user.full_name,
                processing_fee: processingFee,
                net_amount: netAmount
            };

            const result = await db.createWithdrawalRequest(withdrawalRequest);

            // Debit the amount from wallet (lock it)
            await this.debitGloCoins(userId, glo_amount, `Withdrawal request #${result.id}`);

            console.log(`🏦 Withdrawal request created: ${result.id}`);
            console.log(`💰 Amount: ${glo_amount} Glo Coins (₹${inrAmount})`);
            console.log(`💸 Fee: ₹${processingFee.toFixed(2)}, Net: ₹${netAmount.toFixed(2)}`);

            return {
                success: true,
                withdrawal: {
                    request_id: result.id,
                    glo_amount: parseFloat(glo_amount),
                    inr_amount: inrAmount,
                    processing_fee: processingFee,
                    net_amount: netAmount,
                    status: 'pending'
                }
            };
        } catch (error) {
            console.error('❌ Withdrawal initiation error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Utility methods
    async getUserWallet(userId) {
        try {
            const user = await db.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            return {
                success: true,
                wallet: {
                    user_id: user.id,
                    username: user.username,
                    wallet_address: user.wallet_address,
                    glo_balance: parseFloat(user.glo_balance) || 0,
                    inr_equivalent: parseFloat(user.inr_equivalent) || 0,
                    exchange_rate: this.exchangeRate
                }
            };
        } catch (error) {
            console.error('❌ Get wallet error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async getTransactionHistory(userId, limit = 50) {
        try {
            const transactions = await db.getTransactionHistory(userId, limit);
            return {
                success: true,
                transactions: transactions.map(tx => ({
                    id: tx.id,
                    type: tx.transaction_type,
                    glo_amount: parseFloat(tx.glo_amount),
                    inr_amount: parseFloat(tx.inr_amount),
                    status: tx.transaction_status,
                    description: tx.description,
                    reference_id: tx.reference_id,
                    created_at: tx.created_at,
                    completed_at: tx.completed_at
                }))
            };
        } catch (error) {
            console.error('❌ Transaction history error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async getWithdrawalHistory(userId, limit = 20) {
        try {
            const withdrawals = await db.getWithdrawalHistory(userId, limit);
            return {
                success: true,
                withdrawals: withdrawals.map(wd => ({
                    id: wd.id,
                    glo_amount: parseFloat(wd.glo_amount),
                    inr_amount: parseFloat(wd.inr_amount),
                    net_amount: parseFloat(wd.net_amount),
                    processing_fee: parseFloat(wd.processing_fee),
                    withdrawal_method: wd.withdrawal_method,
                    beneficiary_name: wd.beneficiary_name,
                    status: wd.withdrawal_status,
                    requested_at: wd.requested_at,
                    processed_at: wd.processed_at
                }))
            };
        } catch (error) {
            console.error('❌ Withdrawal history error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Currency conversion utilities
    gloToInr(gloAmount) {
        return parseFloat(gloAmount) * this.exchangeRate;
    }

    inrToGlo(inrAmount) {
        return parseFloat(inrAmount) / this.exchangeRate;
    }

    calculateWithdrawalFee(inrAmount) {
        return (parseFloat(inrAmount) * this.withdrawalFeePercent) / 100;
    }

    // JWT token verification
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }
}

module.exports = GloCoinService;
