# JusPay Payment Platform - Complete Documentation

## 🌐 **Platform URLs**

### **🏠 Main Application URLs**
- **Base URL**: `https://4fc85aa9398b.ngrok-free.app/`
- **Login Page**: `https://4fc85aa9398b.ngrok-free.app/login`
- **Main Dashboard**: `https://4fc85aa9398b.ngrok-free.app/glo-coin`

### **💳 Payment URLs**
- **Create Payment Order**: `https://4fc85aa9398b.ngrok-free.app/payment/create-order` (POST)
- **Complete Payment**: `https://4fc85aa9398b.ngrok-free.app/payment/complete` (POST)
- **View Payment Orders**: `https://4fc85aa9398b.ngrok-free.app/payment/orders` (GET)

### **💰 Wallet & Transaction URLs**
- **Add Money to Wallet**: `https://4fc85aa9398b.ngrok-free.app/add-money` (POST)
- **Convert to Glo Coin**: `https://4fc85aa9398b.ngrok-free.app/convert-to-glo` (POST)
- **Convert from Glo Coin**: `https://4fc85aa9398b.ngrok-free.app/convert-from-glo` (POST)
- **Withdraw Money**: `https://4fc85aa9398b.ngrok-free.app/withdraw` (POST)
- **Update Bank Details**: `https://4fc85aa9398b.ngrok-free.app/update-bank-details` (POST)
- **Get Balance**: `https://4fc85aa9398b.ngrok-free.app/balance` (GET)

### **🔒 Authentication URLs**
- **Login**: `https://4fc85aa9398b.ngrok-free.app/login` (POST)
- **Logout**: `https://4fc85aa9398b.ngrok-free.app/logout` (POST)

### **🔗 Webhook URLs**
- **Payment Callback**: `https://4fc85aa9398b.ngrok-free.app/api/payment/callback` (POST)
- **Withdrawal Success**: `https://4fc85aa9398b.ngrok-free.app/api/payment/callback/withdrawal/success` (GET)

### **📊 API Status URLs**
- **Payment Status**: `https://4fc85aa9398b.ngrok-free.app/api/payment/status/:orderId` (GET)

---

## 🔐 **Login Credentials**

### **Demo User Account**
- **Username**: `demouser`
- **Password**: `password`

### **Account Features**
- Pre-configured demo account with initial balance
- Access to all platform features
- Wallet operations (add money, convert, withdraw)
- JusPay payment integration
- Transaction history

---

## 🏦 **JusPay Integration Credentials**

### **Sandbox Environment**
- **Merchant ID**: `blowtrumpet`
- **API Key**: `517265F5745469FBC27DD85D0EF308`
- **Base URL**: `https://sandbox.juspay.in`
- **Environment**: Sandbox (Test Mode)

### **Customer Data (for testing)**
- **Customer ID**: `customer_mock_test_001`
- **Customer Email**: `mock.test@example.com`
- **Customer Phone**: `+91 9999999999`
- **Customer Name**: `Mock Test User`

---

## 🚀 **Quick Start Guide**

### **Step 1: Access the Platform**
1. Visit: `https://4fc85aa9398b.ngrok-free.app/`
2. You'll be redirected to the login page

### **Step 2: Login**
1. Enter credentials:
   - Username: `demouser`
   - Password: `password`
2. Click "Login"
3. You'll be redirected to the main dashboard

### **Step 3: Use the Platform**
1. **Add Money**: Use the "Add Money" section to add funds to your wallet
2. **JusPay Payment**: Click "Pay with JusPay" to test payment integration
3. **Convert Coins**: Convert between wallet money and Glo Coins
4. **Withdraw**: Set up bank details and withdraw money
5. **View Orders**: Check your payment history

---

## 💡 **Testing Features**

### **Payment Testing**
- All payments are in **sandbox mode** - no real money involved
- Payments create orders in JusPay dashboard
- Payment simulation with success/failure options
- Real webhook integration with JusPay

### **Wallet Operations**
- Add money to wallet (simulated)
- Convert wallet money to Glo Coins (1:1 ratio)
- Convert Glo Coins back to wallet money
- Withdraw money to bank account (simulated)

### **Bank Account Setup**
- Configure bank details for withdrawals
- Supported banks: HDFC, SBI, ICICI, Axis, Kotak
- Account validation and storage

---

## 📋 **API Endpoints for Developers**

### **Authentication**
```
POST /login
Body: { "username": "demouser", "password": "password" }
```

### **Payment Creation**
```
POST /payment/create-order
Body: { "amount": 100, "currency": "INR" }
```

### **Payment Completion**
```
POST /payment/complete
Body: { "order_id": "ORDER_xxx", "status": "success" }
```

### **Wallet Operations**
```
POST /add-money
Body: { "amount": 100 }

POST /convert-to-glo
Body: { "amount": 50 }

POST /convert-from-glo
Body: { "amount": 25 }

POST /withdraw
Body: { "amount": 75 }
```

### **Balance Check**
```
GET /balance
Returns: { "wallet_balance": 100, "glo_coin_balance": 50 }
```

---

## 🔧 **Technical Details**

### **Database**
- **Type**: SQLite
- **Location**: `users.db`
- **Tables**: users, orders, withdrawal_transactions

### **Session Management**
- Express session with secure cookies
- Session timeout: 24 hours
- Automatic logout on inactivity

### **Security**
- Password hashing with bcrypt
- Session-based authentication
- CSRF protection
- Input validation

---

## 📱 **Dashboard Features**

### **Main Dashboard** (`/glo-coin`)
- **Wallet Balance**: Current wallet money
- **Glo Coin Balance**: Current Glo Coin balance
- **Add Money**: Add funds to wallet
- **JusPay Payment**: Integrated payment system
- **Convert Coins**: Bi-directional conversion
- **Withdraw**: Bank account withdrawal
- **Order History**: View all transactions

### **Payment Modal**
- Real-time payment status
- Order ID tracking
- Payment simulation controls
- Success/failure handling

### **Bank Details**
- Bank name selection
- Account number input
- Account holder name
- Secure storage

---

## 🎯 **Important Notes**

### **Sandbox Environment**
- All transactions are **TEST ONLY**
- No real money is processed
- JusPay sandbox credentials are used
- Orders appear in JusPay test dashboard

### **Data Persistence**
- User data is stored in local SQLite database
- Session data is maintained across browser sessions
- Transaction history is preserved

### **Webhook Integration**
- Real webhook endpoint configured
- JusPay sends callbacks to the platform
- Automatic order status updates
- Transaction logging

---

## 🔄 **Common Workflows**

### **Payment Flow**
1. User adds money via JusPay
2. Order created in JusPay dashboard
3. Payment simulation (success/failure)
4. Wallet balance updated
5. Transaction recorded

### **Withdrawal Flow**
1. User sets up bank details
2. Withdrawal request created
3. JusPay withdrawal order generated
4. Wallet balance deducted
5. Transaction logged

### **Coin Conversion**
1. User selects conversion type
2. Balance validation
3. Conversion processing
4. Balance updates
5. Transaction history update

---

## 🆘 **Troubleshooting**

### **Login Issues**
- Ensure correct credentials: `demouser` / `password`
- Check browser console for errors
- Clear browser cache if needed

### **Payment Issues**
- Verify JusPay credentials in .env file
- Check webhook URL configuration
- Monitor server logs for errors

### **Balance Issues**
- Refresh page to update balance display
- Check transaction history for records
- Verify database connectivity

---

## 📞 **Support Information**

### **Platform Status**
- **Server**: Running on port 3000
- **Database**: SQLite operational
- **JusPay Integration**: Active
- **Webhook URL**: Configured and operational

### **Development Environment**
- **Node.js**: v22.17.0
- **Framework**: Express.js
- **Database**: SQLite3
- **Payment Gateway**: JusPay Sandbox

---

*Last Updated: July 18, 2025*
*Environment: Development/Testing*
*Status: Operational*
