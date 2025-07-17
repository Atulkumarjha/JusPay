# JusPay Express Checkout Integration Setup Guide

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd juspay-payment-test
npm install
```

### 2. Configure Environment
Update the `.env` file with your JusPay Ex2. **Webhook Security**
   - JusPay webhook signatures are verified using HMAC-SHA256 with your API key
   - No separate webhook secret is required
   - Always use HTTPS endpoints for webhook URLs

3. **Webhook Verification**
   - Always verify signatures using your API key
   - Use HTTPS endpoints only  
   - Implement idempotency for webhook processings Checkout credentials:

```env
# JusPay Express Checkout API Configuration
JUSPAY_MERCHANT_ID=your_merchant_id_here
JUSPAY_API_KEY=your_api_key_here
JUSPAY_BASE_URL=https://sandbox.juspay.in

# Server Configuration
PORT=3000
NODE_ENV=development

# Express Checkout Specific Settings
JUSPAY_PRODUCT_ID=default
JUSPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Get JusPay Express Checkout Credentials

1. **Sign up** at [JusPay Merchant Portal](https://portal.juspay.in/)
2. **Navigate** to Express Checkout section
3. **Go to** Settings > API Keys
4. **Copy** your Merchant ID and API Key
5. **Enable** Express Checkout features
6. **Update** the `.env` file with your credentials

### 4. Start the Development Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

### 5. Test Express Checkout Integration
1. Open `http://localhost:3000` in your browser
2. Fill the payment form with test data
3. Select payment type (Order/Session/Link)
4. Click "Create Express Checkout"
5. Follow the payment flow

## 🔧 Express Checkout Configuration

### API Endpoints Configuration

**Sandbox Environment**
```env
JUSPAY_BASE_URL=https://sandbox.juspay.in
```

**Production Environment**
```env
JUSPAY_BASE_URL=https://api.juspay.in
```

### Express Checkout Specific Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JUSPAY_MERCHANT_ID` | Merchant identifier | ✅ | `merchant_123456` |
| `JUSPAY_API_KEY` | API authentication key | ✅ | `jp_live_abcd1234...` |
| `JUSPAY_BASE_URL` | API base URL | ❌ | `https://sandbox.juspay.in` |
| `JUSPAY_PRODUCT_ID` | Default product identifier | ❌ | `default_product` |
| `JUSPAY_WEBHOOK_SECRET` | Webhook signature secret | ❌ | `whsec_abc123...` |
| `PORT` | Server port number | ❌ | `3000` |
| `NODE_ENV` | Environment mode | ❌ | `development` |

## 🧪 Express Checkout Testing

### Test Payment Methods

#### Credit/Debit Cards
| Card Type | Number | CVV | Expiry | Result |
|-----------|--------|-----|--------|--------|
| Visa | 4111 1111 1111 1111 | 123 | 12/25 | Success |
| Visa | 4000 0000 0000 0002 | 123 | 12/25 | Declined |
| Mastercard | 5555 5555 5555 4444 | 123 | 12/25 | Success |
| Amex | 3782 8224 6310 005 | 1234 | 12/25 | Success |

#### UPI Testing
| VPA | Result |
|-----|--------|
| `success@payu` | Success |
| `failure@payu` | Failure |
| `test@razorpay` | Success |

#### Net Banking
Use any of the test bank codes provided in JusPay documentation.

### Express Checkout Flow Testing

#### 1. Order Flow
```bash
# Create order
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "customer_email": "test@example.com",
    "payment_type": "order"
  }'

# Check order status
curl http://localhost:3000/api/payment/order/{order_id}
```

#### 2. Session Flow
```bash
# Create session
curl -X POST http://localhost:3000/api/payment/session \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "customer_email": "test@example.com"
  }'

# Process payment
curl -X POST http://localhost:3000/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "{session_id}",
    "payment_details": {
      "payment_method": "card",
      "card": {
        "card_number": "4111111111111111",
        "card_exp_month": "12",
        "card_exp_year": "25",
        "card_security_code": "123",
        "name_on_card": "Test User"
      }
    }
  }'
```

## 📊 Express Checkout API Endpoints

### Core Express Checkout Operations

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/payment/create` | Create order | `amount`, `currency`, `customer_*` |
| POST | `/api/payment/session` | Create session | `amount`, `currency`, `customer_*` |
| POST | `/api/payment/process` | Process payment | `session_id`, `payment_details` |
| POST | `/api/payment/link` | Create payment link | `amount`, `currency`, `expire_at` |

### Status and Information

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/api/payment/order/:order_id` | Get order status | `order_id` in path |
| GET | `/api/payment/session/:session_id` | Get session status | `session_id` in path |
| GET | `/api/payment/methods` | Get payment methods | `currency`, `amount` (query) |
| GET | `/api/payment/customer/:id/methods` | Customer methods | `customer_id` in path |

### Advanced Operations

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/payment/refund` | Process refund | `order_id`, `amount`, `reason` |
| POST | `/api/payment/capture` | Capture pre-auth | `order_id`, `amount` |
| POST | `/api/payment/void` | Void pre-auth | `order_id` |
| POST | `/api/payment/callback` | Webhook handler | JusPay webhook payload |

## 🔒 Security & Webhooks

### Webhook Configuration

1. **Configure webhook URL** in JusPay dashboard:
   ```
   https://your-domain.com/api/payment/callback
   ```

2. **JusPay Webhook Signature Verification:**
   - JusPay uses your **API key** as the secret for HMAC-SHA256 signature
   - No separate webhook secret is provided by JusPay
   - Signature is typically sent in headers like `x-juspay-signature` or `juspay-signature`

3. **Webhook signature verification** (automatically handled):
   ```javascript
   // JusPay uses API key for signature verification
   const isValid = juspayService.verifyJusPayWebhookSignature(data, signature);
   ```

### JusPay Webhook Security

1. **Signature Verification**
   - JusPay generates HMAC-SHA256 signature using your API key
   - Compare received signature with computed signature
   - Use constant-time comparison to prevent timing attacks

2. **Webhook Headers**
   ```
   x-juspay-signature: sha256=abc123...
   # or
   juspay-signature: abc123...
   ```

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different keys for sandbox/production
   - Rotate API keys regularly

2. **API Security**
   - Always use HTTPS in production
   - Implement rate limiting
   - Validate all inputs

3. **Webhook Security**
   - Always verify signatures
   - Use HTTPS endpoints only
   - Implement idempotency

## 🐛 Troubleshooting Express Checkout

### Common Issues

#### 1. Authentication Failures
```
Error: Authentication failed
```
**Solutions:**
- Verify `JUSPAY_API_KEY` is correct
- Check `JUSPAY_MERCHANT_ID` matches your account
- Ensure base URL is correct for environment

#### 2. Order Creation Failures
```
Error: Failed to create Express Checkout order
```
**Solutions:**
- Validate required fields: `amount`, `currency`
- Check amount format (should be number, not string)
- Verify currency code (ISO 4217: INR, USD, etc.)

#### 3. Session Processing Issues
```
Error: Session not found or expired
```
**Solutions:**
- Check session ID is correct
- Verify session hasn't expired
- Ensure proper session creation

#### 4. Webhook Problems
```
Error: Invalid webhook signature
```
**Solutions:**
- Verify `JUSPAY_WEBHOOK_SECRET` is set
- Check webhook URL is accessible
- Ensure HTTPS is used for webhooks

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

This shows:
- All API requests/responses
- Webhook payloads
- Error stack traces
- Timing information

### Testing Connectivity

Test API connectivity:
```bash
# Health check
curl http://localhost:3000/health

# JusPay service health
curl http://localhost:3000/api/payment/health

# Get payment methods
curl "http://localhost:3000/api/payment/methods?currency=INR"
```

## 📚 Documentation & Resources

### Official JusPay Documentation
- [Express Checkout Overview](https://juspay.io/docs/express-checkout)
- [API Reference](https://juspay.io/api-reference)
- [Integration Guides](https://juspay.io/integration-guide)
- [Webhook Documentation](https://juspay.io/webhooks)

### Additional Resources
- [JusPay Developer Portal](https://portal.juspay.in/)
- [Test Cards & Methods](https://juspay.io/docs/test-data)
- [Error Codes Reference](https://juspay.io/docs/error-codes)
- [SDK Documentation](https://juspay.io/docs/sdks)

## 🆘 Support & Help

### Contact Support
- **Email:** support@juspay.in
- **Portal:** [JusPay Support Portal](https://portal.juspay.in/support)
- **Documentation:** [Developer Help Center](https://juspay.io/help)

### Community Resources
- [JusPay Developer Community](https://community.juspay.io/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/juspay)
- [GitHub Issues](https://github.com/juspay)

## 📝 Version History

### v1.0.0 - Express Checkout Implementation
- ✅ Express Checkout order creation
- ✅ Express Checkout session management
- ✅ Payment processing with multiple methods
- ✅ Customer wallet management
- ✅ Webhook handling with signature verification
- ✅ Refund and capture operations
- ✅ Comprehensive error handling
- ✅ Test interface with real-time updates
