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

// Initialize Payment Gateway Manager (handles both JusPay and Razorpay)
const paymentManager = new PaymentGatewayManager();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'glocoin_super_secret_key_2025_juspay_integration',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true for HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
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
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
                
                // Add new columns if they don't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0.0`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding wallet_balance column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN glo_coin_balance REAL DEFAULT 0.0`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding glo_coin_balance column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding role column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN bank_account_number TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding bank_account_number column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN bank_name TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding bank_name column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN bank_routing_number TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding bank_routing_number column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN account_holder_name TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding account_holder_name column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE users ADD COLUMN total_withdrawn REAL DEFAULT 0.0`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding total_withdrawn column:', err.message);
                    }
                });
                
                // Create super admin user if it doesn't exist
                const superAdminUsername = 'superadmin';
                const superAdminPassword = 'SuperAdmin@2025!';
                
                db.get('SELECT username FROM users WHERE username = ?', [superAdminUsername], (err, row) => {
                    if (err) {
                        console.error('Error checking super admin user:', err.message);
                    } else if (!row) {
                        // Super admin user doesn't exist, create it
                        bcrypt.hash(superAdminPassword, 10, (err, hashedPassword) => {
                            if (err) {
                                console.error('Error hashing super admin password:', err.message);
                            } else {
                                db.run('INSERT INTO users (username, email, password, role, wallet_balance, glo_coin_balance) VALUES (?, ?, ?, ?, ?, ?)', 
                                    [superAdminUsername, 'superadmin@glocoin.com', hashedPassword, 'superadmin', 1000000, 50000], 
                                    (err) => {
                                        if (err) {
                                            console.error('Error creating super admin user:', err.message);
                                        } else {
                                            console.log('🔐 Super Admin user created successfully');
                                            console.log('📧 Username: superadmin');
                                            console.log('🔑 Password: SuperAdmin@2025!');
                                            console.log('⚠️  Please change the password after first login');
                                        }
                                    });
                            }
                        });
                    } else {
                        console.log('Super admin user already exists');
                    }
                });
                
                // Insert demo user if it doesn't exist
                const demoUsername = 'demouser';
                const demoPassword = 'password';
                
                db.get('SELECT username FROM users WHERE username = ?', [demoUsername], (err, row) => {
                    if (err) {
                        console.error('Error checking demo user:', err.message);
                    } else if (!row) {
                        // Demo user doesn't exist, create it
                        bcrypt.hash(demoPassword, 10, (err, hashedPassword) => {
                            if (err) {
                                console.error('Error hashing demo password:', err.message);
                            } else {
                                db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                                    [demoUsername, 'demo@example.com', hashedPassword], 
                                    (err) => {
                                        if (err) {
                                            console.error('Error creating demo user:', err.message);
                                        } else {
                                            console.log('Demo user created successfully');
                                        }
                                    });
                            }
                        });
                    } else {
                        console.log('Demo user already exists');
                            }
                        });
                    }
                });
            }
        });
        
        // Create withdrawal transactions table
        db.run(`CREATE TABLE IF NOT EXISTS withdrawal_transactions (
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
        )`, (err) => {
            if (err) {
                console.error('Error creating withdrawal_transactions table:', err.message);
            } else {
                console.log('Withdrawal transactions table ready');
            }
        });
        
        // Create orders table for JusPay integration
        db.run(`CREATE TABLE IF NOT EXISTS orders (
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
        )`, (err) => {
            if (err) {
                console.error('Error creating orders table:', err.message);
            } else {
                console.log('Orders table ready');
                
                // Add new columns for withdrawal tracking if they don't exist
                db.run(`ALTER TABLE orders ADD COLUMN transaction_type TEXT DEFAULT 'PAYMENT'`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding transaction_type column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE orders ADD COLUMN bank_account TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding bank_account column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE orders ADD COLUMN bank_name TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding bank_name column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE orders ADD COLUMN account_holder TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding account_holder column:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE orders ADD COLUMN customer_id TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('Error adding customer_id column:', err.message);
                    }
                });
            }
        });

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Super admin middleware
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
        res.sendFile(path.join(__dirname, 'public', 'glo-coin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/glo-coin', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'glo-coin.html'));
    } else {
        res.redirect('/login');
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Password comparison error:', err.message);
                return res.status(500).json({ error: 'Server error' });
            }
            
            if (isMatch) {
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role || 'user'
                };
                
                const redirectTo = user.role === 'superadmin' ? '/admin' : '/glo-coin';
                res.json({ success: true, message: 'Login successful', redirectTo: redirectTo });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        });
    });
});

// Register endpoint
app.post('/register', (req, res) => {
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
    
    // Check if username already exists
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (user) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Hash password and create user
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Password hashing error:', err.message);
                return res.status(500).json({ error: 'Server error' });
            }
            
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                [username, email, hashedPassword], 
                function(err) {
                    if (err) {
                        console.error('Database insertion error:', err.message);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    console.log('New user created with ID:', this.lastID);
                    res.json({ success: true, message: 'User registered successfully' });
                });
        });
    });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err.message);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Get user info endpoint
app.get('/user', (req, res) => {
    if (req.session.user) {
        // Get updated user info including wallet balances and bank details
        db.get('SELECT id, username, email, wallet_balance, glo_coin_balance, bank_account_number, bank_name, bank_routing_number, account_holder_name, total_withdrawn FROM users WHERE id = ?', 
            [req.session.user.id], (err, user) => {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                if (user) {
                    res.json(user);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Test endpoint to check session
app.get('/session-test', (req, res) => {
    res.json({
        hasSession: !!req.session.user,
        sessionUser: req.session.user || null,
        sessionId: req.sessionID
    });
});

// Add money to wallet endpoint
app.post('/wallet/add', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const userId = req.session.user.id;
    
    db.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', 
        [amount, userId], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Get updated balance
            db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
                [userId], (err, user) => {
                    if (err) {
                        console.error('Database error:', err.message);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: `Added $${amount} to wallet`,
                        wallet_balance: user.wallet_balance,
                        glo_coin_balance: user.glo_coin_balance
                    });
                });
        });
});

// Convert money to Glo Coin endpoint
app.post('/wallet/convert-to-glo', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const userId = req.session.user.id;
    
    // Check if user has sufficient wallet balance
    db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
        [userId], (err, user) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (user.wallet_balance < amount) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            
            // Convert $1 = 1 Glo Coin (1:1 ratio)
            const gloCoinsToAdd = amount;
            
            db.run('UPDATE users SET wallet_balance = wallet_balance - ?, glo_coin_balance = glo_coin_balance + ? WHERE id = ?', 
                [amount, gloCoinsToAdd, userId], function(err) {
                    if (err) {
                        console.error('Database error:', err.message);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    // Get updated balances
                    db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
                        [userId], (err, updatedUser) => {
                            if (err) {
                                console.error('Database error:', err.message);
                                return res.status(500).json({ error: 'Database error' });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: `Converted $${amount} to ${gloCoinsToAdd} Glo Coins`,
                                wallet_balance: updatedUser.wallet_balance,
                                glo_coin_balance: updatedUser.glo_coin_balance
                            });
                        });
                });
        });
});

// Convert Glo Coin to money endpoint
app.post('/wallet/convert-to-money', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const userId = req.session.user.id;
    
    // Check if user has sufficient Glo Coin balance
    db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
        [userId], (err, user) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (user.glo_coin_balance < amount) {
                return res.status(400).json({ error: 'Insufficient Glo Coin balance' });
            }
            
            // Convert 1 Glo Coin = $1 (1:1 ratio)
            const moneyToAdd = amount;
            
            db.run('UPDATE users SET wallet_balance = wallet_balance + ?, glo_coin_balance = glo_coin_balance - ? WHERE id = ?', 
                [moneyToAdd, amount, userId], function(err) {
                    if (err) {
                        console.error('Database error:', err.message);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    // Get updated balances
                    db.get('SELECT wallet_balance, glo_coin_balance FROM users WHERE id = ?', 
                        [userId], (err, updatedUser) => {
                            if (err) {
                                console.error('Database error:', err.message);
                                return res.status(500).json({ error: 'Database error' });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: `Converted ${amount} Glo Coins to $${moneyToAdd}`,
                                wallet_balance: updatedUser.wallet_balance,
                                glo_coin_balance: updatedUser.glo_coin_balance
                            });
                        });
                });
        });
});

// Update bank account details endpoint
app.post('/bank/update', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { bank_account_number, bank_name, bank_routing_number, account_holder_name } = req.body;
    
    if (!bank_account_number || !bank_name || !bank_routing_number || !account_holder_name) {
        return res.status(400).json({ error: 'All bank account fields are required' });
    }
    
    const userId = req.session.user.id;
    
    db.run('UPDATE users SET bank_account_number = ?, bank_name = ?, bank_routing_number = ?, account_holder_name = ? WHERE id = ?', 
        [bank_account_number, bank_name, bank_routing_number, account_holder_name, userId], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
                success: true, 
                message: 'Bank account details updated successfully' 
            });
        });
});

// Withdraw money endpoint
app.post('/wallet/withdraw', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const userId = req.session.user.id;
    
    // Check if user has sufficient wallet balance and bank account details
    db.get('SELECT wallet_balance, glo_coin_balance, bank_account_number, bank_name, bank_routing_number, account_holder_name, total_withdrawn FROM users WHERE id = ?', 
        [userId], (err, user) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user.bank_account_number || !user.bank_name || !user.account_holder_name) {
                return res.status(400).json({ error: 'Please add your bank account details first' });
            }
            
            if (user.wallet_balance < amount) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            
            // Generate transaction ID
            const transactionId = 'WTX' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            // Begin transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Update wallet balance and total withdrawn
                db.run('UPDATE users SET wallet_balance = wallet_balance - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?', 
                    [amount, amount, userId], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            console.error('Database error:', err.message);
                            return res.status(500).json({ error: 'Database error' });
                        }
                        
                        // Insert withdrawal transaction record
                        db.run('INSERT INTO withdrawal_transactions (user_id, amount, bank_account_number, bank_name, account_holder_name, transaction_status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                            [userId, amount, user.bank_account_number, user.bank_name, user.account_holder_name, 'completed', transactionId], function(err) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    console.error('Database error:', err.message);
                                    return res.status(500).json({ error: 'Database error' });
                                }
                                
                                // Create JusPay withdrawal order for dashboard tracking
                                const withdrawalOrderData = {
                                    order_id: 'WITHDRAW_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                    user_id: userId,
                                    amount: amount,
                                    currency: 'INR',
                                    customer_id: `customer_${userId}`,
                                    customer_email: `user_${userId}@example.com`,
                                    customer_phone: '+919999999999',
                                    description: `Withdrawal to ${user.bank_name} - ${user.account_holder_name}`,
                                    return_url: `${process.env.WEBHOOK_URL}/withdrawal/success`,
                                    metadata: {
                                        source: 'glo-coin-platform',
                                        type: 'WITHDRAWAL',
                                        bank_name: user.bank_name,
                                        account_holder: user.account_holder_name,
                                        bank_account: user.bank_account_number
                                    }
                                };
                                
                                // Create withdrawal order in JusPay dashboard
                                jusPayService.createWithdrawalOrder(withdrawalOrderData).then(jusPayResult => {
                                    console.log('JusPay withdrawal order created successfully:', jusPayResult);
                                }).catch(error => {
                                    console.error('JusPay withdrawal order creation failed:', error.message);
                                    // Continue with withdrawal completion even if JusPay tracking fails
                                });
                                
                                // Insert JusPay withdrawal order in local database
                                db.run('INSERT INTO orders (order_id, user_id, amount, currency, customer_id, status, transaction_type, bank_account, bank_name, account_holder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                                    [withdrawalOrderData.order_id, withdrawalOrderData.user_id, withdrawalOrderData.amount, withdrawalOrderData.currency, withdrawalOrderData.customer_id, 'WITHDRAWAL_INITIATED', 'WITHDRAWAL', withdrawalOrderData.metadata.bank_account, withdrawalOrderData.metadata.bank_name, withdrawalOrderData.metadata.account_holder], function(err) {
                                        if (err) {
                                            console.error('JusPay withdrawal order creation failed:', err.message);
                                            // Continue with withdrawal completion even if JusPay tracking fails
                                        } else {
                                            console.log('JusPay withdrawal order created:', withdrawalOrderData.order_id);
                                        }
                                        
                                        db.run('COMMIT');
                                        
                                        // Get updated balances
                                        db.get('SELECT wallet_balance, glo_coin_balance, total_withdrawn FROM users WHERE id = ?', 
                                            [userId], (err, updatedUser) => {
                                                if (err) {
                                                    console.error('Database error:', err.message);
                                                    return res.status(500).json({ error: 'Database error' });
                                                }
                                                
                                                res.json({ 
                                                    success: true, 
                                                    message: `Successfully withdrew $${amount} to ${user.bank_name} account`,
                                                    transaction_id: transactionId,
                                                    juspay_order_id: withdrawalOrderData.order_id,
                                                    wallet_balance: updatedUser.wallet_balance,
                                                    glo_coin_balance: updatedUser.glo_coin_balance,
                                                    total_withdrawn: updatedUser.total_withdrawn
                                                });
                                            });
                                    });
                            });
                    });
            });
        });
});

// Get withdrawal history endpoint
app.get('/wallet/withdrawals', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;
    
    db.all('SELECT * FROM withdrawal_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', 
        [userId], (err, transactions) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
                success: true, 
                transactions: transactions || []
            });
        });
});

// JusPay Integration Endpoints

// Create payment order
app.post('/payment/create-order', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { amount, currency = 'INR' } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    const userId = req.session.user.id;

    try {
        // Generate order data using the payment manager
        const orderData = paymentManager.generateOrderData(amount, currency);
        
        // Create payment session with the active gateway (JusPay or Razorpay)
        const paymentSession = await paymentManager.createPaymentSession(orderData);
        
        // Store order in database
        db.run(`INSERT INTO orders (user_id, order_id, session_id, amount, currency, status, customer_id, juspay_response) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [userId, orderData.order_id, paymentSession.session_id, amount, currency, 'PENDING', orderData.customer_id, JSON.stringify(paymentSession)], 
            function(err) {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                console.log('Order created with gateway:', paymentSession.gateway, 'Order ID:', orderData.order_id);
                res.json({
                    success: true,
                    gateway: paymentSession.gateway,
                    gateway_name: paymentSession.gateway_display_name,
                    order: {
                        order_id: orderData.order_id,
                        session_id: paymentSession.session_id,
                        amount: amount,
                        currency: currency
                    },
                    payment_page_url: paymentSession.payment_page_url,
                    sdk_payload: paymentSession.sdk_payload
                });
            });
    } catch (error) {
        console.error('Payment creation error:', error.message);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Process payment completion
app.post('/payment/complete', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { order_id, status, gateway } = req.body;
    const success = status === 'success';
    
    if (!order_id) {
        return res.status(400).json({ error: 'Order ID is required' });
    }

    try {
        // Get order from database
        db.get('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', 
            [order_id, req.session.user.id], async (err, order) => {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                // Process payment using the active gateway
                const paymentData = {
                    status: status,
                    amount: order.amount,
                    gateway: gateway || paymentManager.getActiveGatewayName()
                };
                
                const paymentResult = await paymentManager.processPayment(order_id, paymentData);
                
                // Update order status
                const newStatus = success ? 'SUCCESS' : 'FAILED';
                
                // Update order status in local database
                db.run(`UPDATE orders SET status = ?, transaction_id = ?, gateway_reference_id = ?, 
                        juspay_response = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`, 
                    [newStatus, paymentResult.transaction_id, paymentResult.gateway_reference_id, 
                     JSON.stringify(paymentResult), order_id], (err) => {
                        if (err) {
                            console.error('Database error:', err.message);
                            return res.status(500).json({ error: 'Database error' });
                        }

                        if (success) {
                            // Add money to user's wallet on successful payment
                            db.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', 
                                [order.amount, req.session.user.id], (err) => {
                                    if (err) {
                                        console.error('Database error:', err.message);
                                        return res.status(500).json({ error: 'Database error' });
                                    }
                                    
                                    console.log(`Payment completed successfully via ${paymentResult.gateway}:`, order_id);
                                    res.json({
                                        success: true,
                                        message: `Payment of ₹${order.amount} completed successfully via ${paymentResult.gateway}`,
                                        order_id: order_id,
                                        transaction_id: paymentResult.transaction_id,
                                        amount: order.amount,
                                        status: newStatus,
                                        gateway: paymentResult.gateway
                                    });
                                });
                        } else {
                            console.log('Payment failed:', order_id);
                            res.json({
                                success: false,
                                message: `Payment of ₹${order.amount} failed`,
                                order_id: order_id,
                                status: newStatus
                            });
                        }
                    });
            });
    } catch (error) {
        console.error('Payment completion error:', error.message);
        res.status(500).json({ error: 'Failed to complete payment' });
    }
});

// Get payment status
app.get('/payment/status/:orderId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { orderId } = req.params;

    try {
        // Get order from database
        db.get('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', 
            [orderId, req.session.user.id], async (err, order) => {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                // Get latest status from JusPay (mock)
                const paymentStatus = await jusPayService.getPaymentStatus(orderId);
                
                res.json({
                    success: true,
                    order: {
                        order_id: order.order_id,
                        amount: order.amount,
                        currency: order.currency,
                        status: order.status,
                        created_at: order.created_at,
                        updated_at: order.updated_at,
                        transaction_id: order.transaction_id,
                        gateway_reference_id: order.gateway_reference_id
                    },
                    juspay_status: paymentStatus
                });
            });
    } catch (error) {
        console.error('Payment status error:', error.message);
        res.status(500).json({ error: 'Failed to get payment status' });
    }
});

// Get user's order history
app.get('/payment/orders', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', 
        [userId], (err, orders) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
                success: true, 
                orders: orders || []
            });
        });
});

// Mock JusPay webhook endpoint
app.post('/api/payment/callback', (req, res) => {
    console.log('=== JusPay Webhook Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('================================');
    
    try {
        // In production, you would validate the webhook signature here
        // const isValid = jusPayService.validateWebhookSignature(req.body, req.headers['x-juspay-signature']);
        
        const { 
            order_id, 
            status, 
            transaction_id, 
            amount, 
            currency,
            event_name,
            txn_id,
            merchant_id
        } = req.body;
        
        // Validate merchant ID if provided
        if (merchant_id && merchant_id !== process.env.JUSPAY_MERCHANT_ID) {
            console.error('Invalid merchant ID in webhook:', merchant_id);
            return res.status(400).json({ error: 'Invalid merchant ID' });
        }
        
        // Log the webhook event
        console.log(`Processing webhook event: ${event_name || 'status_update'}`);
        console.log(`Order ID: ${order_id}, Status: ${status}, Amount: ${amount}`);
        
        // Update order status based on webhook
        db.run(`UPDATE orders SET 
                status = ?, 
                transaction_id = ?, 
                txn_id = ?,
                webhook_data = ?,
                updated_at = CURRENT_TIMESTAMP 
                WHERE order_id = ?`, 
            [status, transaction_id || txn_id, txn_id || transaction_id, JSON.stringify(req.body), order_id], 
            function(err) {
                if (err) {
                    console.error('Webhook database error:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                console.log('Order updated via webhook:', order_id, 'Status:', status);
                
                // If payment successful, you can add logic to update user wallet/credits
                if (status === 'CHARGED' || status === 'charged' || status === 'SUCCESSFUL') {
                    console.log(`Payment successful for order ${order_id}, amount: ${amount}`);
                    // Add wallet credit logic here if needed
                }
                
                res.json({ 
                    success: true, 
                    message: 'Webhook processed successfully',
                    order_id: order_id,
                    status: status
                });
            });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/webhook-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook-test.html'));
});

// Additional webhook endpoint for different JusPay events
app.post('/webhook/juspay', (req, res) => {
    console.log('=== JusPay Event Webhook ===');
    console.log('Event received:', JSON.stringify(req.body, null, 2));
    console.log('============================');
    
    // This endpoint can handle different types of JusPay events
    // Forward to main webhook handler
    req.url = '/api/payment/callback';
    app.handle(req, res);
});

// Super Admin Routes
// ==================

// Admin dashboard route
app.get('/admin', requireSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get payment gateway status
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
            } else if (order.order_id.startsWith('RAZORPAY_')) {
                gateway = 'razorpay';
            }
            
            return {
                ...order,
                gateway: gateway,
                gateway_display: gateway.charAt(0).toUpperCase() + gateway.slice(1)
            };
        });
        
        res.json({
            success: true,
            orders: ordersWithGateway
        });
    });
});

// Get platform statistics (super admin only)
app.get('/api/admin/stats', requireSuperAdmin, (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total_users FROM users WHERE role != "superadmin"',
        'SELECT COUNT(*) as total_orders FROM orders',
        'SELECT SUM(amount) as total_revenue FROM orders WHERE status = "SUCCESS"',
        'SELECT SUM(wallet_balance) as total_wallet_balance FROM users',
        'SELECT SUM(glo_coin_balance) as total_glo_coins FROM users'
    ];
    
    Promise.all(queries.map(query => new Promise((resolve, reject) => {
        db.get(query, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    }))).then(results => {
        res.json({
            success: true,
            stats: {
                total_users: results[0].total_users,
                total_orders: results[1].total_orders,
                total_revenue: (results[2].total_revenue || 0) / 100, // Convert back to main currency unit
                total_wallet_balance: results[3].total_wallet_balance || 0,
                total_glo_coins: results[4].total_glo_coins || 0,
                current_gateway: paymentManager.getActiveGatewayName()
            }
        });
    }).catch(error => {
        console.error('Error getting stats:', error.message);
        res.status(500).json({ error: 'Failed to get platform statistics' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
