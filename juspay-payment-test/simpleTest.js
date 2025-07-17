const JusPayMockDataGenerator = require('./utils/mockDataGenerator');
require('dotenv').config();

console.log('🧪 JusPay Mock Data Test Runner');
console.log('==============================\n');

// Check environment
console.log('📊 Environment Check:');
console.log(`JUSPAY_API_KEY: ${process.env.JUSPAY_API_KEY ? 'Set ✅' : 'Missing ❌'}`);
console.log(`JUSPAY_MERCHANT_ID: ${process.env.JUSPAY_MERCHANT_ID ? 'Set ✅' : 'Missing ❌'}`);
console.log(`JUSPAY_BASE_URL: ${process.env.JUSPAY_BASE_URL || 'Not set'}`);
console.log(`USE_MOCK_DATA: ${process.env.USE_MOCK_DATA || 'false'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}\n`);

if (!process.env.JUSPAY_API_KEY || !process.env.JUSPAY_MERCHANT_ID) {
  console.log('❌ Missing JusPay credentials in .env file');
  process.exit(1);
}

const juspayService = require('./utils/juspay');

async function runSimpleTest() {
  console.log('🚀 Creating test orders for your JusPay dashboard...\n');
  
  const mockGenerator = new JusPayMockDataGenerator();
  const results = [];
  
  try {
    // Test 1: Small amount order
    console.log('Creating order 1: Small amount test...');
    const order1 = mockGenerator.generateMockExpressCheckoutOrder({
      amount: 100, // ₹1.00
      currency: 'INR',
      test_scenario: 'small_amount_test'
    });
    
    const result1 = await juspayService.createOrder(order1);
    if (result1 && result1.order_id) {
      console.log(`✅ Order 1 created: ${result1.order_id}`);
      console.log(`   Status: ${result1.status}`);
      console.log(`   Payment Link: ${result1.payment_links.web}`);
      results.push(result1);
    } else {
      console.log(`❌ Order 1 failed: No order ID returned`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Medium amount order
    console.log('Creating order 2: Medium amount test...');
    const order2 = mockGenerator.generateMockExpressCheckoutOrder({
      amount: 50000, // ₹500.00
      currency: 'INR',
      test_scenario: 'medium_amount_test'
    });
    
    const result2 = await juspayService.createOrder(order2);
    if (result2 && result2.order_id) {
      console.log(`✅ Order 2 created: ${result2.order_id}`);
      console.log(`   Status: ${result2.status}`);
      console.log(`   Payment Link: ${result2.payment_links.web}`);
      results.push(result2);
    } else {
      console.log(`❌ Order 2 failed: No order ID returned`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: EUR currency order
    console.log('Creating order 3: EUR currency test...');
    const order3 = mockGenerator.generateMockExpressCheckoutOrder({
      amount: 1000, // €10.00
      currency: 'EUR',
      test_scenario: 'eur_currency_test'
    });
    
    const result3 = await juspayService.createOrder(order3);
    if (result3 && result3.order_id) {
      console.log(`✅ Order 3 created: ${result3.order_id}`);
      console.log(`   Status: ${result3.status}`);
      console.log(`   Payment Link: ${result3.payment_links.web}`);
      results.push(result3);
    } else {
      console.log(`❌ Order 3 failed: No order ID returned`);
    }
    
    console.log('\n==============================');
    console.log('🎯 TEST SUMMARY');
    console.log('==============================');
    console.log(`✅ Successful orders: ${results.length}`);
    console.log(`📊 Check your JusPay dashboard for these test transactions`);
    console.log(`💡 All transactions are SANDBOX/TEST - no real money involved`);
    
    if (results.length > 0) {
      console.log('\n📋 Created Orders:');
      results.forEach((result, index) => {
        console.log(`${index + 1}. Order: ${result.order_id}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Payment Link: ${result.payment_links.web}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

runSimpleTest();
