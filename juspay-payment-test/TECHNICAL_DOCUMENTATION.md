# JusPay Payment Platform - Technical Architecture Documentation

## 🏗️ **System Architecture Overview**

### **Technology Stack**
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite3 for data persistence
- **Authentication**: bcrypt for password hashing, express-session for session management
- **Payment Gateway**: JusPay Sandbox API integration
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Tunneling**: ngrok for HTTPS webhook endpoints

### **Project Structure**
```
juspay-payment-test/
├── server.js                 # Main backend server
├── services/
│   └── JusPayService.js     # JusPay API integration service
├── public/
│   ├── login.html           # Login page
│   ├── glo-coin.html       # Main dashboard
│   └── juspay-integration.js # Frontend payment handling
├── .env                     # Environment configuration
├── package.json            # Dependencies
└── users.db                # SQLite database
```

---

## 🔧 **Core Components Explained**

### **1. server.js - Main Backend Server**

#### **Purpose**: Central server handling all API endpoints, database operations, and business logic

#### **Key Sections**:

**Database Setup**:
```javascript
const db = new sqlite3.Database('users.db');
// Creates tables: users, orders, withdrawal_transactions
```

**Session Management**:
```javascript
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
```

**Authentication Middleware**:
```javascript
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}
```

#### **API Endpoints**:

**Authentication Endpoints**:
- `POST /login` - User login with bcrypt password verification
- `POST /logout` - Session destruction and logout
- `GET /` - Root redirect to login if not authenticated

**Dashboard Endpoints**:
- `GET /glo-coin` - Serves main dashboard (requires authentication)
- `GET /balance` - Returns user's wallet and Glo Coin balance

**Wallet Operations**:
- `POST /add-money` - Adds money to user's wallet
- `POST /convert-to-glo` - Converts wallet money to Glo Coins
- `POST /convert-from-glo` - Converts Glo Coins to wallet money
- `POST /withdraw` - Withdraws money from wallet to bank account

**Payment Integration**:
- `POST /payment/create-order` - Creates JusPay payment order
- `POST /payment/complete` - Completes payment and updates balances
- `GET /payment/orders` - Retrieves user's payment history

**Bank Management**:
- `POST /update-bank-details` - Updates user's bank account information

**Webhook Endpoints**:
- `POST /api/payment/callback` - JusPay webhook callback handler

### **2. services/JusPayService.js - Payment Gateway Integration**

#### **Purpose**: Handles all JusPay API interactions and payment processing

#### **Key Methods**:

**Constructor**:
```javascript
constructor() {
    this.merchantId = process.env.JUSPAY_MERCHANT_ID;
    this.apiKey = process.env.JUSPAY_API_KEY;
    this.baseUrl = process.env.JUSPAY_BASE_URL;
    
    // Sets up axios instance with JusPay authentication
    this.api = axios.create({
        baseURL: this.baseUrl,
        auth: { username: this.apiKey, password: '' }
    });
}
```

**Order Generation**:
```javascript
generateOrderData(amount, currency = 'INR') {
    // Creates unique order ID
    // Sets customer information
    // Converts amount to smallest currency unit (paisa)
    // Returns order object for JusPay API
}
```

**Payment Session Creation**:
```javascript
async createPaymentSession(orderData) {
    // Creates real JusPay order in dashboard
    // Returns mock payment session for testing
    // Handles API errors gracefully
}
```

**JusPay Order Creation**:
```javascript
async createJusPayOrder(orderData) {
    // Makes POST request to JusPay /orders endpoint
    // Creates order that appears in JusPay dashboard
    // Handles authentication and error responses
}
```

**Withdrawal Order Creation**:
```javascript
async createWithdrawalOrder(withdrawalData) {
    // Creates withdrawal order in JusPay dashboard
    // Similar to payment order but for withdrawals
    // Includes bank account metadata
}
```

### **3. public/glo-coin.html - Main Dashboard**

#### **Purpose**: User interface for all platform operations

#### **Key Sections**:

**Balance Display**:
```html
<div class="balance-card">
    <h3>Wallet Balance</h3>
    <div class="balance-amount">₹<span id="walletBalance">0.00</span></div>
</div>
```

**Add Money Section**:
```html
<div class="add-money-section">
    <input type="number" id="addAmount" placeholder="Enter amount">
    <button onclick="addMoney()">Add Money</button>
</div>
```

**JusPay Payment Integration**:
```html
<div class="juspay-section">
    <form id="juspayPaymentForm">
        <input type="number" id="juspayAmount" placeholder="Amount">
        <button type="submit">Pay with JusPay</button>
    </form>
</div>
```

**Conversion Operations**:
```html
<div class="conversion-section">
    <button onclick="convertToGlo()">Convert to Glo Coin</button>
    <button onclick="convertFromGlo()">Convert from Glo Coin</button>
</div>
```

### **4. public/juspay-integration.js - Frontend Payment Handler**

#### **Purpose**: Handles JusPay payment form interactions and API calls

#### **Key Functions**:

**Payment Form Handler**:
```javascript
juspayForm.addEventListener('submit', async (e) => {
    // Prevents default form submission
    // Validates amount input
    // Makes API call to create payment order
    // Shows payment modal with order details
    // Handles success/error responses
});
```

**Payment Simulation**:
```javascript
simulateSuccessBtn.onclick = async () => {
    // Simulates successful payment
    // Calls /payment/complete endpoint
    // Updates UI with success status
    // Triggers balance refresh
};
```

**Order History**:
```javascript
viewOrdersBtn.onclick = async () => {
    // Fetches user's payment history
    // Displays orders in modal
    // Shows order details and status
};
```

### **5. public/login.html - Authentication Interface**

#### **Purpose**: User login interface with form validation

#### **Key Features**:
- Form validation
- AJAX login request
- Error/success message display
- Auto-redirect on successful login
- Demo credentials display

---

## 🔄 **API Workflow Detailed**

### **1. Authentication Flow**

#### **POST /login**
```javascript
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // 1. Query database for user
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        // 2. Verify password with bcrypt
        const isValid = await bcrypt.compare(password, user.password);
        
        // 3. Create session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        // 4. Return success response
        res.json({ success: true, redirectTo: '/glo-coin' });
    });
});
```

**Flow**:
1. Receive username/password from frontend
2. Query SQLite database for user record
3. Compare provided password with stored hash using bcrypt
4. Create session with user ID and username
5. Return success response with redirect URL

### **2. Payment Creation Flow**

#### **POST /payment/create-order**
```javascript
app.post('/payment/create-order', requireAuth, async (req, res) => {
    const { amount, currency } = req.body;
    const userId = req.session.userId;
    
    // 1. Generate order data
    const orderData = jusPayService.generateOrderData(amount, currency);
    
    // 2. Create payment session (includes JusPay order creation)
    const paymentSession = await jusPayService.createPaymentSession(orderData);
    
    // 3. Store order in database
    db.run(`INSERT INTO orders (user_id, order_id, session_id, amount, currency, status, customer_id, juspay_response) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [userId, orderData.order_id, paymentSession.session_id, amount, currency, 'PENDING', orderData.customer_id, JSON.stringify(paymentSession)]
    );
    
    // 4. Return order details
    res.json({ success: true, order: paymentSession });
});
```

**Flow**:
1. Validate user authentication
2. Generate unique order data with JusPay service
3. Create payment session (creates real order in JusPay dashboard)
4. Store order details in local database
5. Return order information to frontend

### **3. Payment Completion Flow**

#### **POST /payment/complete**
```javascript
app.post('/payment/complete', requireAuth, async (req, res) => {
    const { order_id, status } = req.body;
    const userId = req.session.userId;
    
    // 1. Process payment with JusPay service
    const paymentResult = await jusPayService.processPayment(order_id, { status });
    
    // 2. Update order status in database
    const newStatus = success ? 'CHARGED' : 'FAILED';
    db.run(`UPDATE orders SET status = ?, transaction_id = ?, gateway_reference_id = ?, 
            juspay_response = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`, 
        [newStatus, paymentResult.transaction_id, paymentResult.gateway_reference_id, 
         JSON.stringify(paymentResult), order_id]
    );
    
    // 3. Update user wallet balance (if successful)
    if (success) {
        db.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', 
            [amount, userId]);
    }
    
    // 4. Return completion status
    res.json({ success: true, payment: paymentResult });
});
```

**Flow**:
1. Validate authentication and get order details
2. Process payment through JusPay service
3. Update order status in database
4. If successful, add amount to user's wallet balance
5. Return payment completion status

### **4. Withdrawal Flow**

#### **POST /withdraw**
```javascript
app.post('/withdraw', requireAuth, async (req, res) => {
    const { amount } = req.body;
    const userId = req.session.userId;
    
    // 1. Validate user has sufficient balance
    db.get('SELECT wallet_balance, bank_account_number, bank_name, account_holder_name FROM users WHERE id = ?', 
        [userId], async (err, user) => {
            
        // 2. Check balance sufficiency
        if (user.wallet_balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // 3. Create withdrawal order in JusPay
        const withdrawalOrderData = {
            order_id: 'WITHDRAW_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            amount: amount,
            currency: 'INR',
            customer_id: `customer_${userId}`,
            description: `Withdrawal to ${user.bank_name} - ${user.account_holder_name}`,
            metadata: {
                source: 'glo-coin-platform',
                type: 'WITHDRAWAL',
                bank_name: user.bank_name,
                account_holder: user.account_holder_name,
                bank_account: user.bank_account_number
            }
        };
        
        // 4. Create withdrawal order in JusPay dashboard
        jusPayService.createWithdrawalOrder(withdrawalOrderData);
        
        // 5. Update user balance and create transaction record
        db.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', 
            [amount, userId]);
        
        db.run('INSERT INTO withdrawal_transactions (user_id, amount, bank_account_number, bank_name, account_holder_name, transaction_status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [userId, amount, user.bank_account_number, user.bank_name, user.account_holder_name, 'completed', transactionId]);
        
        // 6. Return success response
        res.json({ success: true, message: 'Withdrawal successful' });
    });
});
```

**Flow**:
1. Validate user authentication and get user details
2. Check if user has sufficient wallet balance
3. Create withdrawal order data with bank details
4. Create withdrawal order in JusPay dashboard
5. Deduct amount from user's wallet balance
6. Create withdrawal transaction record
7. Return success response

### **5. Balance Management**

#### **GET /balance**
```javascript
app.get('/balance', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
        [userId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                success: true,
                balance: {
                    wallet_balance: user.wallet_balance || 0,
                    glo_coin_balance: user.glo_coin_balance || 0
                }
            });
        });
});
```

**Flow**:
1. Validate user authentication
2. Query database for current balances
3. Return wallet and Glo Coin balances

---

## 👤 **User Journey Detailed**

### **1. Initial Access**
```
User visits: https://4fc85aa9398b.ngrok-free.app/
↓
Server checks session (requireAuth middleware)
↓
No session found → Redirect to /login
↓
login.html served with demo credentials displayed
```

### **2. Login Process**
```
User enters: username="demouser", password="password"
↓
Frontend validates input and sends POST /login
↓
Server queries database for user
↓
bcrypt.compare(password, hashedPassword)
↓
Session created with userId and username
↓
Response: { success: true, redirectTo: '/glo-coin' }
↓
Frontend redirects to dashboard
```

### **3. Dashboard Loading**
```
User accesses: /glo-coin
↓
requireAuth middleware validates session
↓
glo-coin.html served
↓
JavaScript loads and fetches /balance
↓
Balance displayed: Wallet Balance & Glo Coin Balance
```

### **4. Adding Money via JusPay**
```
User enters amount and clicks "Pay with JusPay"
↓
Frontend sends POST /payment/create-order
↓
JusPayService.generateOrderData() creates order
↓
JusPayService.createPaymentSession() creates JusPay order
↓
Order stored in database with status "PENDING"
↓
Payment modal displayed with order details
↓
User clicks "Simulate Success"
↓
Frontend sends POST /payment/complete
↓
JusPayService.processPayment() processes payment
↓
Database updated: order status → "CHARGED"
↓
User wallet balance increased
↓
Frontend displays success message
```

### **5. Converting Between Currencies**
```
User clicks "Convert to Glo Coin"
↓
Frontend prompts for amount
↓
POST /convert-to-glo with amount
↓
Server validates wallet balance >= amount
↓
Database transaction:
  - wallet_balance -= amount
  - glo_coin_balance += amount
↓
Updated balances returned to frontend
```

### **6. Withdrawal Process**
```
User enters withdrawal amount
↓
Frontend sends POST /withdraw
↓
Server validates wallet balance >= amount
↓
Server gets user's bank details
↓
JusPayService.createWithdrawalOrder() creates withdrawal order
↓
Database updates:
  - wallet_balance -= amount
  - withdrawal_transactions record created
↓
JusPay dashboard shows withdrawal order
↓
Success response to frontend
```

### **7. Viewing Order History**
```
User clicks "View Orders"
↓
Frontend sends GET /payment/orders
↓
Server queries orders table for user's transactions
↓
Orders returned with details:
  - Order ID
  - Amount
  - Status
  - Timestamp
  - Transaction ID
↓
Modal displays order history
```

---

## 🔗 **Database Schema**

### **users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    wallet_balance REAL DEFAULT 0,
    glo_coin_balance REAL DEFAULT 0,
    bank_account_number TEXT,
    bank_name TEXT,
    account_holder_name TEXT,
    total_withdrawn REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **orders Table**
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id TEXT UNIQUE NOT NULL,
    session_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'PENDING',
    customer_id TEXT,
    transaction_id TEXT,
    gateway_reference_id TEXT,
    juspay_response TEXT,
    transaction_type TEXT DEFAULT 'PAYMENT',
    bank_account TEXT,
    bank_name TEXT,
    account_holder TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### **withdrawal_transactions Table**
```sql
CREATE TABLE withdrawal_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    transaction_status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

---

## 🔐 **Security Implementation**

### **Password Security**
```javascript
// Password hashing during user creation
const hashedPassword = await bcrypt.hash(password, 10);

// Password verification during login
const isValid = await bcrypt.compare(password, user.password);
```

### **Session Management**
```javascript
// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
```

### **Authentication Middleware**
```javascript
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next(); // User is authenticated
    } else {
        res.redirect('/login'); // Redirect to login
    }
}
```

### **Input Validation**
```javascript
// Amount validation
if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
}

// Balance validation
if (user.wallet_balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
}
```

---

## 🎯 **Integration Points**

### **JusPay API Integration**
```javascript
// Order creation
const response = await this.api.post('/orders', new URLSearchParams({
    order_id: orderData.order_id,
    amount: orderData.amount,
    currency: orderData.currency,
    customer_id: orderData.customer_id,
    customer_email: orderData.customer_email,
    customer_phone: orderData.customer_phone,
    description: orderData.description,
    merchant_id: this.merchantId,
    return_url: orderData.return_url
}));
```

### **Webhook Handling**
```javascript
app.post('/api/payment/callback', (req, res) => {
    const webhookPayload = req.body;
    
    // Log webhook data
    console.log('=== JusPay Webhook Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(webhookPayload, null, 2));
    
    // Process webhook data
    // Update order status if needed
    
    res.status(200).json({ success: true });
});
```

### **Database Transactions**
```javascript
// Atomic operations for balance updates
db.run('BEGIN TRANSACTION');
try {
    db.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [amount, userId]);
    db.run('UPDATE users SET glo_coin_balance = glo_coin_balance + ? WHERE id = ?', [amount, userId]);
    db.run('COMMIT');
} catch (error) {
    db.run('ROLLBACK');
    throw error;
}
```

---

## 📈 **Performance Considerations**

### **Database Optimization**
- Indexed columns for faster queries
- Prepared statements to prevent SQL injection
- Connection pooling for concurrent requests

### **Session Storage**
- In-memory session storage for development
- Consider Redis for production scaling

### **API Rate Limiting**
- Implement rate limiting for API endpoints
- Throttle payment creation requests

### **Error Handling**
- Comprehensive error logging
- Graceful degradation for API failures
- User-friendly error messages

---

## 🔧 **Development Tools**

### **Environment Configuration**
```javascript
// .env file structure
JUSPAY_MERCHANT_ID=blowtrumpet
JUSPAY_API_KEY=517265F5745469FBC27DD85D0EF308
JUSPAY_BASE_URL=https://sandbox.juspay.in
ENABLE_DASHBOARD_TRACKING=true
WEBHOOK_URL=https://4fc85aa9398b.ngrok-free.app/api/payment/callback
```

### **Debugging**
```javascript
// Console logging for development
console.log('JusPay order created:', response.data);
console.log('User balance updated:', newBalance);
console.log('Webhook received:', webhookPayload);
```

### **Testing**
- Manual testing through web interface
- API testing with Postman/curl
- JusPay sandbox environment for safe testing

---

*This technical documentation provides a comprehensive overview of the system architecture, code functionality, and user journey flows. Each component is designed to work together to create a complete payment platform with JusPay integration.*
