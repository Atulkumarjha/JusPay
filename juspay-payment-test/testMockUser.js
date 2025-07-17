const GloCoinService = require('./services/glocoinService');
const WithdrawalProcessor = require('./services/withdrawalProcessor');

async function testMockUser() {
    console.log('🧪 Testing Mock User with Bank Account Simulation');
    console.log('==================================================\n');

    const gloCoinService = new GloCoinService();
    const withdrawalProcessor = new WithdrawalProcessor();

    try {
        console.log('🔄 Creating unique test user...');
        const timestamp = Date.now();
        const testUser = {
            username: `test_user_${timestamp}`,
            full_name: 'Test User Demo',
            email: `test${timestamp}@email.com`,
            phone: '+91 9876543210',
            password: 'password123'
        };

        // Register user
        const registrationResult = await gloCoinService.registerUser(testUser);
        
        if (!registrationResult.success) {
            throw new Error(`Registration failed: ${registrationResult.error}`);
        }

        const userId = registrationResult.user.id;
        console.log(`✅ User created: ${testUser.username} (ID: ${userId})`);
        console.log(`🏦 Wallet: ${registrationResult.user.wallet_address}`);

        // Create mock bank account
        const bankAccount = withdrawalProcessor.createMockBankAccount({
            name: testUser.full_name,
            userId: userId
        });

        console.log(`\n🏦 Mock Bank Account Created:`);
        console.log(`   Account: ${bankAccount.account_number}`);
        console.log(`   Bank: ${bankAccount.bank_name} (${bankAccount.branch})`);
        console.log(`   IFSC: ${bankAccount.ifsc_code}`);
        console.log(`   Holder: ${bankAccount.account_holder_name}`);
        console.log(`   Initial Balance: ₹${bankAccount.balance}`);

        // Credit Glo Coins
        console.log(`\n💰 Crediting initial Glo Coins...`);
        const creditResult = await gloCoinService.creditGloCoins(
            userId, 
            100, 
            'Initial credit for demo'
        );

        if (!creditResult.success) {
            throw new Error(`Credit failed: ${creditResult.error}`);
        }

        console.log(`✅ Credited 100 Glo Coins (₹${100 * 3})`);

        // Check wallet
        const walletInfo = await gloCoinService.getUserWallet(userId);
        if (walletInfo.success) {
            console.log(`📊 Wallet Balance: ${walletInfo.wallet.glo_balance} GC = ₹${walletInfo.wallet.inr_equivalent}`);
        }

        // Process withdrawal
        console.log(`\n🔄 Processing withdrawal: 30 Glo Coins...`);
        const withdrawalResult = await gloCoinService.initiateWithdrawal(userId, {
            glo_amount: 30,
            withdrawal_method: 'bank_transfer',
            beneficiary_name: bankAccount.account_holder_name,
            bank_account_number: bankAccount.account_number,
            ifsc_code: bankAccount.ifsc_code
        });

        if (!withdrawalResult.success) {
            throw new Error(`Withdrawal failed: ${withdrawalResult.error}`);
        }

        console.log(`✅ Withdrawal initiated: Request #${withdrawalResult.withdrawal.request_id}`);
        console.log(`💸 Net amount: ₹${withdrawalResult.withdrawal.net_amount} (after ₹${withdrawalResult.withdrawal.processing_fee} fee)`);

        if (withdrawalResult.processing && withdrawalResult.processing.success) {
            console.log(`🏦 JusPay Order: ${withdrawalResult.processing.withdrawal.juspay_order_id}`);
            console.log(`✅ Status: ${withdrawalResult.processing.withdrawal.status}`);
        }

        // Check updated bank account
        console.log(`\n🏦 Checking bank account after withdrawal...`);
        const bankDetails = withdrawalProcessor.getBankAccountDetails(bankAccount.account_number);
        if (bankDetails.success) {
            console.log(`   Current Balance: ₹${bankDetails.account.balance}`);
            console.log(`   Last Updated: ${bankDetails.account.last_updated}`);
        }

        // Get transaction history
        const bankHistory = withdrawalProcessor.getBankTransactionHistory(bankAccount.account_number, 5);
        if (bankHistory.success && bankHistory.transactions.length > 0) {
            console.log(`\n📋 Recent Bank Transactions:`);
            bankHistory.transactions.forEach((tx, i) => {
                console.log(`   ${i + 1}. ${tx.type} ₹${tx.amount} - ${tx.description}`);
                console.log(`      Reference: ${tx.reference}`);
                console.log(`      Time: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log(`      Balance: ₹${tx.balance_after}`);
            });
        }

        // Check updated Glo Coin wallet
        const finalWallet = await gloCoinService.getUserWallet(userId);
        if (finalWallet.success) {
            console.log(`\n💰 Final Glo Coin Balance: ${finalWallet.wallet.glo_balance} GC = ₹${finalWallet.wallet.inr_equivalent}`);
        }

        console.log(`\n🎉 Mock user demo completed successfully!`);
        console.log(`✅ User created, credited, withdrew, and bank account updated`);
        console.log(`✅ JusPay dashboard should show the withdrawal order`);

        return {
            user: testUser,
            bankAccount: bankAccount,
            withdrawal: withdrawalResult
        };

    } catch (error) {
        console.error(`❌ Demo failed: ${error.message}`);
        return null;
    }
}

// Run the test
if (require.main === module) {
    testMockUser().catch(console.error);
}

module.exports = testMockUser;
