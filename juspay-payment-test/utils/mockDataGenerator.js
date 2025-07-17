const crypto = require('crypto');

/**
 * Mock Data Generator for JusPay Testing
 * Creates consistent test data that will appear in JusPay dashboard
 * All transactions are sandbox/test - no real money involved
 */

class JusPayMockDataGenerator {
  constructor() {
    this.testCustomers = [
      {
        id: 'customer_mock_001',
        email: 'alice.test@mockdomain.com',
        phone: '+91 9876543210',
        name: 'Alice Test User'
      },
      {
        id: 'customer_mock_002', 
        email: 'bob.test@mockdomain.com',
        phone: '+91 9876543211',
        name: 'Bob Test User'
      },
      {
        id: 'customer_mock_003',
        email: 'charlie.test@mockdomain.com', 
        phone: '+91 9876543212',
        name: 'Charlie Test User'
      }
    ];

    this.testProducts = [
      {
        id: 'product_mock_book',
        name: 'Mock Test Book',
        description: 'Test product for JusPay integration testing'
      },
      {
        id: 'product_mock_subscription',
        name: 'Mock Test Subscription',
        description: 'Test subscription product for recurring payments'
      },
      {
        id: 'product_mock_course',
        name: 'Mock Test Course',
        description: 'Test course product for one-time payments'
      }
    ];

    this.testAmounts = {
      small: 100,    // ₹1.00
      medium: 50000, // ₹500.00  
      large: 100000, // ₹1000.00
      xlarge: 250000 // ₹2500.00
    };

    // JusPay Sandbox Test Cards (these work in sandbox environment)
    this.testCards = {
      visa_success: {
        number: '4111111111111111',
        exp_month: '12',
        exp_year: '2025',
        security_code: '123',
        name: 'Test Visa Card'
      },
      mastercard_success: {
        number: '5555555555554444',
        exp_month: '11',
        exp_year: '2025', 
        security_code: '456',
        name: 'Test Mastercard'
      },
      visa_failure: {
        number: '4000000000000002',
        exp_month: '10',
        exp_year: '2025',
        security_code: '789',
        name: 'Test Visa Decline'
      },
      visa_3ds: {
        number: '4000000000000010',
        exp_month: '09',
        exp_year: '2025',
        security_code: '321',
        name: 'Test Visa 3DS'
      }
    };
  }

  /**
   * Generate a mock order ID with timestamp
   */
  generateOrderId(prefix = 'mock_order') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate a mock customer ID
   */
  generateCustomerId(prefix = 'customer_mock') {
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${random}`;
  }

  /**
   * Get a random test customer
   */
  getRandomCustomer() {
    return this.testCustomers[Math.floor(Math.random() * this.testCustomers.length)];
  }

  /**
   * Get a random test product
   */
  getRandomProduct() {
    return this.testProducts[Math.floor(Math.random() * this.testProducts.length)];
  }

  /**
   * Get a random test amount
   */
  getRandomAmount() {
    const amounts = Object.values(this.testAmounts);
    return amounts[Math.floor(Math.random() * amounts.length)];
  }

  /**
   * Get a test card by type
   */
  getTestCard(type = 'visa_success') {
    return this.testCards[type] || this.testCards.visa_success;
  }

  /**
   * Generate mock order data for Express Checkout
   */
  generateMockExpressCheckoutOrder(customData = {}) {
    const customer = customData.customer || this.getRandomCustomer();
    const product = customData.product || this.getRandomProduct();
    const amount = customData.amount || this.getRandomAmount();

    return {
      order_id: this.generateOrderId(),
      amount: amount,
      currency: customData.currency || 'INR',
      customer_id: customer.id,
      customer_email: customer.email,
      customer_phone: customer.phone,
      product_id: product.id,
      description: `Mock Test: ${product.name}`,
      return_url: customData.return_url || 'https://92507e026455.ngrok-free.app/payment/callback',
      metadata: {
        created_at: new Date().toISOString(),
        source: 'mock-test-environment',
        integration_type: 'express_checkout',
        test_scenario: customData.test_scenario || 'standard_test',
        customer_name: customer.name,
        product_name: product.name,
        mock_data: true
      }
    };
  }

  /**
   * Generate mock session data
   */
  generateMockSession(customData = {}) {
    const customer = customData.customer || this.getRandomCustomer();
    const amount = customData.amount || this.getRandomAmount();

    return {
      amount: amount,
      currency: customData.currency || 'INR',
      customer_id: customer.id,
      customer_email: customer.email,
      customer_phone: customer.phone,
      return_url: customData.return_url || 'https://92507e026455.ngrok-free.app/payment/success',
      metadata: {
        created_at: new Date().toISOString(),
        source: 'mock-session-test',
        customer_name: customer.name,
        mock_data: true
      }
    };
  }

  /**
   * Generate test scenarios for comprehensive testing
   */
  getTestScenarios() {
    return [
      {
        name: 'Small Amount Success',
        data: this.generateMockExpressCheckoutOrder({
          amount: this.testAmounts.small,
          test_scenario: 'small_amount_success'
        }),
        card: this.testCards.visa_success,
        expected_result: 'success'
      },
      {
        name: 'Medium Amount Success',
        data: this.generateMockExpressCheckoutOrder({
          amount: this.testAmounts.medium,
          test_scenario: 'medium_amount_success'
        }),
        card: this.testCards.mastercard_success,
        expected_result: 'success'
      },
      {
        name: 'Large Amount 3DS',
        data: this.generateMockExpressCheckoutOrder({
          amount: this.testAmounts.large,
          test_scenario: 'large_amount_3ds'
        }),
        card: this.testCards.visa_3ds,
        expected_result: '3ds_required'
      },
      {
        name: 'Payment Failure Test',
        data: this.generateMockExpressCheckoutOrder({
          amount: this.testAmounts.medium,
          test_scenario: 'payment_failure'
        }),
        card: this.testCards.visa_failure,
        expected_result: 'failure'
      }
    ];
  }

  /**
   * Generate bulk test orders for dashboard population
   */
  generateBulkTestOrders(count = 10) {
    const orders = [];
    const scenarios = ['standard_test', 'bulk_test_1', 'bulk_test_2', 'performance_test'];
    
    for (let i = 0; i < count; i++) {
      const scenario = scenarios[i % scenarios.length];
      orders.push(this.generateMockExpressCheckoutOrder({
        test_scenario: `${scenario}_${i + 1}`
      }));
    }
    
    return orders;
  }
}

module.exports = JusPayMockDataGenerator;
