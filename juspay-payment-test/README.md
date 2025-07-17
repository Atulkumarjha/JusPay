# JusPay Express Checkout Integration Test Environment

A comprehensive Node.js application for testing JusPay Express Checkout API integration with support for orders, sessions, payment processing, and webhooks.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Update `.env` file with your JusPay Express Checkout credentials
   - Get credentials from JusPay merchant dashboard

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
├── server.js              # Main Express server
├── public/                # Frontend assets
│   ├── index.html         # Express Checkout test interface
│   ├── style.css          # Styling
│   └── script.js          # Frontend JavaScript
├── routes/                # API route handlers
│   └── payment.js         # Express Checkout endpoints
├── utils/                 # Utility modules
│   └── juspay.js          # JusPay Express Checkout API client
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── README.md             # This file
└── SETUP.md              # Detailed setup guide
```

## 🔧 Express Checkout API Endpoints

### Core Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create` | Create Express Checkout order |
| POST | `/api/payment/session` | Create Express Checkout session |
| POST | `/api/payment/process` | Process payment through session |
| POST | `/api/payment/link` | Create payment link |

### Status & Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment/order/:order_id` | Get order status |
| GET | `/api/payment/session/:session_id` | Get session status |
| GET | `/api/payment/methods` | Get available payment methods |
| GET | `/api/payment/customer/:id/methods` | Get customer saved methods |

### Advanced Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/refund` | Process refund |
| POST | `/api/payment/capture` | Capture pre-authorized payment |
| POST | `/api/payment/void` | Void pre-authorized payment |
| POST | `/api/payment/callback` | Webhook handler |

## 🧪 Testing Features

### Express Checkout Order Flow
1. Create order using `/api/payment/create`
2. Get payment link from response
3. Complete payment through JusPay checkout
4. Verify status using order status endpoint

### Express Checkout Session Flow
1. Create session using `/api/payment/session`
2. Get client auth token and SDK payload
3. Process payment using `/api/payment/process`
4. Monitor session status for updates

### Payment Methods Testing
- **Cards:** Visa, Mastercard, American Express
- **UPI:** Various UPI apps and VPAs
- **Net Banking:** Major Indian banks
- **Wallets:** Popular digital wallets

## 🔒 Security Features

- **Webhook Signature Verification:** HMAC-SHA256 validation
- **API Key Authentication:** Base64 encoded API keys
- **Environment Variable Protection:** Sensitive data in .env
- **Request/Response Logging:** Detailed API interaction logs

## 📊 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JUSPAY_MERCHANT_ID` | Your merchant ID | ✅ | - |
| `JUSPAY_API_KEY` | Your API key | ✅ | - |
| `JUSPAY_BASE_URL` | API base URL | ❌ | `https://sandbox.juspay.in` |
| `JUSPAY_PRODUCT_ID` | Default product ID | ❌ | `default` |
| `JUSPAY_WEBHOOK_SECRET` | Webhook verification secret | ❌ | - |
| `PORT` | Server port | ❌ | `3000` |
| `NODE_ENV` | Environment mode | ❌ | `development` |

## 🎯 Key Features

### Express Checkout Order Management
- Create and track orders
- Real-time status updates
- Multiple payment method support
- Automatic webhook handling

### Session-based Integration
- Client auth token generation
- SDK payload creation
- Session state management
- Real-time payment processing

### Customer Wallet Management
- Save payment methods
- List customer cards/wallets
- Secure tokenization
- Express checkout for returning customers

### Advanced Payment Operations
- Pre-authorization and capture
- Partial and full refunds
- Payment voiding
- Multi-currency support

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors**
- Verify API key and merchant ID
- Check base URL configuration
- Ensure proper encoding

**Order Creation Failures**
- Validate required fields
- Check amount format
- Verify currency codes

**Webhook Issues**
- Verify endpoint accessibility
- Check signature validation
- Monitor server logs

## 📚 Documentation Links

- [JusPay Express Checkout Docs](https://juspay.io/docs/express-checkout)
- [API Reference](https://juspay.io/api-reference)
- [Integration Guide](https://juspay.io/integration-guide)
- [Webhook Documentation](https://juspay.io/webhooks)

## 🆘 Support

Need help? Reach out through:
- **Email:** support@juspay.in
- **Portal:** [JusPay Support](https://portal.juspay.in/support)
- **Documentation:** [Developer Portal](https://juspay.io/docs)
