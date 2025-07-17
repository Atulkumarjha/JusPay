# Glo Coin Enhanced Frontend - User Guide

## 🎯 **User Credentials for Testing**

**Username:** `atul`  
**Password:** `atul123456`  
**Full Name:** Atul Kumar Jha  
**Email:** atul.kumar@juspay.com  
**Current Balance:** 200 Glo Coins (₹600)  
**Bank Account:** Kotak Mahindra Bank - 1000000001

---

## 🚀 **How to Use the Enhanced Frontend**

### **Step 1: Access the Platform**
Open your browser and go to: `http://localhost:3000/glocoin-enhanced`

### **Step 2: Login with Existing User**
1. Click on the **Login** tab
2. Enter credentials:
   - Username: `atul`
   - Password: `atul123456`
3. Click **Login**

### **Step 3: Explore the Dashboard**
After login, you'll see:
- **Wallet Balance**: Current Glo Coins and INR equivalent
- **Transaction History**: All your past transactions
- **Quick Actions**: Profile, balance check, etc.
- **Exchange Rate**: Fixed at 1 GC = ₹3 INR

### **Step 4: Create/View Bank Account**
1. Click **"Add Bank Account"** button
2. A mock bank account will be created automatically
3. View account details in the "My Bank Account" section

### **Step 5: Process a Withdrawal**
1. Click **"Withdraw"** button
2. Fill in the withdrawal form:
   - **Glo Coins to Withdraw**: Enter amount (e.g., 50)
   - **Beneficiary Name**: Auto-filled from bank account
   - **Bank Account Number**: Auto-filled
   - **IFSC Code**: Auto-filled
3. Click **"Process Withdrawal"**
4. See real-time calculation of fees and net amount

### **Step 6: Monitor Transactions**
- Check **Transaction History** for all operations
- Each withdrawal creates a **JusPay Order ID** for tracking
- Bank account balance updates automatically

---

## 🔧 **For New Users (Registration)**

### **Create New Account**
1. Click **Register** tab
2. Fill in details:
   - **Username**: Choose unique username
   - **Full Name**: Your full name
   - **Email**: Valid email address
   - **Phone**: 10-digit mobile number
   - **Password**: Strong password
   - **Confirm Password**: Same as above
3. Click **"Create Account"**
4. Login with your new credentials

---

## 💡 **Key Features Demonstrated**

### ✅ **User-Friendly Interface**
- Modern Bootstrap 5 design
- Responsive layout for all devices
- Intuitive navigation and clear actions

### ✅ **Real-Time Updates**
- Live balance calculations
- Automatic fee computation
- Instant transaction history

### ✅ **Bank Account Integration**
- Mock bank accounts with realistic details
- Real-time balance updates during withdrawals
- Complete transaction audit trail

### ✅ **JusPay Dashboard Integration**
- Every withdrawal creates JusPay tracking order
- Unique order IDs for compliance
- Complete transaction visibility

### ✅ **Error Handling**
- Comprehensive form validation
- Clear error messages
- Loading states for all operations

### ✅ **Security Features**
- JWT token authentication
- Secure API communication
- Session management

---

## 🎮 **Test Scenarios**

### **Scenario 1: Basic Withdrawal**
1. Login as `atul`
2. Try withdrawing 50 Glo Coins
3. Observe: Fee calculation (₹3), Net amount (₹147)
4. Check transaction history for the record

### **Scenario 2: Bank Account Creation**
1. Click "Add Bank Account"
2. View the generated account details
3. Note realistic bank information (name, IFSC, etc.)

### **Scenario 3: Profile Management**
1. Click "View Profile" in Quick Actions
2. See user details and wallet information
3. Check KYC status and wallet address

### **Scenario 4: Transaction Monitoring**
1. Process multiple small withdrawals
2. Refresh transaction history
3. Observe different transaction types and statuses

---

## 🏦 **Bank Account Details for Testing**

**Account Holder:** Atul Kumar Jha  
**Bank:** Kotak Mahindra Bank  
**Branch:** Hyderabad Gachibowli  
**Account Number:** 1000000001  
**IFSC Code:** KKBK0508704  
**Account Type:** Savings  
**Initial Balance:** ₹38,256  

---

## 📊 **Transaction Flow**

```
User Withdrawal Request
        ↓
Form Validation & Fee Calculation
        ↓
Glo Coin Debit from Wallet
        ↓
JusPay Order Creation
        ↓
Bank Account Credit Simulation
        ↓
Transaction History Update
        ↓
Success Notification
```

---

## 🔍 **API Endpoints Used**

- `POST /api/glocoin/register` - User registration
- `POST /api/glocoin/login` - User authentication
- `GET /api/glocoin/wallet` - Wallet information
- `POST /api/glocoin/withdraw` - Process withdrawals
- `GET /api/glocoin/transactions` - Transaction history
- `POST /api/bank/account/create` - Create mock bank account
- `GET /api/bank/account/:number` - Bank account details

---

## 🎉 **What Makes This System Special**

1. **Complete Integration**: Glo Coins → JusPay → Bank Accounts
2. **Real-Time Simulation**: Bank balances update during withdrawals
3. **Compliance Ready**: All transactions tracked for audit
4. **User Experience**: Professional, error-free interface
5. **Production Ready**: Comprehensive error handling and validation

---

**Ready to Test? Visit: http://localhost:3000/glocoin-enhanced**
