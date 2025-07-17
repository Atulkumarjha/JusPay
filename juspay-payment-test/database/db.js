const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'glocoin.db');
        this.schemaPath = path.join(__dirname, 'schema.sql');
        this.db = null;
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Connect to database
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening database:', err.message);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.executeSchema();
                }
            });

            // Enable foreign keys
            this.db.run("PRAGMA foreign_keys = ON");
            
        } catch (error) {
            console.error('❌ Database initialization error:', error);
        }
    }

    executeSchema() {
        try {
            const schema = fs.readFileSync(this.schemaPath, 'utf8');
            const statements = schema.split(';').filter(stmt => stmt.trim());

            statements.forEach((statement, index) => {
                if (statement.trim()) {
                    this.db.run(statement, (err) => {
                        if (err) {
                            console.error(`❌ Schema error at statement ${index + 1}:`, err.message);
                        }
                    });
                }
            });

            console.log('✅ Database schema initialized');
        } catch (error) {
            console.error('❌ Error reading schema file:', error);
        }
    }

    // Generic query methods
    async run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // User management methods
    async createUser(userData) {
        const query = `
            INSERT INTO users (username, email, password_hash, full_name, phone)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await this.run(query, [
            userData.username,
            userData.email,
            userData.password_hash,
            userData.full_name,
            userData.phone
        ]);

        // Create wallet for new user
        if (result.id) {
            await this.createWallet(result.id);
        }

        return result;
    }

    async createWallet(userId) {
        const crypto = require('crypto');
        const walletAddress = 'glo_' + crypto.randomBytes(20).toString('hex');
        
        const query = `
            INSERT INTO glo_wallets (user_id, wallet_address)
            VALUES (?, ?)
        `;
        return await this.run(query, [userId, walletAddress]);
    }

    async getUserById(userId) {
        const query = `
            SELECT u.*, gw.glo_balance, gw.inr_equivalent, gw.wallet_address
            FROM users u
            LEFT JOIN glo_wallets gw ON u.id = gw.user_id
            WHERE u.id = ? AND u.is_active = true
        `;
        return await this.get(query, [userId]);
    }

    async getUserByUsername(username) {
        const query = `
            SELECT u.*, gw.glo_balance, gw.inr_equivalent, gw.wallet_address
            FROM users u
            LEFT JOIN glo_wallets gw ON u.id = gw.user_id
            WHERE u.username = ? AND u.is_active = true
        `;
        return await this.get(query, [username]);
    }

    async getUserByEmail(email) {
        const query = `
            SELECT u.*, gw.glo_balance, gw.inr_equivalent, gw.wallet_address
            FROM users u
            LEFT JOIN glo_wallets gw ON u.id = gw.user_id
            WHERE u.email = ? AND u.is_active = true
        `;
        return await this.get(query, [email]);
    }

    // Glo Coin transaction methods
    async updateGloBalance(userId, gloAmount, transactionType, description, referenceId) {
        try {
            // Start transaction
            await this.run('BEGIN TRANSACTION');

            // Get current balance
            const wallet = await this.get('SELECT glo_balance FROM glo_wallets WHERE user_id = ?', [userId]);
            const currentBalance = parseFloat(wallet.glo_balance) || 0;
            
            let newBalance;
            if (transactionType === 'credit') {
                newBalance = currentBalance + parseFloat(gloAmount);
            } else {
                newBalance = currentBalance - parseFloat(gloAmount);
                if (newBalance < 0) {
                    throw new Error('Insufficient Glo Coin balance');
                }
            }

            // Update wallet balance
            const inrEquivalent = newBalance * 3.0; // 1 Glo Coin = 3 INR
            await this.run(
                'UPDATE glo_wallets SET glo_balance = ?, inr_equivalent = ?, last_balance_update = CURRENT_TIMESTAMP WHERE user_id = ?',
                [newBalance, inrEquivalent, userId]
            );

            // Record transaction
            const inrAmount = parseFloat(gloAmount) * 3.0;
            await this.run(`
                INSERT INTO glo_transactions (user_id, transaction_type, glo_amount, inr_amount, 
                                            transaction_status, description, reference_id)
                VALUES (?, ?, ?, ?, 'completed', ?, ?)
            `, [userId, transactionType, gloAmount, inrAmount, description, referenceId]);

            // Commit transaction
            await this.run('COMMIT');

            return { success: true, newBalance, inrEquivalent };
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    async createWithdrawalRequest(withdrawalData) {
        const query = `
            INSERT INTO withdrawal_requests (
                user_id, glo_amount, inr_amount, withdrawal_method, 
                bank_account_number, ifsc_code, upi_id, beneficiary_name,
                processing_fee, net_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.run(query, [
            withdrawalData.user_id,
            withdrawalData.glo_amount,
            withdrawalData.inr_amount,
            withdrawalData.withdrawal_method,
            withdrawalData.bank_account_number,
            withdrawalData.ifsc_code,
            withdrawalData.upi_id,
            withdrawalData.beneficiary_name,
            withdrawalData.processing_fee,
            withdrawalData.net_amount
        ]);
    }

    async getWithdrawalHistory(userId, limit = 50) {
        const query = `
            SELECT * FROM withdrawal_requests
            WHERE user_id = ?
            ORDER BY requested_at DESC
            LIMIT ?
        `;
        return await this.all(query, [userId, limit]);
    }

    async getTransactionHistory(userId, limit = 100) {
        const query = `
            SELECT * FROM glo_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
        return await this.all(query, [userId, limit]);
    }

    async getCurrentExchangeRate() {
        const query = `
            SELECT rate_inr FROM glo_exchange_rates
            WHERE is_active = true
            ORDER BY effective_from DESC
            LIMIT 1
        `;
        const result = await this.get(query);
        return result ? parseFloat(result.rate_inr) : 3.0;
    }

    // Session management
    async createSession(userId, sessionToken, expiresAt, ipAddress, userAgent) {
        const query = `
            INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `;
        return await this.run(query, [userId, sessionToken, expiresAt, ipAddress, userAgent]);
    }

    async getValidSession(sessionToken) {
        const query = `
            SELECT us.*, u.username, u.email, u.full_name
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.session_token = ? AND us.expires_at > CURRENT_TIMESTAMP
        `;
        return await this.get(query, [sessionToken]);
    }

    async deleteSession(sessionToken) {
        const query = 'DELETE FROM user_sessions WHERE session_token = ?';
        return await this.run(query, [sessionToken]);
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
