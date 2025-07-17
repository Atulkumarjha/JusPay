/**
 * Bank Account Mock System
 * Simulates real bank account behavior during Glo Coin withdrawals
 */
class BankAccountSimulator {
    constructor() {
        this.bankAccounts = new Map();
        this.transactionHistory = new Map();
        this.accountSequence = 1000000000; // Starting account number
    }

    // Create a new mock bank account
    createBankAccount(userDetails) {
        const accountNumber = (this.accountSequence++).toString();
        const banks = [
            { name: 'HDFC Bank', ifsc_prefix: 'HDFC', branch: 'Delhi CP' },
            { name: 'ICICI Bank', ifsc_prefix: 'ICIC', branch: 'Mumbai Andheri' },
            { name: 'State Bank of India', ifsc_prefix: 'SBIN', branch: 'Bangalore Electronic City' },
            { name: 'Axis Bank', ifsc_prefix: 'UTIB', branch: 'Pune FC Road' },
            { name: 'Kotak Mahindra Bank', ifsc_prefix: 'KKBK', branch: 'Hyderabad Gachibowli' }
        ];

        const randomBank = banks[Math.floor(Math.random() * banks.length)];
        const ifscCode = `${randomBank.ifsc_prefix}0${Math.floor(Math.random() * 900000) + 100000}`;

        const account = {
            account_number: accountNumber,
            ifsc_code: ifscCode,
            account_holder_name: userDetails.name,
            bank_name: randomBank.name,
            branch: randomBank.branch,
            balance: Math.floor(Math.random() * 50000) + 10000, // Random balance between 10k-60k
            account_type: 'SAVINGS',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            monthly_transaction_limit: 100000,
            monthly_transactions_used: 0
        };

        this.bankAccounts.set(accountNumber, account);
        this.transactionHistory.set(accountNumber, []);

        return account;
    }

    // Process a withdrawal (credit to bank account)
    processWithdrawal(accountNumber, withdrawalData) {
        const account = this.bankAccounts.get(accountNumber);
        if (!account) {
            throw new Error(`Bank account ${accountNumber} not found`);
        }

        const { amount, reference, description, gloCoinAmount } = withdrawalData;

        // Check monthly limits
        if (account.monthly_transactions_used + amount > account.monthly_transaction_limit) {
            throw new Error('Monthly transaction limit exceeded');
        }

        // Process the credit
        const previousBalance = account.balance;
        account.balance += amount;
        account.last_updated = new Date().toISOString();
        account.monthly_transactions_used += amount;

        // Create transaction record
        const transaction = {
            id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'CREDIT',
            amount: amount,
            balance_before: previousBalance,
            balance_after: account.balance,
            description: description || `Glo Coin withdrawal - ${gloCoinAmount} GC`,
            reference: reference,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED',
            source: 'GLOCOIN_WITHDRAWAL',
            metadata: {
                glo_coin_amount: gloCoinAmount,
                exchange_rate: 3,
                processing_fee_applied: true
            }
        };

        // Add to transaction history
        const history = this.transactionHistory.get(accountNumber);
        history.unshift(transaction); // Add to beginning
        
        // Keep only last 50 transactions
        if (history.length > 50) {
            history.splice(50);
        }

        // Update account
        this.bankAccounts.set(accountNumber, account);

        return {
            success: true,
            transaction: transaction,
            account: account
        };
    }

    // Get account details
    getAccountDetails(accountNumber) {
        const account = this.bankAccounts.get(accountNumber);
        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        return {
            success: true,
            account: account,
            transaction_count: this.transactionHistory.get(accountNumber).length
        };
    }

    // Get transaction history
    getTransactionHistory(accountNumber, limit = 10) {
        const account = this.bankAccounts.get(accountNumber);
        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        const transactions = this.transactionHistory.get(accountNumber).slice(0, limit);

        return {
            success: true,
            account_number: accountNumber,
            account_holder: account.account_holder_name,
            current_balance: account.balance,
            transactions: transactions
        };
    }

    // Get account statement
    generateStatement(accountNumber, days = 30) {
        const account = this.bankAccounts.get(accountNumber);
        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const allTransactions = this.transactionHistory.get(accountNumber);
        const recentTransactions = allTransactions.filter(tx => 
            new Date(tx.timestamp) >= cutoffDate
        );

        const totalCredits = recentTransactions
            .filter(tx => tx.type === 'CREDIT')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalDebits = recentTransactions
            .filter(tx => tx.type === 'DEBIT')
            .reduce((sum, tx) => sum + tx.amount, 0);

        return {
            success: true,
            statement_period: `${days} days`,
            account: {
                number: account.account_number,
                holder: account.account_holder_name,
                bank: account.bank_name,
                branch: account.branch
            },
            summary: {
                opening_balance: account.balance - totalCredits + totalDebits,
                closing_balance: account.balance,
                total_credits: totalCredits,
                total_debits: totalDebits,
                transaction_count: recentTransactions.length
            },
            transactions: recentTransactions
        };
    }

    // List all accounts (for admin purposes)
    getAllAccounts() {
        const accounts = Array.from(this.bankAccounts.values()).map(account => ({
            account_number: account.account_number,
            account_holder_name: account.account_holder_name,
            bank_name: account.bank_name,
            balance: account.balance,
            status: account.status,
            last_updated: account.last_updated
        }));

        return {
            success: true,
            total_accounts: accounts.length,
            accounts: accounts
        };
    }
}

module.exports = BankAccountSimulator;
