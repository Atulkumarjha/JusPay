# Dual Payment Gateway Integration Documentation

## Overview
The Glo Coin platform now supports dual payment gateway integration with **JusPay** and **Razorpay**. Super administrators can switch between payment gateways through the admin dashboard interface.

## Payment Gateways Supported

### 1. JusPay (Default)
- **Type**: Primary payment gateway (default)
- **Environment**: Sandbox/Test
- **Features**: Direct API integration, order tracking, webhook support
- **Order ID Format**: `JUSPAY_ORDER_[timestamp]_[random]`

### 2. Razorpay (Secondary)
- **Type**: Alternative payment gateway
- **Environment**: Test/Production
- **Features**: Comprehensive payment API, payouts, refunds
- **Order ID Format**: `RAZORPAY_ORDER_[timestamp]_[random]`

## Super Admin Functionality

### Access Control
- **Username**: `superadmin`
- **Password**: `SuperAdmin@2025!`
- **Access URL**: `/admin`
- **Role**: `superadmin` (database field)

### Gateway Management Features
1. **View Gateway Status**: See which gateway is currently active
2. **Health Check**: Monitor configuration status of all gateways
3. **Switch Gateway**: Change active payment gateway in real-time
4. **View Statistics**: Platform analytics and gateway usage data
5. **User Management**: View all users and their transaction history
6. **Order Tracking**: View all orders with gateway information

## Configuration

### Environment Variables (.env)

```bash
# JusPay Configuration
JUSPAY_MERCHANT_ID=blowtrumpet
JUSPAY_API_KEY=517265F5745469FBC27DD85D0EF308
JUSPAY_BASE_URL=https://sandbox.juspay.in

# Razorpay Configuration (Test Environment)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_ACCOUNT_NUMBER=2323230000000000

# Active Gateway Selection
ACTIVE_PAYMENT_GATEWAY=juspay  # Options: 'juspay' or 'razorpay'
```

### Gateway Configuration Steps

#### For JusPay:
1. Update `JUSPAY_MERCHANT_ID` with your merchant ID
2. Update `JUSPAY_API_KEY` with your API key
3. Set `JUSPAY_BASE_URL` (sandbox or production)

#### For Razorpay:
1. Get credentials from Razorpay Dashboard
2. Update `RAZORPAY_KEY_ID` with your key ID
3. Update `RAZORPAY_KEY_SECRET` with your secret
4. Set webhook secret for secure webhook handling

## API Endpoints

### Super Admin Routes
- `GET /admin` - Admin dashboard
- `GET /api/admin/payment-gateways` - Get gateway status
- `POST /api/admin/switch-gateway` - Switch active gateway
- `GET /api/admin/gateway-config` - Get gateway configuration
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/stats` - Get platform statistics

### Payment Routes (Updated)
- `POST /payment/create-order` - Create order with active gateway
- `POST /payment/complete` - Complete payment (supports both gateways)
- `GET /payment/orders` - Get user order history

## Architecture Components

### 1. PaymentGatewayManager.js
Central manager that handles gateway switching and proxies requests to the active gateway.

**Key Methods:**
- `switchGateway(gatewayName)` - Switch between gateways
- `getActiveGateway()` - Get current active gateway instance
- `createPaymentSession(orderData)` - Create payment with active gateway
- `processPayment(orderId, paymentData)` - Process payment
- `healthCheck()` - Check gateway configurations

### 2. JusPayService.js (Enhanced)
Enhanced service for JusPay integration with unified interface.

**Features:**
- Order creation and tracking
- Payment processing
- Webhook signature validation
- Mock payment simulation

### 3. RazorpayService.js (New)
Complete Razorpay integration service.

**Features:**
- Order creation via Razorpay API
- Payment verification
- Payout/withdrawal support
- Webhook signature validation
- Razorpay SDK support

## User Interface Updates

### Frontend Changes
1. **Generic Payment Form**: Updated button text to "Create Payment Order"
2. **Gateway Display**: Shows active gateway in payment modal
3. **Gateway Badges**: Visual indicators for different gateways
4. **Order History**: Displays gateway used for each transaction

### Admin Dashboard
1. **Gateway Selector**: Visual interface to switch gateways
2. **Health Status**: Real-time gateway configuration status
3. **Statistics**: Platform metrics with gateway information
4. **Order Management**: View orders by gateway type

## Database Schema Updates

### Users Table (Enhanced)
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
```

### Orders Table (Compatible)
- Existing structure supports both gateways
- `order_id` field stores gateway-prefixed IDs
- `juspay_response` field stores gateway response data

## Testing and Simulation

### Payment Simulation
Both gateways support payment simulation in test environment:
1. **Success Simulation**: Simulates successful payment
2. **Failure Simulation**: Simulates payment failure
3. **Gateway-Specific**: Button text updates based on active gateway

### Test Credentials

#### JusPay Sandbox:
- Merchant ID: `blowtrumpet`
- API Key: `517265F5745469FBC27DD85D0EF308`
- Environment: Sandbox

#### Razorpay Test:
- Key ID: Configure in `.env`
- Key Secret: Configure in `.env`
- Environment: Test mode

## Security Considerations

### Authentication
- Super admin role-based access control
- Session-based authentication
- Secure password requirements

### API Security
- Webhook signature validation
- Environment variable protection
- Input validation and sanitization

### Payment Security
- Secure API key storage
- HTTPS communication
- Transaction logging

## Deployment Guidelines

### Production Setup
1. **Environment Variables**: Update all production credentials
2. **SSL/HTTPS**: Ensure secure communication
3. **Webhook URLs**: Configure production webhook endpoints
4. **Database Backup**: Regular backup of transaction data

### Monitoring
1. **Gateway Health**: Monitor gateway availability
2. **Transaction Success Rate**: Track payment success rates
3. **Error Logging**: Comprehensive error tracking
4. **Performance Metrics**: API response times

## Troubleshooting

### Common Issues
1. **Gateway Misconfiguration**: Check credentials in `.env`
2. **Network Issues**: Verify API endpoint connectivity
3. **Webhook Failures**: Validate webhook signatures
4. **Database Errors**: Check SQLite file permissions

### Error Messages
- `Invalid gateway: [name]` - Unsupported gateway name
- `Gateway misconfigured` - Missing or invalid credentials
- `Payment session creation failed` - API communication error
- `Super admin access required` - Insufficient permissions

## Migration Guide

### From Single to Dual Gateway
1. **Backup Database**: Create backup before migration
2. **Update Dependencies**: Install Razorpay package
3. **Configure Environment**: Add Razorpay credentials
4. **Update Frontend**: Deploy new UI components
5. **Test Integration**: Verify both gateways work
6. **Train Admins**: Provide admin interface training

## Support and Maintenance

### Regular Tasks
1. **Credential Rotation**: Update API keys periodically
2. **Gateway Updates**: Monitor gateway API changes
3. **Performance Review**: Analyze transaction success rates
4. **Security Audits**: Regular security assessments

### Contact Information
- Technical Support: Configure based on organization
- Gateway Support: Direct contact with JusPay/Razorpay
- Emergency Contacts: Define escalation procedures

---

**Last Updated**: July 19, 2025
**Version**: 2.0 (Dual Gateway Integration)
**Compatibility**: Node.js 14+, SQLite 3.x
