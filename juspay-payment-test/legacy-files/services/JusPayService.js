const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class JusPayService {
    constructor() {
        this.merchantId = process.env.JUSPAY_MERCHANT_ID;
        this.apiKey = process.env.JUSPAY_API_KEY;
        this.baseUrl = process.env.JUSPAY_BASE_URL;
        this.enableDashboardTracking = process.env.ENABLE_DASHBOARD_TRACKING === 'true';
        
        // Set up axios instance with correct JusPay authentication
        this.api = axios.create({
            baseURL: this.baseUrl,
            auth: {
                username: this.apiKey,  // JusPay uses API key as username
                password: ''            // Empty password for JusPay
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });
        
        console.log('JusPay Service initialized:', {
            merchantId: this.merchantId,
            baseUrl: this.baseUrl,
            enableDashboardTracking: this.enableDashboardTracking
        });
    }

    // Generate order data for JusPay
    generateOrderData(amount, currency = 'INR') {
        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const customerId = process.env.MOCK_CUSTOMER_ID || 'customer_' + Date.now();
        
        return {
            order_id: orderId,
            customer_id: customerId,
            amount: amount * 100, // Convert to smallest currency unit (paisa)
            currency: currency,
            customer_email: process.env.MOCK_CUSTOMER_EMAIL || 'test@example.com',
            customer_phone: process.env.MOCK_CUSTOMER_PHONE || '+91 9999999999',
            return_url: process.env.WEBHOOK_URL || 'https://example.com/return',
            description: `Glo Coin Purchase - ${amount} ${currency}`,
            metadata: {
                source: 'payment-gateway-platform',
                version: '1.0.0',
                type: 'payment'
            }
        };
    }

    // Create payment session
    async createPaymentSession(orderData) {
        try {
            // Always create real JusPay orders for dashboard tracking
            console.log('Creating JusPay order for dashboard tracking...');
            
            if (this.merchantId && this.apiKey) {
                try {
                    await this.createJusPayOrder(orderData);
                    console.log('✅ JusPay order created and will appear in dashboard:', orderData.order_id);
                } catch (apiError) {
                    console.warn('⚠️ JusPay API call failed, continuing with mock data:', apiError.message);
                }
            } else {
                console.warn('⚠️ JusPay credentials not configured, using mock data');
            }

            // Return mock response for simulation purposes
            console.log('📝 Using mock data for payment session');
            return this.generateMockPaymentSession(orderData);
        } catch (error) {
            console.error('JusPay payment session creation error:', error.message);
            throw new Error(`Payment session creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Create JusPay order that appears in dashboard
    async createJusPayOrder(orderData) {
        try {
            console.log('Creating JusPay order:', orderData.order_id);
            
            // Use the correct JusPay API endpoint for creating orders
            const response = await this.api.post('/orders', new URLSearchParams({
                order_id: orderData.order_id,
                amount: orderData.amount,
                currency: orderData.currency,
                customer_id: orderData.customer_id,
                customer_email: orderData.customer_email,
                customer_phone: orderData.customer_phone,
                description: orderData.description,
                merchant_id: this.merchantId,
                return_url: orderData.return_url || 'https://your-domain.com/payment/success'
            }));

            console.log('JusPay order created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('JusPay Order Creation Error:', error.response?.data || error.message);
            throw new Error(`Order creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Create withdrawal order in JusPay dashboard
    async createWithdrawalOrder(withdrawalData) {
        try {
            console.log('Creating JusPay withdrawal order for dashboard tracking:', withdrawalData.order_id);
            
            if (!this.merchantId || !this.apiKey) {
                console.warn('⚠️ JusPay credentials not configured, creating mock withdrawal record');
                return this.createMockWithdrawal(withdrawalData);
            }

            // Create withdrawal order in JusPay dashboard
            try {
                const response = await this.api.post('/orders', new URLSearchParams({
                    order_id: withdrawalData.order_id,
                    amount: withdrawalData.amount,
                    currency: withdrawalData.currency,
                    customer_id: withdrawalData.customer_id,
                    customer_email: withdrawalData.customer_email || 'customer@example.com',
                    customer_phone: withdrawalData.customer_phone || '+91 9999999999',
                    description: withdrawalData.description,
                    merchant_id: this.merchantId,
                    return_url: withdrawalData.return_url || 'https://your-domain.com/withdrawal/success',
                    metadata: JSON.stringify(withdrawalData.metadata || {})
                }));

                console.log('✅ JusPay withdrawal order created successfully and will appear in dashboard:', response.data);
                return response.data;
                
            } catch (apiError) {
                console.warn('⚠️ JusPay withdrawal API failed, creating mock record:', apiError.message);
                return this.createMockWithdrawal(withdrawalData);
            }
        } catch (error) {
            console.error('❌ JusPay Withdrawal Order Creation Error:', error.response?.data || error.message);
            return this.createMockWithdrawal(withdrawalData);
        }
    }

    // Create mock withdrawal record when API is not available
    createMockWithdrawal(withdrawalData) {
        console.log('📝 Creating mock withdrawal record for:', withdrawalData.order_id);
        return {
            id: 'mock_juspay_withdrawal_' + Date.now(),
            order_id: withdrawalData.order_id,
            amount: withdrawalData.amount,
            currency: withdrawalData.currency,
            status: 'PENDING',
            customer_id: withdrawalData.customer_id,
            description: withdrawalData.description,
            created_at: new Date().toISOString(),
            metadata: withdrawalData.metadata
        };
    }

    // Generate mock payment session for testing
    generateMockPaymentSession(orderData) {
        return {
            session_id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            order_id: orderData.order_id,
            customer_id: orderData.customer_id,
            amount: orderData.amount,
            currency: orderData.currency,
            status: 'PENDING',
            payment_page_url: `https://sandbox.assets.juspay.in/payment-page/order/${orderData.order_id}`,
            sdk_payload: {
                session_id: 'session_' + Date.now(),
                order_id: orderData.order_id,
                customer_id: orderData.customer_id,
                amount: orderData.amount,
                currency: orderData.currency,
                environment: 'sandbox',
                merchant_id: this.merchantId
            },
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            created_at: new Date().toISOString(),
            metadata: orderData.metadata
        };
    }

    // Mock payment processing
    async processPayment(orderId, paymentData) {
        try {
            // Simulate payment processing
            const success = paymentData.status === 'success';
            
            console.log(`🔄 Processing JusPay payment for order: ${orderId}, Status: ${success ? 'SUCCESS' : 'FAILED'}`);
            
            const result = {
                success: success,
                order_id: orderId,
                transaction_id: 'juspay_txn_' + Date.now(),
                payment_method: 'JUSPAY',
                gateway_reference_id: 'juspay_gtw_' + Date.now(),
                amount: paymentData.amount || 0,
                currency: 'INR',
                status: success ? 'CHARGED' : 'FAILED',
                message: success ? 'JusPay payment successful' : 'JusPay payment failed',
                processed_at: new Date().toISOString()
            };

            console.log(`📊 JusPay payment processed: ${success ? '✅ SUCCESS' : '❌ FAILED'} - Transaction: ${result.transaction_id}`);
            return result;
        } catch (error) {
            console.error('❌ JusPay payment processing error:', error.message);
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }

    // Validate webhook signature
    validateWebhookSignature(payload, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', this.apiKey)
            .update(payload)
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }
}

module.exports = JusPayService;