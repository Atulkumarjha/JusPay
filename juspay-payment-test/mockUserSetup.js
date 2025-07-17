const GloCoinService = require('./services/glocoinService');
const WithdrawalProcessor = require('./services/withdrawalProcessor');

/**
 * Mock User Setup for Glo Coin Withdrawal Testing
 * Creates realistic test users with bank details and demonstrates complete flow
 */
class MockUserSetup {
    constructor() {
        this.glocoinService = new GloCoinService();
        this.withdrawalProcessor = new WithdrawalProcessor();
        
        // Mock bank accounts that will be dynamically updated
        this.mockBankAccounts = {
            user1: {
                account_number: '8847236591',
                ifsc_code: 'HDFC0001234',
                account_holder_name: 'Rahul Kumar Sharma',
                bank_name: 'HDFC Bank',
                branch: 'Delhi Connaught Place',
                balance: 25000.50, // This will be updated after withdrawals
                last_transaction: null
            },
            user2: {
                account_number: '9876543210',
                ifsc_code: 'ICIC0000123',
                account_holder_name: 'Priya Singh',
                bank_name: 'ICICI Bank',
                branch: 'Mumbai Andheri',
                balance: 18750.25,
                last_transaction: null
            },
            user3: {
                account_number: '5432167890',
                ifsc_code: 'SBIN0012345',
                account_holder_name: 'Amit Patel',
                bank_name: 'State Bank of India',
                branch: 'Ahmedabad Commercial',
                balance: 42300.75,
                last_transaction: null
            }
        };

        // Mock user profiles
        this.mockUsers = [
            {
                username: 'rahul_kumar',
                full_name: 'Rahul Kumar Sharma',
                email: 'rahul.kumar@email.com',
                phone: '+91 9876543210',
                password: 'password123',
                initial_glo_coins: 150,
                bank_account_key: 'user1'
            },
            {
                username: 'priya_singh',
                full_name: 'Priya Singh',
                email: 'priya.singh@email.com', 
                phone: '+91 8765432109',
                password: 'password123',
                initial_glo_coins: 200,
                bank_account_key: 'user2'
            },
            {
                username: 'amit_patel',
                full_name: 'Amit Patel',
                email: 'amit.patel@email.com',
                phone: '+91 7654321098', 
                password: 'password123',
                initial_glo_coins: 250,
                bank_account_key: 'user3'
            }
        ];
    }

    async setupMockUsers() {
        console.log('🚀 Setting up mock users with bank accounts...\n');
        
        const createdUsers = [];

        for (const userData of this.mockUsers) {
            try {
                console.log(`📋 Creating user: ${userData.username}`);
                
                // Register user
                const registrationResult = await this.glocoinService.registerUser({
                    username: userData.username,
                    full_name: userData.full_name,
                    email: userData.email,
                    phone: userData.phone,
                    password: userData.password
                });

                if (registrationResult.success) {
                    const userId = registrationResult.user.id;
                    console.log(`   ✅ User registered with ID: ${userId}`);
                    
                    // Credit initial Glo Coins
                    const creditResult = await this.glocoinService.creditGloCoins(
                        userId, 
                        userData.initial_glo_coins,
                        `Initial credit for ${userData.username} - Testing Setup`
                    );

                    if (creditResult.success) {
                        console.log(`   💰 Credited ${userData.initial_glo_coins} Glo Coins (₹${userData.initial_glo_coins * 3})`);
                    }

                    // Store user info with bank details
                    const bankAccount = this.mockBankAccounts[userData.bank_account_key];
                    createdUsers.push({
                        userId: userId,
                        username: userData.username,
                        email: userData.email,
                        walletAddress: registrationResult.user.wallet_address,
                        gloBalance: userData.initial_glo_coins,
                        bankAccount: bankAccount,
                        bankAccountKey: userData.bank_account_key
                    });

                    console.log(`   🏦 Bank Account: ${bankAccount.account_number} (${bankAccount.bank_name})`);
                    console.log(`   💳 Current Bank Balance: ₹${bankAccount.balance}`);
                }
                
                console.log(''); // Empty line for readability
                
            } catch (error) {
                console.error(`❌ Error creating user ${userData.username}:`, error.message);
            }
        }

        return createdUsers;
    }

    async demonstrateWithdrawal(userInfo, withdrawalAmount) {
        console.log(`\n🔄 Processing withdrawal for ${userInfo.username}...`);
        console.log(`   Withdrawing: ${withdrawalAmount} Glo Coins (₹${withdrawalAmount * 3})`);
        
        const bankAccount = userInfo.bankAccount;
        console.log(`   Target Bank: ${bankAccount.account_number} (${bankAccount.bank_name})`);
        console.log(`   Pre-withdrawal Bank Balance: ₹${bankAccount.balance}`);

        try {
            // Process withdrawal
            const withdrawalResult = await this.glocoinService.initiateWithdrawal(userInfo.userId, {
                glo_amount: withdrawalAmount,
                withdrawal_method: 'bank_transfer',
                beneficiary_name: bankAccount.account_holder_name,
                bank_account_number: bankAccount.account_number,
                ifsc_code: bankAccount.ifsc_code
            });

            if (withdrawalResult.success) {
                console.log(`   ✅ Withdrawal request created: #${withdrawalResult.withdrawal.request_id}`);
                console.log(`   💸 Net amount after fees: ₹${withdrawalResult.withdrawal.net_amount}`);

                // Update mock bank balance (simulate bank credit)
                const netAmount = withdrawalResult.withdrawal.net_amount;
                this.mockBankAccounts[userInfo.bankAccountKey].balance += netAmount;
                this.mockBankAccounts[userInfo.bankAccountKey].last_transaction = {
                    type: 'credit',
                    amount: netAmount,
                    description: `Glo Coin withdrawal - ${withdrawalAmount} GC`,
                    timestamp: new Date().toISOString(),
                    reference: withdrawalResult.withdrawal.reference_id || `GC_${Date.now()}`
                };

                console.log(`   🏦 Updated Bank Balance: ₹${this.mockBankAccounts[userInfo.bankAccountKey].balance}`);
                console.log(`   📋 JusPay Order ID: ${withdrawalResult.processing?.withdrawal?.juspay_order_id || 'Processing...'}`);

                // Get updated wallet info
                const walletInfo = await this.glocoinService.getWalletInfo(userInfo.userId);
                if (walletInfo.success) {
                    console.log(`   💰 Updated Glo Balance: ${walletInfo.wallet.glo_balance} GC (₹${walletInfo.wallet.inr_equivalent})`);
                }

                return {
                    success: true,
                    withdrawal: withdrawalResult,
                    updatedBankBalance: this.mockBankAccounts[userInfo.bankAccountKey].balance,
                    bankTransaction: this.mockBankAccounts[userInfo.bankAccountKey].last_transaction
                };
            } else {
                console.log(`   ❌ Withdrawal failed: ${withdrawalResult.error}`);
                return { success: false, error: withdrawalResult.error };
            }

        } catch (error) {
            console.error(`   ❌ Withdrawal error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async showBankAccountStatus(userInfo) {
        const bankAccount = this.mockBankAccounts[userInfo.bankAccountKey];
        console.log(`\n📊 Bank Account Status for ${userInfo.username}:`);
        console.log(`   Account: ${bankAccount.account_number} (${bankAccount.bank_name})`);
        console.log(`   Holder: ${bankAccount.account_holder_name}`);
        console.log(`   Branch: ${bankAccount.branch}`);
        console.log(`   Current Balance: ₹${bankAccount.balance}`);
        
        if (bankAccount.last_transaction) {
            const tx = bankAccount.last_transaction;
            console.log(`   Last Transaction: ${tx.type.toUpperCase()} ₹${tx.amount}`);
            console.log(`   Description: ${tx.description}`);
            console.log(`   Reference: ${tx.reference}`);
            console.log(`   Time: ${new Date(tx.timestamp).toLocaleString()}`);
        } else {
            console.log(`   Last Transaction: None`);
        }
    }

    async runCompleteDemo() {
        console.log('🎯 MOCK USER GLOCOIN WITHDRAWAL DEMO');
        console.log('=====================================\n');

        // Setup users
        const users = await this.setupMockUsers();
        
        if (users.length === 0) {
            console.log('❌ No users created successfully');
            return;
        }

        console.log(`✅ Created ${users.length} mock users with bank accounts\n`);

        // Demonstrate withdrawals for each user
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const withdrawalAmounts = [50, 75, 100]; // Different amounts for testing
            
            await this.demonstrateWithdrawal(user, withdrawalAmounts[i] || 50);
            await this.showBankAccountStatus(user);
            
            if (i < users.length - 1) {
                console.log('\n' + '─'.repeat(60));
            }
        }

        console.log('\n🎉 Demo completed! Check JusPay dashboard for withdrawal orders.');
        console.log('💡 Bank balances have been updated to reflect the withdrawals.');
        
        return users;
    }

    // Get login credentials for testing
    getMockCredentials() {
        return this.mockUsers.map(user => ({
            username: user.username,
            password: user.password,
            email: user.email
        }));
    }

    // Get current bank account states
    getCurrentBankStates() {
        return this.mockBankAccounts;
    }
}

module.exports = MockUserSetup;

// Run demo if executed directly
if (require.main === module) {
    const demo = new MockUserSetup();
    demo.runCompleteDemo().catch(console.error);
}
