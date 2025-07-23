# Cashfree Mock Mode Documentation

## Overview
The Cashfree service automatically detects when credentials are not provided and switches to **Mock Mode**. This mode provides a complete simulation of the Cashfree payment flow with detailed JSON logging for testing and development purposes.

## Features

### 🎯 Automatic Detection
- Service automatically detects missing `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY`
- Switches to mock mode without any configuration needed
- Displays clear indicators when running in mock vs real mode

### 📊 Detailed JSON Logging
- **Request Logging**: Shows complete API request structure
- **Response Logging**: Displays mock API responses in JSON format
- **Dashboard Tracking**: Simulates dashboard analytics tracking
- **Error Handling**: Shows fallback responses when APIs fail

### 🔄 Complete Payment Flow
1. **Payment Session Creation**: Mock order creation with realistic data
2. **Payment Processing**: Simulated payment verification and processing
3. **Dashboard Tracking**: Mock analytics and reporting
4. **Withdrawal Orders**: Payout simulation for testing

## Mock Data Structure

### Payment Session Response
```json
{
  "cf_order_id": 1753080311754,
  "created_at": "2025-07-21T06:45:11.754Z",
  "customer_details": {
    "customer_id": "user_user123",
    "customer_name": "GloCoin Customer",
    "customer_email": "customer@glocoin.com",
    "customer_phone": "9999999999"
  },
  "entity": "order",
  "order_amount": 500,
  "order_currency": "INR",
  "order_expiry_time": "2025-07-22T06:45:11.754Z",
  "order_id": "CF_order_test_1753080311754",
  "payment_session_id": "session_1753080311755_k46j2ro33",
  "order_status": "ACTIVE"
}
```

### Payment Processing Response
```json
{
  "orderId": "CF_order_test_1753080311754",
  "amount": 500,
  "status": "SUCCESS",
  "gateway": "cashfree",
  "transactionId": "cf_txn_1753080311755",
  "timestamp": "2025-07-21T06:45:11.755Z",
  "processing_time": "2076.64ms",
  "mock": true
}
```

## Testing Commands

### Run Complete Flow Test
```bash
node test-cashfree-flow.js
```

### Switch to Cashfree Gateway
1. Open admin panel: `http://localhost:3000/admin`
2. Login with: `admin` / `admin123`
3. Toggle to Cashfree gateway
4. Watch terminal for detailed JSON logs

### Test Payment Flow
1. Open payment dashboard: `http://localhost:3000/glo-coin`
2. Login with: `demo` / `demo123`
3. Create a payment to see detailed logs

## Enabling Real Cashfree Integration

To switch from mock mode to real Cashfree integration:

1. **Add credentials to `.env` file**:
```env
CASHFREE_APP_ID=your_actual_app_id
CASHFREE_SECRET_KEY=your_actual_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
```

2. **Restart the server**:
```bash
npm start
```

3. **Verify real mode activation**:
Look for this message in terminal:
```
✅ Using real Cashfree credentials
```

## Mock Mode Indicators

### Terminal Logs
- `⚠️  NO CASHFREE CREDENTIALS FOUND - USING MOCK MODE`
- `💡 All payment flows will use mock data and JSON responses`
- `⚠️  MOCK MODE: Dashboard tracking simulated only`

### JSON Response Fields
- `"mock": true` in payment responses
- `"environment": "mock"` in dashboard payloads
- `"mock_mode": true` in metadata

## Benefits of Mock Mode

✅ **No API Keys Required**: Test without real credentials  
✅ **Detailed Logging**: See complete request/response flow  
✅ **No Charges**: All transactions are simulated  
✅ **Realistic Data**: Mock responses mirror real API structure  
✅ **Error Testing**: Test error scenarios safely  
✅ **Development Speed**: Instant responses without network delays  

## Production Deployment

When deploying to production:
1. Add real Cashfree credentials to environment variables
2. Set `CASHFREE_BASE_URL` to production endpoint if needed
3. Monitor logs to ensure real mode activation
4. Test with small amounts first

---

*This documentation covers the mock implementation of Cashfree payment gateway integration for the GloCoin payment platform.*
