/**
 * Glo Coin Frontend Application
 * Handles user authentication, wallet management, and withdrawals
 */

class GloCoinApp {
    constructor() {
        this.baseURL = '/api/glocoin';
        this.token = localStorage.getItem('glo_token');
        this.user = null;
        this.exchangeRate = 3.0; // 1 Glo Coin = 3 INR
        
        this.initializeApp();
        this.setupEventListeners();
    }

    async initializeApp() {
        // Check if user is already logged in
        if (this.token) {
            try {
                await this.loadUserWallet();
                this.showDashboard();
            } catch (error) {
                console.error('Failed to load user data:', error);
                this.logout();
            }
        } else {
            this.showAuth();
        }
    }

    setupEventListeners() {
        // Auth form listeners
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerFormElement').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister').addEventListener('click', (e) => this.showRegisterForm(e));
        document.getElementById('showLogin').addEventListener('click', (e) => this.showLoginForm(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Dashboard listeners
        document.getElementById('creditCoinsBtn').addEventListener('click', () => this.showCreditModal());
        document.getElementById('withdrawBtn').addEventListener('click', () => this.showWithdrawModal());
        document.getElementById('convertBtn').addEventListener('click', () => this.showConverter());
        document.getElementById('transactionsBtn').addEventListener('click', () => this.showTransactions());
        document.getElementById('withdrawalsBtn').addEventListener('click', () => this.showWithdrawals());

        // Modal form listeners
        document.getElementById('creditForm').addEventListener('submit', (e) => this.handleCredit(e));
        document.getElementById('withdrawForm').addEventListener('submit', (e) => this.handleWithdraw(e));

        // Dynamic calculation listeners
        document.getElementById('withdrawAmount').addEventListener('input', (e) => this.updateWithdrawCalculation(e));
        document.getElementById('creditAmount').addEventListener('input', (e) => this.updateCreditCalculation(e));
        document.getElementById('withdrawMethod').addEventListener('change', (e) => this.toggleWithdrawFields(e));
    }

    // =============================================================================
    // AUTHENTICATION METHODS
    // =============================================================================

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const spinner = btn.querySelector('.loading-spinner');
        
        try {
            this.showLoading(btn, spinner, true);
            
            const formData = {
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            };

            const response = await this.apiCall('/login', 'POST', formData);
            
            if (response.success) {
                this.token = response.token;
                this.user = response.user;
                localStorage.setItem('glo_token', this.token);
                
                this.showAlert('Login successful!', 'success');
                this.showDashboard();
            } else {
                this.showAlert(response.error || 'Login failed', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Login failed. Please try again.', 'danger');
        } finally {
            this.showLoading(btn, spinner, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const spinner = btn.querySelector('.loading-spinner');
        
        try {
            this.showLoading(btn, spinner, true);
            
            const formData = {
                username: document.getElementById('regUsername').value,
                email: document.getElementById('regEmail').value,
                full_name: document.getElementById('regFullName').value,
                phone: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value
            };

            const response = await this.apiCall('/register', 'POST', formData);
            
            if (response.success) {
                this.showAlert('Account created successfully! Please login.', 'success');
                this.showLoginForm();
                document.getElementById('registerFormElement').reset();
            } else {
                this.showAlert(response.error || 'Registration failed', 'danger');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('Registration failed. Please try again.', 'danger');
        } finally {
            this.showLoading(btn, spinner, false);
        }
    }

    showLoginForm(e) {
        if (e) e.preventDefault();
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    }

    showRegisterForm(e) {
        if (e) e.preventDefault();
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('glo_token');
        this.showAuth();
        this.showAlert('Logged out successfully', 'info');
    }

    // =============================================================================
    // WALLET MANAGEMENT
    // =============================================================================

    async loadUserWallet() {
        try {
            const response = await this.apiCall('/wallet', 'GET');
            
            if (response.success) {
                this.user = response.wallet;
                this.updateWalletDisplay();
                this.updateUserInfo();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Failed to load wallet:', error);
            throw error;
        }
    }

    updateWalletDisplay() {
        if (this.user) {
            document.getElementById('gloBalance').textContent = parseFloat(this.user.glo_balance).toFixed(8);
            document.getElementById('inrEquivalent').textContent = parseFloat(this.user.inr_equivalent).toFixed(2);
        }
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('userInfo').textContent = `Welcome, ${this.user.username}`;
        }
    }

    // =============================================================================
    // CREDIT COINS
    // =============================================================================

    showCreditModal() {
        const modal = new bootstrap.Modal(document.getElementById('creditModal'));
        modal.show();
    }

    async handleCredit(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const spinner = btn.querySelector('.loading-spinner');
        
        try {
            this.showLoading(btn, spinner, true);
            
            const formData = {
                amount: parseFloat(document.getElementById('creditAmount').value),
                description: document.getElementById('creditDescription').value || 'Manual credit'
            };

            const response = await this.apiCall('/credit', 'POST', formData);
            
            if (response.success) {
                this.showAlert(`Successfully credited ${formData.amount} Glo Coins!`, 'success');
                await this.loadUserWallet();
                bootstrap.Modal.getInstance(document.getElementById('creditModal')).hide();
                document.getElementById('creditForm').reset();
            } else {
                this.showAlert(response.error || 'Credit failed', 'danger');
            }
        } catch (error) {
            console.error('Credit error:', error);
            this.showAlert('Credit failed. Please try again.', 'danger');
        } finally {
            this.showLoading(btn, spinner, false);
        }
    }

    updateCreditCalculation(e) {
        const amount = parseFloat(e.target.value) || 0;
        const inrAmount = amount * this.exchangeRate;
        document.getElementById('creditInrAmount').textContent = inrAmount.toFixed(2);
    }

    // =============================================================================
    // WITHDRAWALS
    // =============================================================================

    showWithdrawModal() {
        const modal = new bootstrap.Modal(document.getElementById('withdrawModal'));
        modal.show();
    }

    async handleWithdraw(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const spinner = btn.querySelector('.loading-spinner');
        
        try {
            this.showLoading(btn, spinner, true);
            
            const formData = {
                glo_amount: parseFloat(document.getElementById('withdrawAmount').value),
                withdrawal_method: document.getElementById('withdrawMethod').value,
                beneficiary_name: document.getElementById('beneficiaryName').value
            };

            if (formData.withdrawal_method === 'bank_transfer') {
                formData.bank_account_number = document.getElementById('bankAccount').value;
                formData.ifsc_code = document.getElementById('ifscCode').value;
            } else if (formData.withdrawal_method === 'upi') {
                formData.upi_id = document.getElementById('upiId').value;
            }

            const response = await this.apiCall('/withdraw', 'POST', formData);
            
            if (response.success) {
                this.showAlert('Withdrawal request submitted successfully!', 'success');
                await this.loadUserWallet();
                bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
                document.getElementById('withdrawForm').reset();
                
                // Show withdrawal details
                this.showWithdrawalSuccess(response.withdrawal);
            } else {
                this.showAlert(response.error || 'Withdrawal failed', 'danger');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            this.showAlert('Withdrawal failed. Please try again.', 'danger');
        } finally {
            this.showLoading(btn, spinner, false);
        }
    }

    updateWithdrawCalculation(e) {
        const amount = parseFloat(e.target.value) || 0;
        const inrAmount = amount * this.exchangeRate;
        document.getElementById('withdrawInrAmount').textContent = inrAmount.toFixed(2);
    }

    toggleWithdrawFields(e) {
        const method = e.target.value;
        const bankFields = document.getElementById('bankFields');
        const upiFields = document.getElementById('upiFields');
        
        if (method === 'bank_transfer') {
            bankFields.classList.remove('hidden');
            upiFields.classList.add('hidden');
        } else if (method === 'upi') {
            upiFields.classList.remove('hidden');
            bankFields.classList.add('hidden');
        } else {
            bankFields.classList.add('hidden');
            upiFields.classList.add('hidden');
        }
    }

    showWithdrawalSuccess(withdrawal) {
        const content = `
            <div class="text-center">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>Withdrawal Processed!</h4>
                <div class="alert alert-success">
                    <strong>Request ID:</strong> ${withdrawal.request_id}<br>
                    <strong>Amount:</strong> ${withdrawal.glo_amount} Glo Coins<br>
                    <strong>INR Amount:</strong> ₹${withdrawal.inr_amount.toFixed(2)}<br>
                    <strong>Processing Fee:</strong> ₹${withdrawal.processing_fee.toFixed(2)}<br>
                    <strong>Net Amount:</strong> ₹${withdrawal.net_amount.toFixed(2)}<br>
                    <strong>Status:</strong> ${withdrawal.processing?.success ? 'Completed' : 'Processing'}
                </div>
                <p class="text-muted">
                    Your withdrawal has been processed and will appear in your JusPay dashboard.
                </p>
            </div>
        `;
        this.showContentArea(content);
    }

    // =============================================================================
    // TRANSACTIONS & HISTORY
    // =============================================================================

    async showTransactions() {
        try {
            const response = await this.apiCall('/transactions?limit=50', 'GET');
            
            if (response.success) {
                const content = this.renderTransactions(response.transactions);
                this.showContentArea(content);
            } else {
                this.showAlert('Failed to load transactions', 'danger');
            }
        } catch (error) {
            console.error('Load transactions error:', error);
            this.showAlert('Failed to load transactions', 'danger');
        }
    }

    async showWithdrawals() {
        try {
            const response = await this.apiCall('/withdrawals?limit=20', 'GET');
            
            if (response.success) {
                const content = this.renderWithdrawals(response.withdrawals);
                this.showContentArea(content);
            } else {
                this.showAlert('Failed to load withdrawals', 'danger');
            }
        } catch (error) {
            console.error('Load withdrawals error:', error);
            this.showAlert('Failed to load withdrawals', 'danger');
        }
    }

    renderTransactions(transactions) {
        if (!transactions || transactions.length === 0) {
            return '<div class="text-center py-5"><h5>No transactions found</h5></div>';
        }

        let html = '<h4 class="mb-4"><i class="fas fa-history"></i> Transaction History</h4>';
        
        transactions.forEach(tx => {
            const icon = tx.type === 'credit' ? 'plus' : 'minus';
            const color = tx.type === 'credit' ? 'success' : 'danger';
            const sign = tx.type === 'credit' ? '+' : '-';
            
            html += `
                <div class="transaction-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-${icon} text-${color} me-2"></i>
                                <strong>${tx.description}</strong>
                            </div>
                            <small class="text-muted">${new Date(tx.created_at).toLocaleString()}</small>
                        </div>
                        <div class="text-end">
                            <div class="text-${color}">
                                ${sign}${tx.glo_amount} Glo Coins
                            </div>
                            <small class="text-muted">₹${tx.inr_amount.toFixed(2)}</small>
                            <span class="status-badge status-${tx.status}">${tx.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    renderWithdrawals(withdrawals) {
        if (!withdrawals || withdrawals.length === 0) {
            return '<div class="text-center py-5"><h5>No withdrawals found</h5></div>';
        }

        let html = '<h4 class="mb-4"><i class="fas fa-download"></i> Withdrawal History</h4>';
        
        withdrawals.forEach(wd => {
            html += `
                <div class="transaction-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-money-bill-transfer text-primary me-2"></i>
                                <strong>${wd.withdrawal_method.replace('_', ' ').toUpperCase()}</strong>
                            </div>
                            <small class="text-muted">
                                ${wd.beneficiary_name} • ${new Date(wd.requested_at).toLocaleString()}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="text-primary">
                                ${wd.glo_amount} Glo Coins
                            </div>
                            <small class="text-muted">
                                ₹${wd.inr_amount.toFixed(2)} - ₹${wd.processing_fee.toFixed(2)} fee = ₹${wd.net_amount.toFixed(2)}
                            </small>
                            <span class="status-badge status-${wd.status}">${wd.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    // =============================================================================
    // CONVERTER
    // =============================================================================

    showConverter() {
        const content = `
            <h4 class="mb-4"><i class="fas fa-exchange-alt"></i> Currency Converter</h4>
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>Glo Coins to INR</h5>
                            <div class="mb-3">
                                <input type="number" id="gloToInrInput" class="form-control glo-input" 
                                       placeholder="Enter Glo Coins" step="0.01">
                            </div>
                            <div class="alert alert-info">
                                = ₹<span id="gloToInrResult">0.00</span> INR
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>INR to Glo Coins</h5>
                            <div class="mb-3">
                                <input type="number" id="inrToGloInput" class="form-control glo-input" 
                                       placeholder="Enter INR amount" step="0.01">
                            </div>
                            <div class="alert alert-success">
                                = <span id="inrToGloResult">0.00000000</span> Glo Coins
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4 text-center">
                <div class="alert alert-warning">
                    <i class="fas fa-info-circle"></i>
                    <strong>Exchange Rate:</strong> 1 Glo Coin = ₹3.00 INR
                </div>
            </div>
        `;
        
        this.showContentArea(content);
        
        // Add converter event listeners
        document.getElementById('gloToInrInput').addEventListener('input', (e) => {
            const gloAmount = parseFloat(e.target.value) || 0;
            const inrAmount = gloAmount * this.exchangeRate;
            document.getElementById('gloToInrResult').textContent = inrAmount.toFixed(2);
        });
        
        document.getElementById('inrToGloInput').addEventListener('input', (e) => {
            const inrAmount = parseFloat(e.target.value) || 0;
            const gloAmount = inrAmount / this.exchangeRate;
            document.getElementById('inrToGloResult').textContent = gloAmount.toFixed(8);
        });
    }

    // =============================================================================
    // UI HELPERS
    // =============================================================================

    showAuth() {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
    }

    showContentArea(content) {
        document.getElementById('contentArea').innerHTML = content;
        document.getElementById('contentArea').classList.add('fade-in');
    }

    showLoading(btn, spinner, show) {
        if (show) {
            btn.disabled = true;
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            spinner.classList.add('hidden');
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alert = document.createElement('div');
        alert.id = alertId;
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                bootstrap.Alert.getOrCreateInstance(alertElement).close();
            }
        }, 5000);
    }

    // =============================================================================
    // API HELPERS
    // =============================================================================

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.token) {
            options.headers.Authorization = `Bearer ${this.token}`;
        }

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(this.baseURL + endpoint, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GloCoinApp();
});
