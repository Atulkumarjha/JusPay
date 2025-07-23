# Payment Gateway Dashboard Tracking Guide

## Overview
Both JusPay and Razorpay integrations are configured to ensure that **all transactions appear in their respective dashboards**, just like in production environments. This provides complete visibility into payment flows for testing and monitoring.

## How Dashboard Tracking Works

### 🔷 **JusPay Dashboard Tracking**

#### Order Creation:
- **Real API Calls**: Every payment creates a real order in JusPay sandbox
- **Dashboard Visibility**: Orders appear immediately in your JusPay merchant dashboard
- **Order ID Format**: `JUSPAY_ORDER_[timestamp]_[random]`
- **Status Updates**: Order status updates are reflected in the dashboard

#### Implementation Details:
```javascript
// JusPay Service automatically calls:
await this.createJusPayOrder(orderData) // Creates real order in dashboard

// Console Output:
✅ JusPay order created and will appear in dashboard: ORDER_123456
```

#### Withdrawal Tracking:
- **Withdrawal Orders**: Withdrawals are created as orders in JusPay dashboard
- **Metadata Tracking**: Bank details and transaction info stored in order metadata
- **Status Monitoring**: Withdrawal status can be tracked through dashboard

---

### 🔶 **Razorpay Dashboard Tracking**

#### Order Creation:
- **Real API Calls**: Every payment creates a real order in Razorpay test mode
- **Dashboard Visibility**: Orders appear instantly in your Razorpay dashboard
- **Order ID Format**: `RAZORPAY_ORDER_[timestamp]_[random]`
- **Payment Tracking**: Payments are linked to orders for complete visibility

#### Implementation Details:
```javascript
// Razorpay Service automatically calls:
await this.createRazorpayOrder(orderData) // Creates real order in dashboard

// Console Output:
✅ Razorpay order created and will appear in dashboard: order_abc123xyz
```

#### Payout/Withdrawal Tracking:
- **Primary Method**: Creates real payouts when Razorpay Payouts API is enabled
- **Fallback Method**: Creates orders with withdrawal metadata when payouts unavailable
- **Dashboard Visibility**: Both methods ensure transactions appear in dashboard

---

## Configuration for Dashboard Tracking

### JusPay Configuration:
```bash
# In .env file
JUSPAY_MERCHANT_ID=blowtrumpet
JUSPAY_API_KEY=517265F5745469FBC27DD85D0EF308
JUSPAY_BASE_URL=https://sandbox.juspay.in
```

### Razorpay Configuration:
```bash
# In .env file
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisissamplekeysecret
RAZORPAY_WEBHOOK_SECRET=whsec_test_sample_webhook_secret
```

## Dashboard Logging and Monitoring

### Console Output Examples:

#### JusPay Transactions:
```
Creating JusPay order for dashboard tracking...
✅ JusPay order created and will appear in dashboard: JUSPAY_ORDER_1705734567_abc123
🔄 Processing JusPay payment for order: JUSPAY_ORDER_1705734567_abc123, Status: SUCCESS
📊 JusPay payment processed: ✅ SUCCESS - Transaction: juspay_txn_1705734568
```

#### Razorpay Transactions:
```
Creating Razorpay order for dashboard tracking...
✅ Razorpay order created and will appear in dashboard: order_MzQ5NjA3MjU2NzI4OQ
🔄 Processing Razorpay payment for order: RAZORPAY_ORDER_1705734567_xyz789, Status: SUCCESS
📊 Payment processed: ✅ SUCCESS - Transaction: rzp_txn_1705734568
```

## Accessing Your Dashboards

### 🔷 JusPay Dashboard:
1. **Login URL**: [https://sandbox.juspay.in](https://sandbox.juspay.in)
2. **Credentials**: Use your merchant credentials
3. **Navigation**: Dashboard → Transactions → Orders
4. **What to Look For**: 
   - Order IDs starting with `JUSPAY_ORDER_`
   - Transaction amounts in paisa (₹1 = 100 paisa)
   - Customer information and metadata

### 🔶 Razorpay Dashboard:
1. **Login URL**: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Environment**: Make sure you're in "Test Mode"
3. **Navigation**: Payments → Orders or Payments → Payouts
4. **What to Look For**:
   - Order IDs starting with `order_`
   - Payment amounts in paisa (₹1 = 100 paisa)
   - Order receipts matching `RAZORPAY_ORDER_` pattern

## Transaction Flow Examples

### Payment Creation:
1. **User Action**: Creates payment order through UI
2. **API Call**: Real order created in gateway dashboard
3. **User Simulation**: Simulates payment success/failure
4. **Status Update**: Order status updated in dashboard
5. **Completion**: Transaction visible in dashboard history

### Withdrawal Processing:
1. **User Request**: Initiates withdrawal with bank details
2. **Gateway Creation**: 
   - **JusPay**: Creates order with withdrawal metadata
   - **Razorpay**: Creates payout or tracking order
3. **Dashboard Tracking**: Transaction appears with reference ID
4. **Status Monitoring**: Withdrawal status trackable through dashboard

## Benefits of Dashboard Tracking

### ✅ **Real Environment Simulation**:
- Experience exactly what production will look like
- Test dashboard workflows and monitoring
- Validate integration completeness

### ✅ **Debugging and Monitoring**:
- View transaction details in gateway interface
- Monitor success/failure rates
- Track payment timing and status updates

### ✅ **Business Intelligence**:
- Use gateway analytics and reporting
- Monitor transaction patterns
- Export data for analysis

### ✅ **Compliance and Auditing**:
- Complete transaction trail in official dashboards
- Webhook testing with real data
- Reconciliation capabilities

## Troubleshooting Dashboard Issues

### If Transactions Don't Appear:

#### Check Credentials:
```bash
# Verify .env configuration
echo $JUSPAY_MERCHANT_ID    # Should not be empty
echo $RAZORPAY_KEY_ID       # Should start with rzp_test_
```

#### Check Console Logs:
```
⚠️ JusPay credentials not configured, using mock data
⚠️ Razorpay API call failed, using mock data
```

#### Common Issues:
1. **Invalid Credentials**: Update `.env` with correct test credentials
2. **Network Issues**: Check internet connectivity
3. **API Limits**: Verify account limits not exceeded
4. **Wrong Environment**: Ensure using test/sandbox mode

### Fallback Behavior:
- **Graceful Degradation**: If API calls fail, system continues with mock data
- **User Experience**: No impact on user workflow
- **Logging**: Clear indication when using mock vs real data

## Advanced Features

### Real-time Status Updates:
- Webhooks can update order status in real-time
- Dashboard shows live transaction status
- Integration supports status polling

### Metadata Tracking:
- Custom fields stored in gateway dashboards
- User information and transaction context
- Integration-specific reference data

### Multi-gateway Analytics:
- Compare performance across gateways
- A/B testing capabilities
- Gateway-specific success rates

---

**Note**: This tracking system ensures that your test environment behaves exactly like production, giving you complete confidence in your payment integration before going live.

**Last Updated**: July 19, 2025  
**Compatible With**: JusPay Sandbox, Razorpay Test Mode
