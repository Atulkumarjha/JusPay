const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const PaymentGatewayManager = require('./services/PaymentGatewayManager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Payment Gateway Manager
const paymentManager = new PaymentGatewayManager();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'glocoin_super_secret_key_2025_juspay_integration',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true for HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database initialization
let db;

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database('./users.db', (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                createTables()
                    .then(createDefaultUsers)
                    .then(() => resolve())
                    .catch(reject);
            }
        });
    });
}

function createTables() {
    return new Promise((resolve, reject) => {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password TEXT NOT NULL,
                wallet_balance REAL DEFAULT 0.0,
                glo_coin_balance REAL DEFAULT 0.0,
                bank_account_number TEXT,
                bank_name TEXT,
                bank_routing_number TEXT,
                account_holder_name TEXT,
                total_withdrawn REAL DEFAULT 0.0,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createOrdersTable = `
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                order_id TEXT UNIQUE NOT NULL,
                session_id TEXT,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'INR',
                status TEXT DEFAULT 'PENDING',
                payment_method TEXT,
                transaction_id TEXT,
                gateway_reference_id TEXT,
                juspay_response TEXT,
                transaction_type TEXT DEFAULT 'PAYMENT',
                bank_account TEXT,
                bank_name TEXT,
                account_holder TEXT,
                customer_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

        const createWithdrawalTable = `
            CREATE TABLE IF NOT EXISTS withdrawal_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                bank_account_number TEXT NOT NULL,
                bank_name TEXT NOT NULL,
                account_holder_name TEXT NOT NULL,
                transaction_status TEXT DEFAULT 'pending',
                transaction_id TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

        db.run(createUsersTable, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
                reject(err);
                return;
            }
            
            db.run(createOrdersTable, (err) => {
                if (err) {
                    console.error('Error creating orders table:', err.message);
                    reject(err);
                    return;
                }
                
                db.run(createWithdrawalTable, (err) => {
                    if (err) {
                        console.error('Error creating withdrawal table:', err.message);
                        reject(err);
                        return;
                    }
                    
                    console.log('All database tables created successfully');
                    resolve();
                });
            });
        });
    });
}

async function createDefaultUsers() {
    const defaultUsers = [
        {
            username: 'admin',
            email: 'admin@glocoin.com',
            password: 'admin123',
            role: 'superadmin',
            wallet_balance: 1000000,
            glo_coin_balance: 50000
        },
        {
            username: 'demo',
            email: 'demo@glocoin.com',
            password: 'demo123',
            role: 'user',
            wallet_balance: 10000,
            glo_coin_balance: 5000
        },
        {
            username: 'superadmin',
            email: 'superadmin@glocoin.com',
            password: 'SuperAdmin@2025!',
            role: 'superadmin',
            wallet_balance: 1000000,
            glo_coin_balance: 50000
        }
    ];

    for (const user of defaultUsers) {
        try {
            await createUserIfNotExists(user);
        } catch (error) {
            console.error(`Error creating user ${user.username}:`, error.message);
        }
    }
}

function createUserIfNotExists(userData) {
    return new Promise((resolve, reject) => {
        db.get('SELECT username FROM users WHERE username = ?', [userData.username], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!row) {
                bcrypt.hash(userData.password, 10, (err, hashedPassword) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    db.run(
                        'INSERT INTO users (username, email, password, role, wallet_balance, glo_coin_balance) VALUES (?, ?, ?, ?, ?, ?)',
                        [userData.username, userData.email, hashedPassword, userData.role, userData.wallet_balance, userData.glo_coin_balance],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                console.log(`✅ User ${userData.username} created successfully`);
                                resolve();
                            }
                        }
                    );
                });
            } else {
                console.log(`User ${userData.username} already exists`);
                resolve();
            }
        });
    });
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

function requireSuperAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ error: 'Super admin access required' });
    }
}

// Routes
app.get('/', (req, res) => {
    if (req.session.user) {
        // Redirect based on user role
        if (req.session.user.role === 'superadmin' || req.session.user.role === 'admin') {
            res.redirect('/admin-enhanced');
        } else {
            res.redirect('/dashboard-enhanced');
        }
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        // Already logged in, redirect to appropriate dashboard
        if (req.session.user.role === 'superadmin' || req.session.user.role === 'admin') {
            res.redirect('/admin-enhanced');
        } else {
            res.redirect('/dashboard-enhanced');
        }
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Enhanced dashboard routes
app.get('/dashboard-enhanced', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-enhanced.html'));
});

app.get('/admin-enhanced', requireAuth, (req, res) => {
    if (req.session.user.role === 'superadmin' || req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin-enhanced.html'));
    } else {
        res.redirect('/dashboard-enhanced');
    }
});

app.get('/glo-coin-enhanced', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'glo-coin-enhanced.html'));
});

// Legacy route redirects
app.get('/dashboard', requireAuth, (req, res) => {
    res.redirect('/dashboard-enhanced');
});

app.get('/glo-coin', requireAuth, (req, res) => {
    res.redirect('/glo-coin-enhanced');
});

app.get('/admin', requireAuth, (req, res) => {
    if (req.session.user.role === 'superadmin' || req.session.user.role === 'admin') {
        res.redirect('/admin-enhanced');
    } else {
        res.redirect('/dashboard-enhanced');
    }
});

// Authentication endpoints
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        const user = await getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'user'
        };
        
        console.log(`✅ Login successful for user: ${username} (role: ${user.role})`);
        
        // Check if request wants JSON response or redirect
        const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
        
        if (acceptsJson) {
            // Return user data for frontend handling
            res.json({ 
                success: true, 
                message: 'Login successful', 
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role || 'user',
                    wallet_balance: user.wallet_balance || 0,
                    glo_coin_balance: user.glo_coin_balance || 0
                },
                redirect_url: (user.role === 'superadmin' || user.role === 'admin') 
                    ? '/admin-enhanced' 
                    : '/dashboard-enhanced'
            });
        } else {
            // Direct redirect for form submissions
            if (user.role === 'superadmin' || user.role === 'admin') {
                res.redirect('/admin-enhanced');
            } else {
                res.redirect('/dashboard-enhanced');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    if (!username || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    try {
        const existingUser = await getUserByUsername(username);
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await createUser({
            username,
            email,
            password: hashedPassword,
            role: 'user',
            wallet_balance: 0,
            glo_coin_balance: 0
        });
        
        console.log(`✅ New user registered: ${username}`);
        res.json({ success: true, message: 'User registered successfully' });
        
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/logout', (req, res) => {
    const username = req.session.user ? req.session.user.username : 'Unknown';
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err.message);
            return res.status(500).json({ error: 'Could not log out' });
        }
        
        console.log(`👋 User logged out: ${username}`);
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// User data endpoints
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const user = await getUserById(req.session.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                wallet_balance: user.wallet_balance || 0,
                glo_coin_balance: user.glo_coin_balance || 0,
                total_withdrawn: user.total_withdrawn || 0
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user', requireAuth, async (req, res) => {
    try {
        const user = await getUserById(req.session.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            wallet_balance: user.wallet_balance || 0,
            glo_coin_balance: user.glo_coin_balance || 0,
            bank_account_number: user.bank_account_number,
            bank_name: user.bank_name,
            bank_routing_number: user.bank_routing_number,
            account_holder_name: user.account_holder_name,
            total_withdrawn: user.total_withdrawn || 0
        });
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Payment order creation
app.post('/create-order', requireAuth, async (req, res) => {
    const { amount, customerName, customerPhone, description, gateway } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    const userId = req.session.user.id;

    try {
        const selectedGateway = gateway || paymentManager.getActiveGatewayName();
        
        const orderData = {
            order_id: generateOrderId(selectedGateway),
            amount: parseFloat(amount),
            currency: 'INR',
            customer_id: `cust_${userId}_${Date.now()}`,
            customer_name: customerName || 'Customer',
            customer_phone: customerPhone || '9999999999',
            description: description || 'Payment via GloCoin Platform'
        };
        
        console.log(`🚀 Creating ${selectedGateway.toUpperCase()} order:`, orderData.order_id);
        
        const paymentSession = await paymentManager.createPaymentSession(orderData);
        
        await createOrder({
            user_id: userId,
            order_id: orderData.order_id,
            session_id: paymentSession.session_id || 'session_' + Date.now(),
            amount: orderData.amount,
            currency: orderData.currency,
            status: 'CREATED',
            customer_id: orderData.customer_id,
            juspay_response: JSON.stringify({...paymentSession, gateway: selectedGateway}),
            transaction_type: 'PAYMENT'
        });
        
        console.log(`✅ ${selectedGateway.toUpperCase()} order created successfully`);
        
        res.json({
            success: true,
            gateway: selectedGateway,
            gateway_name: selectedGateway === 'cashfree' ? 'Cashfree Payments' : 'JusPay Payments',
            order_id: orderData.order_id,
            amount: orderData.amount,
            currency: orderData.currency,
            payment_url: paymentSession.payment_page_url || paymentSession.web || '#',
            message: `${selectedGateway.toUpperCase()} order created successfully`
        });
    } catch (error) {
        console.error('Payment creation error:', error.message);
        res.status(500).json({ error: 'Failed to create payment order', details: error.message });
    }
});

// Get orders with enhanced gateway information
app.get('/orders', requireAuth, async (req, res) => {
    try {
        const orders = await getOrdersByUserId(req.session.user.id);
        
        const enhancedOrders = orders.map(order => ({
            ...order,
            gateway_info: getGatewayInfo(order.order_id),
            gateway: getGatewayFromOrderId(order.order_id)
        }));
        
        res.json(enhancedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Legacy payment routes
app.post('/payment/create-order', requireAuth, async (req, res) => {
    // Redirect to new endpoint
    req.url = '/create-order';
    app._router.handle(req, res);
});

app.get('/payment/orders', requireAuth, async (req, res) => {
    // Redirect to new endpoint
    req.url = '/orders';
    app._router.handle(req, res);
});

// Wallet management endpoints
app.post('/wallet/add', requireAuth, async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    try {
        await updateUserBalance(req.session.user.id, 'wallet_balance', amount);
        const updatedUser = await getUserById(req.session.user.id);
        
        res.json({ 
            success: true, 
            message: `Added $${amount} to wallet`,
            wallet_balance: updatedUser.wallet_balance,
            glo_coin_balance: updatedUser.glo_coin_balance
        });
    } catch (error) {
        console.error('Wallet add error:', error.message);
        res.status(500).json({ error: 'Failed to add money to wallet' });
    }
});

// Admin routes
app.get('/admin/gateway-status', requireSuperAdmin, async (req, res) => {
    try {
        const gatewayInfo = paymentManager.getAvailableGateways();
        const healthCheck = await paymentManager.healthCheck();
        
        res.json({
            success: true,
            active_gateway: gatewayInfo.current,
            gateways: gatewayInfo.available,
            health: healthCheck
        });
    } catch (error) {
        console.error('Error getting gateway status:', error.message);
        res.status(500).json({ error: 'Failed to get gateway status' });
    }
});

// Switch payment gateway
app.post('/api/admin/switch-gateway', requireSuperAdmin, (req, res) => {
    try {
        const { gateway } = req.body;
        
        if (!gateway) {
            return res.status(400).json({ error: 'Gateway name is required' });
        }
        
        const result = paymentManager.switchGateway(gateway);
        
        // Log the gateway switch
        console.log(`🔄 Payment gateway switched by ${req.session.user.username} from ${result.previous} to ${result.current}`);
        
        res.json({
            success: true,
            message: `Payment gateway switched to ${gateway}`,
            previous: result.previous,
            current: result.current,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Error switching gateway:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// Legacy endpoint for backward compatibility
app.post('/admin/switch-gateway', requireSuperAdmin, (req, res) => {
    // Redirect to new API endpoint
    req.url = '/api/admin/switch-gateway';
    app._router.handle(req, res);
});

// Get payment gateway status (API endpoint)
app.get('/api/admin/payment-gateways', requireSuperAdmin, async (req, res) => {
    try {
        const gatewayInfo = paymentManager.getAvailableGateways();
        const healthCheck = await paymentManager.healthCheck();
        
        res.json({
            success: true,
            current_gateway: gatewayInfo.current,
            gateways: gatewayInfo.available,
            health: healthCheck
        });
    } catch (error) {
        console.error('Error getting gateway status:', error.message);
        res.status(500).json({ error: 'Failed to get gateway status' });
    }
});

// Get gateway configuration for frontend
app.get('/api/admin/gateway-config', requireSuperAdmin, (req, res) => {
    try {
        const config = paymentManager.getGatewayConfig();
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('Error getting gateway config:', error.message);
        res.status(500).json({ error: 'Failed to get gateway configuration' });
    }
});

// Get all users (super admin only)
app.get('/api/admin/users', requireSuperAdmin, (req, res) => {
    db.all('SELECT id, username, email, role, wallet_balance, glo_coin_balance, total_withdrawn, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
            success: true,
            users: users
        });
    });
});

// Get all orders with gateway information (super admin only)
app.get('/api/admin/orders', requireSuperAdmin, (req, res) => {
    db.all(`SELECT o.*, u.username 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 100`, (err, orders) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Add gateway information to orders
        const ordersWithGateway = orders.map(order => {
            let gateway = 'unknown';
            if (order.order_id.startsWith('JUSPAY_')) {
                gateway = 'juspay';
            } else if (order.order_id.startsWith('CF_')) {
                gateway = 'cashfree';
            }
            
            return {
                ...order,
                gateway: gateway,
                gateway_display: gateway.charAt(0).toUpperCase() + gateway.slice(1),
                gateway_info: getGatewayInfo(order.order_id)
            };
        });
        
        res.json({
            success: true,
            orders: ordersWithGateway
        });
    });
});

// Get platform analytics (super admin only)
app.get('/admin/analytics', requireSuperAdmin, (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total_users FROM users WHERE role != "superadmin"',
        'SELECT COUNT(*) as total_orders FROM orders',
        'SELECT SUM(amount) as total_revenue FROM orders WHERE status IN ("SUCCESS", "CHARGED")',
        'SELECT COUNT(*) as successful_orders FROM orders WHERE status IN ("SUCCESS", "CHARGED")',
        'SELECT COUNT(*) as pending_orders FROM orders WHERE status IN ("CREATED", "PENDING")',
        'SELECT COUNT(*) as failed_orders FROM orders WHERE status IN ("AUTHORIZATION_FAILED", "FAILED")',
        'SELECT COUNT(*) as juspay_orders FROM orders WHERE order_id LIKE "JUSPAY_%"',
        'SELECT COUNT(*) as cashfree_orders FROM orders WHERE order_id LIKE "CF_%"',
        'SELECT COUNT(*) as glocoin_orders FROM orders WHERE order_id LIKE "GLOCOIN_%"'
    ];
    
    Promise.all(queries.map(query => new Promise((resolve, reject) => {
        db.get(query, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    }))).then(results => {
        const totalOrders = results[1].total_orders || 0;
        const successfulOrders = results[3].successful_orders || 0;
        const successRate = totalOrders > 0 ? (successfulOrders / totalOrders * 100).toFixed(1) : 0;
        
        res.json({
            success: true,
            total_users: results[0].total_users || 0,
            total_orders: totalOrders,
            total_revenue: (results[2].total_revenue || 0),
            successful_orders: successfulOrders,
            pending_orders: results[4].pending_orders || 0,
            failed_orders: results[5].failed_orders || 0,
            success_rate: parseFloat(successRate),
            active_users: results[0].total_users || 0,
            gateway_breakdown: {
                juspay: results[6].juspay_orders || 0,
                cashfree: results[7].cashfree_orders || 0,
                glocoin: results[8].glocoin_orders || 0
            },
            current_gateway: paymentManager.getActiveGatewayName()
        });
    }).catch(error => {
        console.error('Error getting analytics:', error.message);
        res.status(500).json({ error: 'Failed to get platform analytics' });
    });
});

// Utility functions
function generateOrderId(gateway) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    switch (gateway) {
        case 'juspay':
            return `JUSPAY_${timestamp}_${random}`;
        case 'cashfree':
            return `CF_${timestamp}_${random}`;
        default:
            return `ORDER_${timestamp}_${random}`;
    }
}

function getGatewayInfo(orderId) {
    if (orderId.startsWith('JUSPAY_')) {
        return {
            gateway: 'juspay',
            display_name: 'JusPay Payments',
            color: '#667eea',
            icon: '💳',
            description: 'Secure payment processing via JusPay',
            environment: 'Sandbox',
            provider: 'JusPay Technologies'
        };
    } else if (orderId.startsWith('CF_')) {
        return {
            gateway: 'cashfree',
            display_name: 'Cashfree Payments',
            color: '#00D4AA',
            icon: '💰',
            description: 'Fast & reliable payments via Cashfree',
            environment: 'Mock Mode',
            provider: 'Cashfree Payments'
        };
    } else {
        return {
            gateway: 'unknown',
            display_name: 'Unknown Gateway',
            color: '#9CA3AF',
            icon: '❓',
            description: 'Gateway information not available',
            environment: 'Unknown',
            provider: 'Unknown'
        };
    }
}

function getGatewayFromOrderId(orderId) {
    if (orderId.startsWith('JUSPAY_')) return 'juspay';
    if (orderId.startsWith('CF_')) return 'cashfree';
    return 'unknown';
}

// Database helper functions
function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
            if (err) reject(err);
            else resolve(user);
        });
    });
}

function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
            if (err) reject(err);
            else resolve(user);
        });
    });
}

function createUser(userData) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO users (username, email, password, role, wallet_balance, glo_coin_balance) VALUES (?, ?, ?, ?, ?, ?)',
            [userData.username, userData.email, userData.password, userData.role, userData.wallet_balance, userData.glo_coin_balance],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function createOrder(orderData) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO orders (user_id, order_id, session_id, amount, currency, status, customer_id, juspay_response, transaction_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderData.user_id, orderData.order_id, orderData.session_id, orderData.amount, orderData.currency, 
             orderData.status, orderData.customer_id, orderData.juspay_response, orderData.transaction_type],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function getOrdersByUserId(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId], (err, orders) => {
            if (err) reject(err);
            else resolve(orders || []);
        });
    });
}

function updateUserBalance(userId, balanceType, amount) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE users SET ${balanceType} = ${balanceType} + ? WHERE id = ?`, [amount, userId], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Initialize and start server
async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log('📊 Dashboard: http://localhost:3000/dashboard-enhanced');
            console.log('🔧 Admin Panel: http://localhost:3000/admin-enhanced');
            console.log('💰 Payment Gateway: http://localhost:3000/glo-coin-enhanced');
            console.log('\n🔐 Default Login Credentials:');
            console.log('   Admin: admin/admin123');
            console.log('   Demo User: demo/demo123');
            console.log('   Super Admin: superadmin/SuperAdmin@2025!');
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Start the server
startServer();
