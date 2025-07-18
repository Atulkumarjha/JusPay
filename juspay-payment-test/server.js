const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true for HTTPS
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
                
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
                    email: user.email
                };
                res.json({ success: true, message: 'Login successful', redirectTo: '/glo-coin' });
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
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
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
