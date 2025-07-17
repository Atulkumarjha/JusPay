const juspayService = require('../utils/juspay');
const db = require('../database/db');
const BankAccountSimulator = require('./bankAccountSimulator');
const { v4: uuidv4 } = require('uuid');

class WithdrawalProcessor {
    constructor() {
        this.processingFeePercent = 2.0;
        this.minWithdrawalAmount = 10; // Minimum ₹10
        this.maxWithdrawalAmount = 50000; // Maximum ₹50,000 per transaction
        this.bankSimulator = new BankAccountSimulator();
    }

    /**
     * Process withdrawal using JusPay reverse payment (payout)
     * This creates a JusPay order for tracking and processes the withdrawal
     */
    async processWithdrawal(withdrawalRequestId) {
        try {
            console.log(`🔄 Processing withdrawal request: ${withdrawalRequestId}`);

            // Get withdrawal request details
            const withdrawal = await db.get(
                'SELECT * FROM withdrawal_requests WHERE id = ?',
                [withdrawalRequestId]
            );

            if (!withdrawal) {
                throw new Error('Withdrawal request not found');
            }

            if (withdrawal.withdrawal_status !== 'pending') {
                throw new Error('Withdrawal request is not in pending state');
            }

            // Get user details
            const user = await db.getUserById(withdrawal.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Create JusPay order for withdrawal tracking
            const orderData = this.createWithdrawalOrderData(withdrawal, user);
            console.log('📋 Creating JusPay tracking order for withdrawal...');
            
            const juspayOrder = await juspayService.createOrder(orderData);
            
            if (!juspayOrder || !juspayOrder.order_id) {
                throw new Error('Failed to create JusPay tracking order');
            }

            console.log(`✅ JusPay tracking order created: ${juspayOrder.order_id}`);

            // Update withdrawal request with JusPay order ID
            await db.run(
                `UPDATE withdrawal_requests 
                 SET juspay_order_id = ?, withdrawal_status = 'processing' 
                 WHERE id = ?`,
                [juspayOrder.order_id, withdrawalRequestId]
            );

            // In a real system, here you would:
            // 1. Call bank API for actual money transfer
            // 2. Use JusPay's payout API if available
            // 3. Integrate with UPI/IMPS systems
            
            // For this demo, we'll simulate processing and mark as completed
            await this.simulateWithdrawalProcessing(withdrawalRequestId, juspayOrder.order_id);

            // Record in transaction history
            const referenceId = `withdrawal_${Date.now()}_${uuidv4().substr(0, 8)}`;
            await db.run(`
                INSERT INTO glo_transactions (
                    user_id, transaction_type, glo_amount, inr_amount,
                    transaction_status, description, reference_id, juspay_order_id
                ) VALUES (?, 'withdrawal', ?, ?, 'completed', ?, ?, ?)
            `, [
                withdrawal.user_id,
                withdrawal.glo_amount,
                withdrawal.net_amount,
                `Withdrawal processed - ${withdrawal.withdrawal_method}`,
                referenceId,
                juspayOrder.order_id
            ]);

            console.log(`✅ Withdrawal processed successfully: ₹${withdrawal.net_amount}`);
            console.log(`🏦 Method: ${withdrawal.withdrawal_method}`);
            console.log(`👤 Beneficiary: ${withdrawal.beneficiary_name}`);

            return {
                success: true,
                withdrawal: {
                    request_id: withdrawalRequestId,
                    juspay_order_id: juspayOrder.order_id,
                    amount: withdrawal.net_amount,
                    status: 'completed',
                    reference_id: referenceId
                }
            };

        } catch (error) {
            console.error(`❌ Withdrawal processing error: ${error.message}`);
            
            // Mark withdrawal as failed
            await db.run(
                'UPDATE withdrawal_requests SET withdrawal_status = "failed", admin_notes = ? WHERE id = ?',
                [error.message, withdrawalRequestId]
            );

            return { success: false, error: error.message };
        }
    }

    /**
     * Create order data for JusPay tracking
     */
    createWithdrawalOrderData(withdrawal, user) {
        const orderId = `withdrawal_${withdrawal.id}_${Date.now()}`;
        
        return {
            order_id: orderId,
            amount: Math.round(withdrawal.net_amount * 100), // Convert to smallest currency unit
            currency: 'INR',
            customer_id: `user_${user.id}`,
            customer_email: user.email,
            customer_phone: user.phone || '+91 9999999999',
            product_id: 'glocoin_withdrawal',
            description: `Glo Coin Withdrawal - ${withdrawal.glo_amount} Glo Coins to ${withdrawal.withdrawal_method}`,
            return_url: `${process.env.WEBHOOK_URL.replace('/api/payment/callback', '')}/withdrawal/callback`,
            metadata: {
                created_at: new Date().toISOString(),
                source: 'glocoin-withdrawal-system',
                integration_type: 'withdrawal_tracking',
                withdrawal_request_id: withdrawal.id,
                user_id: user.id,
                withdrawal_method: withdrawal.withdrawal_method,
                beneficiary_name: withdrawal.beneficiary_name,
                glo_amount: withdrawal.glo_amount,
                processing_fee: withdrawal.processing_fee,
                net_amount: withdrawal.net_amount,
                bank_account: withdrawal.bank_account_number,
                ifsc_code: withdrawal.ifsc_code,
                upi_id: withdrawal.upi_id
            }
        };
    }

    /**
     * Simulate withdrawal processing with bank account updates
     */
    async simulateWithdrawalProcessing(withdrawalRequestId, juspayOrderId) {
        try {
            console.log(`🔄 Simulating bank transfer for withdrawal: ${withdrawalRequestId}`);
            
            // Get withdrawal details
            const withdrawal = await db.get(
                'SELECT * FROM withdrawal_requests WHERE id = ?',
                [withdrawalRequestId]
            );

            if (!withdrawal) {
                throw new Error('Withdrawal request not found');
            }

            // Simulate processing time (real bank transfer delay)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Process bank account credit simulation
            if (withdrawal.bank_account_number) {
                try {
                    const bankResult = this.bankSimulator.processWithdrawal(
                        withdrawal.bank_account_number,
                        {
                            amount: parseFloat(withdrawal.net_amount),
                            reference: `GLOCOIN_${juspayOrderId}`,
                            description: `Glo Coin withdrawal - ${withdrawal.glo_amount} GC`,
                            gloCoinAmount: parseFloat(withdrawal.glo_amount)
                        }
                    );

                    if (bankResult.success) {
                        console.log(`✅ Bank account ${withdrawal.bank_account_number} credited with ₹${withdrawal.net_amount}`);
                        console.log(`🏦 New bank balance: ₹${bankResult.account.balance}`);

                        // Store bank transaction details in admin notes
                        const adminNotes = `Withdrawal processed successfully. Bank account credited: ₹${withdrawal.net_amount}. Transaction ID: ${bankResult.transaction.id}. New bank balance: ₹${bankResult.account.balance}`;

                        // Mark as completed with bank details
                        await db.run(
                            `UPDATE withdrawal_requests 
                             SET withdrawal_status = 'completed', processed_at = CURRENT_TIMESTAMP,
                                 admin_notes = ?
                             WHERE id = ?`,
                            [adminNotes, withdrawalRequestId]
                        );

                        console.log(`✅ Withdrawal ${withdrawalRequestId} completed with bank credit`);
                        return {
                            success: true,
                            bankTransaction: bankResult.transaction,
                            updatedBalance: bankResult.account.balance
                        };
                    }
                } catch (bankError) {
                    console.error(`❌ Bank simulation error: ${bankError.message}`);
                    // Continue with normal processing even if bank simulation fails
                }
            }

            // Fallback: Mark as completed without bank simulation
            await db.run(
                `UPDATE withdrawal_requests 
                 SET withdrawal_status = 'completed', processed_at = CURRENT_TIMESTAMP,
                     admin_notes = 'Withdrawal processed successfully via automated system'
                 WHERE id = ?`,
                [withdrawalRequestId]
            );

            console.log(`✅ Withdrawal ${withdrawalRequestId} marked as completed`);
            return { success: true };

        } catch (error) {
            console.error(`❌ Withdrawal simulation error: ${error.message}`);
            
            // Mark withdrawal as failed
            await db.run(
                'UPDATE withdrawal_requests SET withdrawal_status = "failed", admin_notes = ? WHERE id = ?',
                [error.message, withdrawalRequestId]
            );

            return { success: false, error: error.message };
        }
    }

    /**
     * Get withdrawal status
     */
    async getWithdrawalStatus(withdrawalRequestId) {
        try {
            const withdrawal = await db.get(
                `SELECT wr.*, u.username, u.email 
                 FROM withdrawal_requests wr
                 JOIN users u ON wr.user_id = u.id
                 WHERE wr.id = ?`,
                [withdrawalRequestId]
            );

            if (!withdrawal) {
                return { success: false, error: 'Withdrawal not found' };
            }

            return {
                success: true,
                withdrawal: {
                    id: withdrawal.id,
                    user: {
                        username: withdrawal.username,
                        email: withdrawal.email
                    },
                    glo_amount: parseFloat(withdrawal.glo_amount),
                    inr_amount: parseFloat(withdrawal.inr_amount),
                    net_amount: parseFloat(withdrawal.net_amount),
                    processing_fee: parseFloat(withdrawal.processing_fee),
                    withdrawal_method: withdrawal.withdrawal_method,
                    beneficiary_name: withdrawal.beneficiary_name,
                    status: withdrawal.withdrawal_status,
                    juspay_order_id: withdrawal.juspay_order_id,
                    requested_at: withdrawal.requested_at,
                    processed_at: withdrawal.processed_at,
                    admin_notes: withdrawal.admin_notes
                }
            };
        } catch (error) {
            console.error('❌ Get withdrawal status error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all pending withdrawals (for admin)
     */
    async getPendingWithdrawals() {
        try {
            const withdrawals = await db.all(
                `SELECT wr.*, u.username, u.email, u.full_name
                 FROM withdrawal_requests wr
                 JOIN users u ON wr.user_id = u.id
                 WHERE wr.withdrawal_status = 'pending'
                 ORDER BY wr.requested_at ASC`
            );

            return {
                success: true,
                withdrawals: withdrawals.map(wd => ({
                    id: wd.id,
                    user: {
                        id: wd.user_id,
                        username: wd.username,
                        email: wd.email,
                        full_name: wd.full_name
                    },
                    glo_amount: parseFloat(wd.glo_amount),
                    inr_amount: parseFloat(wd.inr_amount),
                    net_amount: parseFloat(wd.net_amount),
                    processing_fee: parseFloat(wd.processing_fee),
                    withdrawal_method: wd.withdrawal_method,
                    beneficiary_name: wd.beneficiary_name,
                    bank_account_number: wd.bank_account_number,
                    ifsc_code: wd.ifsc_code,
                    upi_id: wd.upi_id,
                    requested_at: wd.requested_at
                }))
            };
        } catch (error) {
            console.error('❌ Get pending withdrawals error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate withdrawal request
     */
    validateWithdrawalRequest(withdrawalData) {
        const { glo_amount, withdrawal_method, beneficiary_name } = withdrawalData;

        if (!glo_amount || glo_amount <= 0) {
            return { valid: false, error: 'Invalid Glo Coin amount' };
        }

        const inrAmount = parseFloat(glo_amount) * 3.0;
        if (inrAmount < this.minWithdrawalAmount) {
            return { valid: false, error: `Minimum withdrawal amount is ₹${this.minWithdrawalAmount}` };
        }

        if (inrAmount > this.maxWithdrawalAmount) {
            return { valid: false, error: `Maximum withdrawal amount is ₹${this.maxWithdrawalAmount}` };
        }

        if (!withdrawal_method || !['bank_transfer', 'upi'].includes(withdrawal_method)) {
            return { valid: false, error: 'Invalid withdrawal method' };
        }

        if (!beneficiary_name || beneficiary_name.trim().length < 2) {
            return { valid: false, error: 'Beneficiary name is required' };
        }

        if (withdrawal_method === 'bank_transfer') {
            const { bank_account_number, ifsc_code } = withdrawalData;
            if (!bank_account_number || !ifsc_code) {
                return { valid: false, error: 'Bank account details are required for bank transfer' };
            }
        }

        if (withdrawal_method === 'upi') {
            const { upi_id } = withdrawalData;
            if (!upi_id) {
                return { valid: false, error: 'UPI ID is required for UPI transfer' };
            }
        }

        return { valid: true };
    }

    /**
     * Create a mock bank account for a user
     */
    createMockBankAccount(userDetails) {
        return this.bankSimulator.createBankAccount(userDetails);
    }

    /**
     * Get bank account details
     */
    getBankAccountDetails(accountNumber) {
        return this.bankSimulator.getAccountDetails(accountNumber);
    }

    /**
     * Get bank account transaction history
     */
    getBankTransactionHistory(accountNumber, limit = 10) {
        return this.bankSimulator.getTransactionHistory(accountNumber, limit);
    }

    /**
     * Generate bank statement
     */
    generateBankStatement(accountNumber, days = 30) {
        return this.bankSimulator.generateStatement(accountNumber, days);
    }

    /**
     * Get all mock bank accounts (for admin)
     */
    getAllMockBankAccounts() {
        return this.bankSimulator.getAllAccounts();
    }
}

module.exports = WithdrawalProcessor;
