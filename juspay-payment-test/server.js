const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
        ['https://yourdomain.com'] : 
        ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// Initialize database
require('./database/db');

// API Routes
app.use('/api/payment', require('./routes/payment'));
app.use('/api/glocoin', require('./routes/glocoin'));
app.use('/api/bank', require('./routes/bankAccounts'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Glo Coin dashboard page
app.get('/glocoin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'glocoin-enhanced.html'));
});

// Enhanced Glo Coin dashboard (new version)
app.get('/glocoin-enhanced', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'glocoin-enhanced.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'JusPay Payment Gateway + Glo Coin System is running',
        timestamp: new Date().toISOString(),
        services: {
            payment_gateway: 'active',
            glocoin_system: 'active',
            database: 'connected'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💳 JusPay Base URL: ${process.env.JUSPAY_BASE_URL}`);
});
