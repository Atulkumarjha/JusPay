-- Glo Coin System Database Schema
-- =================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_document_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Glo Coin Wallets Table
CREATE TABLE IF NOT EXISTS glo_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    glo_balance DECIMAL(15, 8) DEFAULT 0.00000000,
    inr_equivalent DECIMAL(15, 2) DEFAULT 0.00,
    last_balance_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    wallet_address VARCHAR(64) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Glo Coin Transactions Table
CREATE TABLE IF NOT EXISTS glo_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'withdrawal', 'conversion')),
    glo_amount DECIMAL(15, 8) NOT NULL,
    inr_amount DECIMAL(15, 2) NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'pending' CHECK (transaction_status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    reference_id VARCHAR(100) UNIQUE,
    juspay_order_id VARCHAR(100),
    juspay_payment_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    glo_amount DECIMAL(15, 8) NOT NULL,
    inr_amount DECIMAL(15, 2) NOT NULL,
    withdrawal_method VARCHAR(20) DEFAULT 'bank_transfer' CHECK (withdrawal_method IN ('bank_transfer', 'upi', 'wallet')),
    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    beneficiary_name VARCHAR(100) NOT NULL,
    withdrawal_status VARCHAR(20) DEFAULT 'pending' CHECK (withdrawal_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    juspay_order_id VARCHAR(100),
    juspay_payment_id VARCHAR(100),
    admin_notes TEXT,
    processing_fee DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Glo Coin Exchange Rates Table
CREATE TABLE IF NOT EXISTS glo_exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_inr DECIMAL(10, 4) DEFAULT 3.0000,
    rate_usd DECIMAL(10, 4),
    rate_eur DECIMAL(10, 4),
    effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin Activities Log Table
CREATE TABLE IF NOT EXISTS admin_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL,
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('user_creation', 'glo_credit', 'withdrawal_approval', 'rate_update')),
    target_user_id INTEGER,
    activity_data TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id)
);

-- Insert default exchange rate
INSERT OR IGNORE INTO glo_exchange_rates (rate_inr, effective_from, is_active) 
VALUES (3.0000, CURRENT_TIMESTAMP, true);
