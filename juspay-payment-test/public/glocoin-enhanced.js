/**
 * Enhanced Glo Coin Frontend Application
 * User-friendly interface with complete error handling and JusPay integration
 */

class GloCoinApp {
    constructor() {
        this.authToken = localStorage.getItem('glocoinToken');
        this.currentUser = null;
        this.userBankAccount = null;
        this.apiBase = '/api/glocoin';
        this.bankApiBase = '/api/bank';
        
        // Initialize app
        this.init();
    }

    init() {
        console.log('Initializing GloCoin App...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApp();
            });
        } else {
            this.setupApp();
        }
    }
    
    setupApp() {
        console.log('Setting up app...');
        
        // Check Bootstrap availability
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap is not loaded!');
            this.showError('Bootstrap library is required but not loaded. Please refresh the page.');
            // Still try to bind events for basic functionality
        } else {
            console.log('✅ Bootstrap is available');
        }
        
        this.bindEvents();
        
        if (this.authToken) {
            console.log('Auth token found, showing dashboard');
            this.showDashboard();
            this.loadUserData();
        } else {
            console.log('No auth token, showing auth section');
            this.showAuthSection();
        }
        console.log('App setup complete');
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Authentication forms
        this.safeAddEventListener('login-form', 'submit', (e) => this.handleLogin(e));
        this.safeAddEventListener('register-form', 'submit', (e) => this.handleRegister(e));
        
        // Dashboard actions
        this.safeAddEventListener('logout-btn', 'click', () => this.logout());
        this.safeAddEventListener('refresh-wallet', 'click', () => this.refreshWallet());
        this.safeAddEventListener('refresh-transactions', 'click', () => this.loadTransactions());
        this.safeAddEventListener('withdraw-btn', 'click', () => this.showWithdrawalModal());
        this.safeAddEventListener('create-bank-account-btn', 'click', () => this.createBankAccount());
        
        // Quick action buttons
        this.safeAddEventListener('view-profile-btn', 'click', () => {
            console.log('Profile button clicked');
            this.showProfile();
        });
        this.safeAddEventListener('check-balance-btn', 'click', () => {
            console.log('Check balance button clicked');
            this.refreshWallet();
        });
        this.safeAddEventListener('transaction-history-btn', 'click', () => {
            console.log('Transaction history button clicked');
            this.loadTransactions();
        });
        this.safeAddEventListener('withdrawal-history-btn', 'click', () => {
            console.log('Withdrawal history button clicked');
            this.loadTransactions();
        });
        
        // Withdrawal form
        this.safeAddEventListener('withdrawal-form', 'submit', (e) => this.handleWithdrawal(e));
        this.safeAddEventListener('withdrawal-amount', 'input', (e) => this.calculateWithdrawalAmount(e));
        
        // Password confirmation
        this.safeAddEventListener('register-confirm-password', 'input', this.validatePasswordMatch);
        
        // Window resize handler for responsive behavior
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        console.log('Events bound successfully');
    }

    handleWindowResize() {
        // Handle responsive behavior on window resize
        const modal = document.querySelector('.modal.show');
        if (modal) {
            this.enforceResponsiveLayout(modal);
        }
    }

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✅ Event listener added for ${elementId}`);
            
            // Add visual feedback for button clicks
            if (event === 'click' && element.tagName === 'BUTTON') {
                element.addEventListener('click', () => {
                    element.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 100);
                });
            }
        } else {
            console.warn(`⚠️ Element not found: ${elementId}`);
        }
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        this.setLoading(submitBtn, true);
        
        try {
            const formData = {
                username: document.getElementById('login-username').value.trim(),
                password: document.getElementById('login-password').value
            };

            if (!formData.username || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            const response = await this.apiCall('POST', `${this.apiBase}/login`, formData);
            
            if (response.success) {
                this.authToken = response.token;
                this.currentUser = response.user;
                localStorage.setItem('glocoinToken', this.authToken);
                
                this.showSuccess('Login successful! Welcome back.');
                this.showDashboard();
                this.loadUserData();
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error) {
            this.showError(`Login failed: ${error.message}`);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        this.setLoading(submitBtn, true);
        
        try {
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const formData = {
                username: document.getElementById('register-username').value.trim(),
                full_name: document.getElementById('register-fullname').value.trim(),
                email: document.getElementById('register-email').value.trim(),
                phone: document.getElementById('register-phone').value.trim(),
                password: password
            };

            // Validation
            if (!formData.username || !formData.full_name || !formData.email || !formData.phone || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
                throw new Error('Please enter a valid 10-digit phone number');
            }

            if (!this.isValidEmail(formData.email)) {
                throw new Error('Please enter a valid email address');
            }

            const response = await this.apiCall('POST', `${this.apiBase}/register`, formData);
            
            if (response.success) {
                this.showSuccess('Registration successful! Please login with your credentials.');
                
                // Switch to login tab and pre-fill username
                document.getElementById('login-tab').click();
                document.getElementById('login-username').value = formData.username;
                form.reset();
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (error) {
            this.showError(`Registration failed: ${error.message}`);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    // Dashboard Methods
    async loadUserData() {
        try {
            await Promise.all([
                this.loadWalletInfo(),
                this.loadTransactions(),
                this.loadBankAccount()
            ]);
            
            this.updateNavigation();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showError('Failed to load user data. Please refresh the page.');
        }
    }

    async loadWalletInfo() {
        try {
            const response = await this.apiCall('GET', `${this.apiBase}/wallet`);
            
            if (response.success) {
                const wallet = response.wallet;
                
                // Update balance displays
                document.getElementById('glo-balance').textContent = wallet.glo_balance;
                document.getElementById('inr-equivalent').textContent = wallet.inr_equivalent;
                document.getElementById('total-glo-coins').textContent = wallet.glo_balance;
                document.getElementById('total-inr-value').textContent = `₹${wallet.inr_equivalent}`;
                
                this.currentUser = { ...this.currentUser, ...wallet };
            }
        } catch (error) {
            console.error('Error loading wallet:', error);
        }
    }

    async loadTransactions() {
        console.log('loadTransactions called');
        
        const refreshBtn = document.getElementById('refresh-transactions');
        let originalHtml = '';
        
        if (refreshBtn) {
            originalHtml = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            refreshBtn.disabled = true;
        }
        
        try {
            console.log('Fetching transactions...');
            const response = await this.apiCall('GET', `${this.apiBase}/transactions`);
            console.log('Transactions response:', response);
            
            if (response.success) {
                this.displayTransactions(response.transactions);
                const totalElement = document.getElementById('total-transactions');
                if (totalElement) {
                    totalElement.textContent = response.transactions.length;
                } else {
                    console.warn('total-transactions element not found');
                }
                this.showSuccess(`Loaded ${response.transactions.length} transactions`);
                console.log(`Loaded ${response.transactions.length} transactions`);
            } else {
                throw new Error(response.error || 'Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError(`Failed to load transactions: ${error.message}`);
        } finally {
            if (refreshBtn) {
                setTimeout(() => {
                    refreshBtn.innerHTML = originalHtml;
                    refreshBtn.disabled = false;
                }, 1000);
            }
        }
    }

    async loadBankAccount() {
        try {
            // First, try to get all bank accounts to find user's account
            const response = await this.apiCall('GET', `${this.bankApiBase}/accounts/all`);
            
            if (response.success && response.accounts.length > 0) {
                // For now, assume the first account belongs to the user
                // In production, you'd filter by user ID
                const bankAccount = response.accounts[0];
                this.displayBankAccount(bankAccount);
                this.userBankAccount = bankAccount;
            }
        } catch (error) {
            console.log('No bank account found');
        }
    }

    displayTransactions(transactions) {
        const container = document.getElementById('transaction-list');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-history fa-3x mb-3"></i>
                    <p>No transactions yet</p>
                    <small>Your transaction history will appear here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const typeClass = tx.type === 'credit' ? 'transaction-credit' : 
                             tx.type === 'debit' ? 'transaction-debit' : 'transaction-withdrawal';
            const icon = tx.type === 'credit' ? 'fas fa-plus-circle text-success' : 
                        tx.type === 'debit' ? 'fas fa-minus-circle text-danger' : 
                        'fas fa-money-bill-wave text-warning';
            
            return `
                <div class="transaction-item ${typeClass} p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-1">
                                <i class="${icon} me-2"></i>
                                <strong class="text-capitalize">${tx.type}</strong>
                                <span class="badge bg-${tx.status === 'completed' ? 'success' : 'warning'} ms-2">
                                    ${tx.status}
                                </span>
                            </div>
                            <p class="mb-1 text-muted">${tx.description}</p>
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${new Date(tx.created_at).toLocaleString()}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">
                                ${tx.type === 'credit' ? '+' : '-'}${tx.glo_amount} GC
                            </div>
                            <small class="text-muted">₹${tx.inr_amount}</small>
                            ${tx.reference_id ? `<br><small class="text-info">${tx.reference_id}</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayBankAccount(account) {
        const container = document.getElementById('bank-account-details');
        const section = document.getElementById('bank-account-section');
        
        container.innerHTML = `
            <div class="bank-account-card">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="mb-2">
                            <i class="fas fa-university me-2"></i>
                            ${account.bank_name}
                        </h6>
                        <div class="bank-account-number mb-2">
                            **** **** ${account.account_number.slice(-4)}
                        </div>
                        <small>
                            <i class="fas fa-user me-1"></i>
                            ${account.account_holder_name}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="h5 mb-1">₹${account.balance.toLocaleString()}</div>
                        <small>Current Balance</small>
                    </div>
                </div>
            </div>
        `;
        
        section.style.display = 'block';
    }

    // Withdrawal Methods
    showWithdrawalModal() {
        console.log('showWithdrawalModal called');
        console.log('Current user:', this.currentUser);
        
        if (!this.currentUser) {
            console.warn('No current user found for withdrawal');
            this.showError('Please log in first');
            return;
        }
        
        if (!this.currentUser.glo_balance || this.currentUser.glo_balance <= 0) {
            console.warn('Insufficient balance for withdrawal');
            this.showError('You need Glo Coins to make a withdrawal. Current balance: ' + (this.currentUser.glo_balance || 0) + ' GC');
            return;
        }

        // Update the maximum withdrawal amount based on current balance
        const withdrawalAmountInput = document.getElementById('withdrawal-amount');
        if (withdrawalAmountInput) {
            withdrawalAmountInput.max = this.currentUser.glo_balance;
            withdrawalAmountInput.placeholder = `Max: ${this.currentUser.glo_balance} GC`;
        }

        // Pre-fill form if bank account exists
        if (this.userBankAccount) {
            console.log('Pre-filling bank account details');
            const beneficiaryName = document.getElementById('beneficiary-name');
            const bankAccountNumber = document.getElementById('bank-account-number');
            const ifscCode = document.getElementById('ifsc-code');
            
            if (beneficiaryName) beneficiaryName.value = this.userBankAccount.account_holder_name || '';
            if (bankAccountNumber) bankAccountNumber.value = this.userBankAccount.account_number || '';
            if (ifscCode) ifscCode.value = this.userBankAccount.ifsc_code || '';
        }

        // Reset the INR amount display
        const inrDisplay = document.getElementById('inr-amount-display');
        if (inrDisplay) inrDisplay.textContent = '₹0';

        const modalElement = document.getElementById('withdrawalModal');
        if (!modalElement) {
            console.error('Withdrawal modal element not found');
            this.showError('Withdrawal form not available');
            return;
        }
        
        try {
            console.log('Opening withdrawal modal');
            
            // Check if Bootstrap is available
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap not available, using fallback');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
                
                // Ensure modal is scrollable on mobile
                modalElement.style.overflowY = 'auto';
                
                // Add close functionality for fallback
                const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        modalElement.style.display = 'none';
                        modalElement.classList.remove('show');
                    });
                });
                
                this.showSuccess('Withdrawal form opened (fallback mode)');
            } else {
                const modal = new bootstrap.Modal(modalElement, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                modal.show();
                this.showSuccess('Withdrawal form opened');
            }
            
            // Focus on first input for better UX
            setTimeout(() => {
                const firstInput = modalElement.querySelector('input[type="number"]');
                if (firstInput) {
                    firstInput.focus();
                }
                
                // Force responsive layout
                this.enforceResponsiveLayout(modalElement);
            }, 500);
            
        } catch (error) {
            console.error('Error opening withdrawal modal:', error);
            this.showError('Failed to open withdrawal form: ' + error.message);
        }
    }

    enforceResponsiveLayout(modalElement) {
        // Force responsive behavior on mobile
        if (window.innerWidth <= 768) {
            console.log('Enforcing mobile responsive layout');
            
            // Find all rows and columns in the modal
            const rows = modalElement.querySelectorAll('.row');
            const cols = modalElement.querySelectorAll('.col-md-6');
            
            rows.forEach(row => {
                row.style.display = 'block';
                row.style.width = '100%';
            });
            
            cols.forEach(col => {
                col.style.width = '100%';
                col.style.maxWidth = '100%';
                col.style.flex = 'none';
                col.style.display = 'block';
                col.style.marginBottom = '1rem';
            });
            
            // Ensure form controls are full width
            const formControls = modalElement.querySelectorAll('.form-control');
            formControls.forEach(control => {
                control.style.width = '100%';
                control.style.maxWidth = '100%';
                control.style.boxSizing = 'border-box';
            });
            
            // Stack buttons in footer
            const modalFooter = modalElement.querySelector('.modal-footer');
            if (modalFooter) {
                modalFooter.style.flexDirection = 'column';
                modalFooter.style.gap = '0.5rem';
                
                const buttons = modalFooter.querySelectorAll('.btn');
                buttons.forEach(btn => {
                    btn.style.width = '100%';
                    btn.style.marginBottom = '0.5rem';
                });
            }
        }
    }

    calculateWithdrawalAmount(e) {
        const amount = parseFloat(e.target.value) || 0;
        const inrDisplay = document.getElementById('inr-amount-display');
        
        if (!inrDisplay) {
            console.warn('INR amount display element not found');
            return;
        }
        
        if (amount <= 0) {
            inrDisplay.textContent = '₹0';
            inrDisplay.className = 'form-control bg-light';
            return;
        }
        
        const inrAmount = amount * 3; // 1 GC = ₹3
        const fee = inrAmount * 0.02; // 2% fee
        const netAmount = inrAmount - fee;
        
        // Validation styling
        if (this.currentUser && amount > this.currentUser.glo_balance) {
            inrDisplay.textContent = `₹${netAmount.toFixed(2)} (Fee: ₹${fee.toFixed(2)}) - INSUFFICIENT BALANCE`;
            inrDisplay.className = 'form-control bg-danger text-white';
        } else {
            inrDisplay.textContent = `₹${netAmount.toFixed(2)} (Fee: ₹${fee.toFixed(2)})`;
            inrDisplay.className = 'form-control bg-light';
        }
        
        console.log(`Withdrawal calculation: ${amount} GC = ₹${inrAmount} - ₹${fee} fee = ₹${netAmount}`);
    }

    async handleWithdrawal(e) {
        e.preventDefault();
        console.log('handleWithdrawal called');
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('#withdrawalModal button[type="submit"]');
        
        if (!submitBtn) {
            console.error('Submit button not found');
            this.showError('Form submit button not found');
            return;
        }
        
        this.setLoading(submitBtn, true);
        
        try {
            const withdrawalAmountInput = document.getElementById('withdrawal-amount');
            const beneficiaryNameInput = document.getElementById('beneficiary-name');
            const bankAccountInput = document.getElementById('bank-account-number');
            const ifscInput = document.getElementById('ifsc-code');
            
            if (!withdrawalAmountInput || !beneficiaryNameInput || !bankAccountInput || !ifscInput) {
                throw new Error('Required form fields not found');
            }
            
            const formData = {
                glo_amount: parseFloat(withdrawalAmountInput.value),
                withdrawal_method: 'bank_transfer',
                beneficiary_name: beneficiaryNameInput.value.trim(),
                bank_account_number: bankAccountInput.value.trim(),
                ifsc_code: ifscInput.value.trim().toUpperCase()
            };

            console.log('Form data:', formData);

            // Validation
            if (!formData.glo_amount || formData.glo_amount <= 0) {
                throw new Error('Please enter a valid withdrawal amount');
            }

            if (formData.glo_amount > this.currentUser.glo_balance) {
                throw new Error(`Insufficient Glo Coin balance. Available: ${this.currentUser.glo_balance} GC`);
            }

            if (!formData.beneficiary_name || !formData.bank_account_number || !formData.ifsc_code) {
                throw new Error('Please fill in all bank details');
            }

            if (!/^[A-Z]{4}[0-9]{7}$/.test(formData.ifsc_code)) {
                throw new Error('Invalid IFSC code format (Expected: ABCD0123456)');
            }

            console.log('Sending withdrawal request...');
            const response = await this.apiCall('POST', `${this.apiBase}/withdraw`, formData);
            console.log('Withdrawal response:', response);
            
            if (response.success) {
                this.showSuccess(`
                    Withdrawal successful! 
                    Request ID: ${response.withdrawal.request_id}
                    Net amount: ₹${response.withdrawal.net_amount}
                    ${response.processing?.withdrawal?.juspay_order_id ? 
                      `JusPay Order: ${response.processing.withdrawal.juspay_order_id}` : ''}
                `);
                
                // Close modal and refresh data
                const modalElement = document.getElementById('withdrawalModal');
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                } else {
                    modalElement.style.display = 'none';
                    modalElement.classList.remove('show');
                }
                
                form.reset();
                const inrDisplay = document.getElementById('inr-amount-display');
                if (inrDisplay) inrDisplay.textContent = '₹0';
                
                // Refresh dashboard data
                this.loadUserData();
            } else {
                throw new Error(response.error || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            this.showError(`Withdrawal failed: ${error.message}`);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    // Bank Account Methods
    async createBankAccount() {
        try {
            if (!this.currentUser) {
                throw new Error('Please login first');
            }

            const response = await this.apiCall('POST', `${this.bankApiBase}/account/create`, {
                name: this.currentUser.full_name || this.currentUser.username,
                userId: this.currentUser.id
            });
            
            if (response.success) {
                this.showSuccess('Mock bank account created successfully!');
                this.userBankAccount = response.account;
                this.displayBankAccount(response.account);
            } else {
                throw new Error(response.error || 'Failed to create bank account');
            }
        } catch (error) {
            this.showError(`Bank account creation failed: ${error.message}`);
        }
    }

    // Profile Methods
    showProfile() {
        console.log('showProfile called');
        console.log('Current user:', this.currentUser);
        
        if (!this.currentUser) {
            console.warn('No current user found');
            this.showError('Please log in first');
            return;
        }
        
        const profileDetails = document.getElementById('profile-details');
        if (!profileDetails) {
            console.error('Profile details element not found');
            this.showError('Profile display error');
            return;
        }
        
        profileDetails.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Username:</strong> ${this.currentUser.username}</p>
                    <p><strong>Full Name:</strong> ${this.currentUser.full_name || 'Not provided'}</p>
                    <p><strong>Email:</strong> ${this.currentUser.email}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Wallet Address:</strong></p>
                    <code class="small">${this.currentUser.wallet_address}</code>
                    <p class="mt-2"><strong>KYC Status:</strong> 
                        <span class="badge bg-${this.currentUser.kyc_status === 'verified' ? 'success' : 'warning'}">
                            ${this.currentUser.kyc_status || 'Pending'}
                        </span>
                    </p>
                </div>
            </div>
        `;
        
        const modalElement = document.getElementById('profileModal');
        if (!modalElement) {
            console.error('Profile modal element not found');
            this.showError('Profile modal not available');
            return;
        }
        
        try {
            console.log('Opening profile modal');
            
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap not available, using fallback');
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
                modalElement.style.overflowY = 'auto';
                
                // Add close functionality for fallback
                const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        modalElement.style.display = 'none';
                        modalElement.classList.remove('show');
                    });
                });
                
                this.showSuccess('Profile loaded successfully (fallback mode)');
            } else {
                const modal = new bootstrap.Modal(modalElement, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                modal.show();
                this.showSuccess('Profile loaded successfully');
            }
        } catch (error) {
            console.error('Error opening profile modal:', error);
            this.showError('Failed to open profile');
        }
    }

    // Utility Methods
    showAuthSection() {
        document.getElementById('welcome-section').style.display = 'block';
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('welcome-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
    }

    updateNavigation() {
        if (this.currentUser) {
            document.getElementById('nav-username').textContent = `Welcome, ${this.currentUser.username}`;
        }
    }

    logout() {
        this.authToken = null;
        this.currentUser = null;
        this.userBankAccount = null;
        localStorage.removeItem('glocoinToken');
        
        this.showAuthSection();
        this.showSuccess('Logged out successfully');
        
        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
    }

    async refreshWallet() {
        console.log('refreshWallet called');
        
        const btn = document.getElementById('refresh-wallet');
        if (!btn) {
            console.error('Refresh wallet button not found');
            this.showError('Refresh button not available');
            return;
        }
        
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        btn.disabled = true;
        
        try {
            console.log('Loading wallet info...');
            await this.loadWalletInfo();
            this.showSuccess('Wallet refreshed successfully');
            console.log('Wallet refreshed successfully');
        } catch (error) {
            console.error('Error refreshing wallet:', error);
            this.showError(`Failed to refresh wallet: ${error.message}`);
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }, 1000);
        }
    }

    // API and Utility Methods
    async apiCall(method, url, data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showAlert(message, type) {
        const container = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show fade-in" id="${alertId}" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showInfo(message) {
        this.showAlert(message, 'info');
    }

    validatePasswordMatch() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const confirmField = document.getElementById('register-confirm-password');
        
        if (confirmPassword && password !== confirmPassword) {
            confirmField.setCustomValidity('Passwords do not match');
            confirmField.classList.add('is-invalid');
        } else {
            confirmField.setCustomValidity('');
            confirmField.classList.remove('is-invalid');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gloCoinApp = new GloCoinApp();
});

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.gloCoinApp) {
        window.gloCoinApp.showError('An unexpected error occurred. Please try again.');
    }
});
