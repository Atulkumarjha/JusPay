const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

// Mock data
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user1', password: 'password123', role: 'user' }
];

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 JusPay Backend API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'JusPay Backend' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      token: 'mock-jwt-token-' + user.id
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: 150,
    totalOrders: 450,
    revenue: 125000,
    activeGateway: 'juspay',
    timestamp: new Date()
  });
});

app.get('/api/payment/status', (req, res) => {
  res.json({
    status: 'active',
    gateways: ['juspay', 'cashfree'],
    currentGateway: 'juspay'
  });
});

// JusPay Webhook endpoint
app.post('/api/payment/callback', (req, res) => {
  console.log('🔔 Webhook received from JusPay:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // Handle different payment statuses
  const { order_id, status, amount, gateway_transaction_id } = req.body;
  
  switch (status) {
    case 'CHARGED':
      console.log(`✅ Payment successful for order ${order_id}, amount: ${amount}`);
      break;
    case 'PENDING':
      console.log(`⏳ Payment pending for order ${order_id}`);
      break;
    case 'FAILED':
      console.log(`❌ Payment failed for order ${order_id}`);
      break;
    default:
      console.log(`ℹ️ Payment status: ${status} for order ${order_id}`);
  }
  
  // Always respond with 200 to acknowledge receipt
  res.status(200).json({ 
    success: true, 
    message: 'Webhook received successfully',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on: http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  / - Health check');
  console.log('  GET  /api/health - API health');
  console.log('  POST /api/auth/login - Authentication');
  console.log('  GET  /api/users - User list');
  console.log('  GET  /api/admin/stats - Admin statistics');
  console.log('  GET  /api/payment/status - Payment status');
});
