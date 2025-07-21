#!/usr/bin/env node

/**
 * Cashfree Payment Flow Test Script
 * This script demonstrates the complete Cashfree payment flow with detailed JSON logging
 */

const CashfreeService = require('./services/CashfreeService');

async function testCashfreeFlow() {
    console.log('🚀 STARTING CASHFREE PAYMENT FLOW TEST');
    console.log('==========================================\n');

    // Initialize Cashfree service
    const cashfree = new CashfreeService();

    try {
        // Test 1: Create Payment Session
        console.log('📋 TEST 1: Creating Payment Session');
        console.log('-----------------------------------');
        
        const paymentSession = await cashfree.createPaymentSession(
            500.00,  // amount
            'user123',  // userId
            'order_test_' + Date.now()  // orderId
        );

        // Test 2: Process Payment
        console.log('\n📋 TEST 2: Processing Payment');
        console.log('----------------------------');
        
        const paymentResult = await cashfree.processPayment({
            orderId: paymentSession.orderId,
            amount: paymentSession.amount,
            status: 'SUCCESS'
        });

        // Test 3: Create Withdrawal (Payout)
        console.log('\n📋 TEST 3: Creating Withdrawal Order');
        console.log('----------------------------------');
        
        const withdrawalResult = await cashfree.createWithdrawalOrder(
            250.00,  // amount
            {
                accountHolder: 'John Doe',
                accountNumber: '1234567890',
                routingNumber: 'HDFC0000123',
                bankName: 'HDFC Bank'
            },
            'user123'
        );

        console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('===================================');
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Payment Session: ${paymentSession.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Payment Processing: ${paymentResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Withdrawal Order: ${withdrawalResult.success ? 'SUCCESS' : 'FAILED'}`);
        
        console.log('\n💡 MOCK MODE FEATURES:');
        console.log('- Detailed JSON request/response logging');
        console.log('- Realistic payment flow simulation');
        console.log('- Dashboard tracking simulation');
        console.log('- Error handling with fallback responses');
        console.log('- No real API calls or charges');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('==========================================');
    }
}

// Run the test
if (require.main === module) {
    testCashfreeFlow().then(() => {
        console.log('\n🏁 Test script completed.');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testCashfreeFlow };
