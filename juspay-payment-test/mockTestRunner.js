const JusPayMockDataGenerator = require('./utils/mockDataGenerator');
const juspayService = require('./utils/juspay');
const chalk = require('chalk');

/**
 * JusPay Mock Data Test Runner
 * Runs comprehensive tests with mock data that will appear in your JusPay dashboard
 * All transactions are sandbox/test - no real money involved
 */

class JusPayMockTestRunner {
  constructor() {
    this.mockGenerator = new JusPayMockDataGenerator();
    this.juspayService = juspayService;
    this.results = {
      orders_created: [],
      sessions_created: [],
      payments_processed: [],
      webhooks_received: [],
      errors: []
    };
  }

  /**
   * Display test banner
   */
  displayBanner() {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('    🧪 JusPay Mock Data Test Runner'));
    console.log(chalk.cyan('    Testing with JusPay Sandbox Environment'));
    console.log(chalk.yellow('    ⚠️  All transactions are TEST ONLY - No real money'));
    console.log(chalk.green('    ✅ Results will appear in your JusPay dashboard'));
    console.log(chalk.cyan('='.repeat(60) + '\n'));
  }

  /**
   * Test 1: Create mock Express Checkout orders
   */
  async testMockOrderCreation() {
    console.log(chalk.blue('\n📋 Test 1: Creating Mock Express Checkout Orders...\n'));

    const scenarios = this.mockGenerator.getTestScenarios();
    
    for (const scenario of scenarios) {
      try {
        console.log(chalk.gray(`  Creating: ${scenario.name}...`));
        
        const result = await this.juspayService.createOrder(scenario.data);
        
        if (result.success) {
          this.results.orders_created.push({
            scenario: scenario.name,
            order_id: scenario.data.order_id,
            juspay_id: result.data.id,
            amount: scenario.data.amount,
            currency: scenario.data.currency,
            payment_links: result.data.payment_links
          });
          
          console.log(chalk.green(`  ✅ ${scenario.name}: Order ${result.data.order_id}`));
          console.log(chalk.gray(`     JusPay ID: ${result.data.id}`));
          console.log(chalk.gray(`     Amount: ${scenario.data.currency} ${scenario.data.amount/100}`));
        } else {
          this.results.errors.push({
            test: scenario.name,
            error: result.error
          });
          console.log(chalk.red(`  ❌ ${scenario.name}: Failed`));
        }
        
        // Wait 1 second between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.results.errors.push({
          test: scenario.name,
          error: error.message
        });
        console.log(chalk.red(`  ❌ ${scenario.name}: Error - ${error.message}`));
      }
    }
  }

  /**
   * Test 2: Create bulk orders for dashboard population
   */
  async testBulkOrderCreation(count = 5) {
    console.log(chalk.blue(`\n📦 Test 2: Creating ${count} Bulk Mock Orders...\n`));

    const bulkOrders = this.mockGenerator.generateBulkTestOrders(count);
    
    for (let i = 0; i < bulkOrders.length; i++) {
      try {
        const orderData = bulkOrders[i];
        console.log(chalk.gray(`  Creating bulk order ${i + 1}/${count}...`));
        
        const result = await this.juspayService.createOrder(orderData);
        
        if (result.success) {
          this.results.orders_created.push({
            scenario: `bulk_order_${i + 1}`,
            order_id: orderData.order_id,
            juspay_id: result.data.id,
            amount: orderData.amount,
            currency: orderData.currency
          });
          
          console.log(chalk.green(`  ✅ Bulk Order ${i + 1}: ${result.data.order_id}`));
        } else {
          this.results.errors.push({
            test: `bulk_order_${i + 1}`,
            error: result.error
          });
          console.log(chalk.red(`  ❌ Bulk Order ${i + 1}: Failed`));
        }
        
        // Wait 500ms between bulk requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        this.results.errors.push({
          test: `bulk_order_${i + 1}`,
          error: error.message
        });
        console.log(chalk.red(`  ❌ Bulk Order ${i + 1}: Error - ${error.message}`));
      }
    }
  }

  /**
   * Test 3: Test different currencies
   */
  async testMultiCurrencyOrders() {
    console.log(chalk.blue('\n💱 Test 3: Testing Multi-Currency Orders...\n'));

    const currencies = [
      { code: 'INR', amount: 50000 }, // ₹500.00
      { code: 'USD', amount: 1000 },  // $10.00
      { code: 'EUR', amount: 850 },   // €8.50
      { code: 'GBP', amount: 750 }    // £7.50
    ];

    for (const currency of currencies) {
      try {
        const orderData = this.mockGenerator.generateMockExpressCheckoutOrder({
          amount: currency.amount,
          currency: currency.code,
          test_scenario: `multi_currency_${currency.code.toLowerCase()}`
        });

        console.log(chalk.gray(`  Creating ${currency.code} order...`));
        
        const result = await this.juspayService.createOrder(orderData);
        
        if (result.success) {
          this.results.orders_created.push({
            scenario: `multi_currency_${currency.code}`,
            order_id: orderData.order_id,
            juspay_id: result.data.id,
            amount: currency.amount,
            currency: currency.code
          });
          
          console.log(chalk.green(`  ✅ ${currency.code}: ${result.data.order_id}`));
        } else {
          this.results.errors.push({
            test: `multi_currency_${currency.code}`,
            error: result.error
          });
          console.log(chalk.red(`  ❌ ${currency.code}: Failed`));
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        this.results.errors.push({
          test: `multi_currency_${currency.code}`,
          error: error.message
        });
        console.log(chalk.red(`  ❌ ${currency.code}: Error - ${error.message}`));
      }
    }
  }

  /**
   * Display final test results
   */
  displayResults() {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('           📊 TEST RESULTS SUMMARY'));
    console.log(chalk.cyan('='.repeat(60)));
    
    console.log(chalk.green(`\n✅ Orders Created: ${this.results.orders_created.length}`));
    console.log(chalk.red(`❌ Errors: ${this.results.errors.length}`));
    
    if (this.results.orders_created.length > 0) {
      console.log(chalk.blue('\n📋 Created Orders (will appear in JusPay Dashboard):'));
      this.results.orders_created.forEach((order, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${order.scenario}`));
        console.log(chalk.gray(`     Order ID: ${order.order_id}`));
        console.log(chalk.gray(`     JusPay ID: ${order.juspay_id}`));
        console.log(chalk.gray(`     Amount: ${order.currency} ${order.amount/100}`));
        if (order.payment_links) {
          console.log(chalk.gray(`     Payment Link: ${order.payment_links.web}`));
        }
        console.log('');
      });
    }

    if (this.results.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors Encountered:'));
      this.results.errors.forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. ${error.test}: ${error.error}`));
      });
    }

    console.log(chalk.yellow('\n💡 Next Steps:'));
    console.log(chalk.gray('  1. Check your JusPay Dashboard for test transactions'));
    console.log(chalk.gray('  2. Use the payment links to test payment flows'));
    console.log(chalk.gray('  3. Monitor webhook callbacks for order status updates'));
    
    console.log(chalk.cyan('\n' + '='.repeat(60) + '\n'));
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.displayBanner();
    
    try {
      await this.testMockOrderCreation();
      await this.testBulkOrderCreation(5);
      await this.testMultiCurrencyOrders();
      
      this.displayResults();
      
    } catch (error) {
      console.log(chalk.red(`\n💥 Fatal Error: ${error.message}`));
      console.log(chalk.gray('Check your JusPay credentials and network connection.'));
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testRunner = new JusPayMockTestRunner();
  testRunner.runAllTests().catch(console.error);
}

module.exports = JusPayMockTestRunner;
