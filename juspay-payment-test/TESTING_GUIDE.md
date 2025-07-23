# 🔗 JusPay Platform - Complete URL Testing Guide

## 🚀 Start Your Applications

### Step 1: Start Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### Step 2: Start Frontend (Next.js)
```bash
cd frontend
npm install  
npm run dev
```

## 🌐 All Platform URLs

### 🎨 **Frontend Application (Next.js)**
| Page | URL | Description |
|------|-----|-------------|
| **🏠 Home/Landing** | http://localhost:3000 | Main application entry point |
| **🔑 Login Page** | http://localhost:3000/login | User authentication |
| **📊 Admin Dashboard** | http://localhost:3000/admin | Admin control panel |
| **👤 User Dashboard** | http://localhost:3000/dashboard | User account dashboard |

### ⚙️ **Backend API (NestJS)**
| Endpoint | URL | Method | Description |
|----------|-----|--------|-------------|
| **🏥 Health Check** | http://localhost:8000 | GET | API status |
| **🔐 Authentication** | http://localhost:8000/auth/login | POST | User login |
| **👥 Users** | http://localhost:8000/users | GET | User management |
| **💳 Orders** | http://localhost:8000/orders | GET/POST | Order processing |
| **💰 Wallet** | http://localhost:8000/wallet | GET/POST | Wallet operations |

## 🧪 Testing Scenarios

### 1. **🔑 Authentication Flow**
```
1. Visit: http://localhost:3000/login
2. Test Credentials:
   - Admin: admin / admin123
   - User: user1 / password123
3. Should redirect to appropriate dashboard
```

### 2. **📊 Admin Dashboard**
```
1. Login as admin
2. Visit: http://localhost:3000/admin
3. Test Features:
   - Gateway switching (JusPay ↔ Cashfree)
   - Real-time statistics
   - User management
   - Order monitoring
```

### 3. **👤 User Dashboard** 
```
1. Login as regular user
2. Visit: http://localhost:3000/dashboard
3. Test Features:
   - Wallet balance
   - Transaction history
   - Profile management
   - Payment processing
```

### 4. **💳 Payment Integration**
```
1. From user dashboard
2. Initiate payment
3. Test both gateways:
   - JusPay integration
   - Cashfree integration
4. Verify webhook handling
```

### 5. **📱 Mobile Responsiveness**
```
1. Test all URLs on mobile devices
2. Check responsive design
3. Verify touch interactions
4. Test navigation
```

## 🔧 API Testing with curl

### Authentication:
```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Health Check:
```bash
# API Status
curl http://localhost:8000
```

### Protected Routes:
```bash
# Get Users (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/users
```

## 🎯 Key Features to Test

### ✅ **Frontend Features:**
- [x] **Responsive Design** - Test on different screen sizes
- [x] **Dark/Light Mode** - Check theme switching
- [x] **Form Validation** - Try invalid inputs
- [x] **Navigation** - Test all menu items
- [x] **Authentication** - Login/logout flow
- [x] **Real-time Updates** - Gateway switching
- [x] **Toast Notifications** - Success/error messages

### ✅ **Backend Features:**
- [x] **JWT Authentication** - Token-based security
- [x] **Database Operations** - CRUD operations
- [x] **API Validation** - Input sanitization
- [x] **Error Handling** - Proper error responses
- [x] **CORS Configuration** - Cross-origin requests
- [x] **Rate Limiting** - API protection

### ✅ **Payment Features:**
- [x] **Gateway Integration** - JusPay & Cashfree
- [x] **Webhook Processing** - Payment notifications
- [x] **Transaction Logging** - Payment history
- [x] **Wallet Management** - Balance updates
- [x] **Order Processing** - End-to-end flow

## 🐛 Debugging URLs

### Development Tools:
```
- Frontend Dev Tools: http://localhost:3000 (F12)
- Backend Logs: Check terminal running NestJS
- Database: Connect to PostgreSQL (when configured)
- API Documentation: http://localhost:8000/api (if Swagger enabled)
```

## 📊 Performance Testing

### Load Testing:
```bash
# Test API performance
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:8000

# Multiple concurrent requests
for i in {1..10}; do
  curl http://localhost:3000 &
done
```

## 🔒 Security Testing

### Test Cases:
```
1. SQL Injection protection
2. XSS prevention
3. CSRF protection
4. JWT token validation
5. Input sanitization
6. Rate limiting
```

## 📝 Testing Checklist

### Before Testing:
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Database connected
- [ ] Environment variables configured

### During Testing:
- [ ] All URLs accessible
- [ ] Authentication working
- [ ] Payment gateways responding
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance acceptable

### After Testing:
- [ ] Check logs for errors
- [ ] Verify data integrity
- [ ] Test cleanup (if needed)
- [ ] Document any issues

---

## 🎉 Quick Start Testing

**Fastest way to test everything:**

1. **Start apps:**
   ```bash
   # Terminal 1
   cd backend && npm run start:dev
   
   # Terminal 2  
   cd frontend && npm run dev
   ```

2. **Test main flows:**
   - http://localhost:3000 (landing)
   - http://localhost:3000/login (auth)
   - http://localhost:3000/admin (admin features)
   - http://localhost:3000/dashboard (user features)

3. **Verify backend:**
   - http://localhost:8000 (health check)

**Happy Testing! 🚀**
