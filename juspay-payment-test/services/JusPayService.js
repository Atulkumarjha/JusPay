const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class JusPayService {
    constructor() {
        this.merchantId = process.env.JUSPAY_MERCHANT_ID;
        this.apiKey = process.env.JUSPAY_API_KEY;
        this.baseUrl = process.env.JUSPAY_BASE_URL;
        this.useMockData = process.env.USE_MOCK_DATA === 'true';
        
        // Set up axios instance with auth
        this.api = axios.create({
            baseURL: this.baseUrl,
            auth: {
                username: this.merchantId,
                password: this.apiKey
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }

    // Generate mock order data
    generateMockOrder(amount, currency = 'INR') {
        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const customerId = process.env.MOCK_CUSTOMER_ID || 'customer_mock_' + Date.now();
        
        return {
            order_id: orderId,
            customer_id: customerId,
            amount: amount * 100, // Convert to smallest currency unit (paisa)
            currency: currency,
            customer_email: process.env.MOCK_CUSTOMER_EMAIL || 'mock.test@example.com',
            customer_phone: process.env.MOCK_CUSTOMER_PHONE || '+91 9999999999',
            return_url: process.env.WEBHOOK_URL || 'https://example.com/return',
            description: `Mock Glo Coin Purchase - ${amount} ${currency}`,
            metadata: {
                source: process.env.MOCK_METADATA_SOURCE || 'glo-coin-platform',
                version: process.env.MOCK_METADATA_VERSION || '1.0.0',
                test_type: process.env.MOCK_METADATA_TEST_TYPE || 'integration_testing'
            }
        };
    }

    // Create payment session with JusPay
    async createPaymentSession(orderData) {
        try {
            if (this.useMockData) {
                // Return mock response for testing
                return this.generateMockPaymentSession(orderData);
            }

            // Real JusPay API call
            const response = await this.api.post('/session', new URLSearchParams({
                order_id: orderData.order_id,
                customer_id: orderData.customer_id,
                amount: orderData.amount,
                currency: orderData.currency,
                customer_email: orderData.customer_email,
                customer_phone: orderData.customer_phone,
                return_url: orderData.return_url,
                description: orderData.description,
                metadata: JSON.stringify(orderData.metadata)
            }));

            return response.data;
        } catch (error) {
            console.error('JusPay API Error:', error.response?.data || error.message);
            throw new Error(`Payment session creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Generate mock payment session response
    generateMockPaymentSession(orderData) {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const paymentPageUrl = `${this.baseUrl}/payment?session_id=${sessionId}`;
        
        return {
            session_id: sessionId,
            order_id: orderData.order_id,
            customer_id: orderData.customer_id,
            amount: orderData.amount,
            currency: orderData.currency,
            status: 'NEW',
            payment_page_url: paymentPageUrl,
            sdk_payload: {
                session_id: sessionId,
                order_id: orderData.order_id,
                customer_id: orderData.customer_id,
                amount: orderData.amount,
                currency: orderData.currency,
                environment: 'sandbox',
                merchant_id: this.merchantId
            },
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
            created_at: new Date().toISOString(),
            metadata: orderData.metadata
        };
    }

    // Get payment status
    async getPaymentStatus(orderId) {
        try {
            if (this.useMockData) {
                // Return mock payment status
                return this.generateMockPaymentStatus(orderId);
            }

            const response = await this.api.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('JusPay Status Check Error:', error.response?.data || error.message);
            throw new Error(`Payment status check failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Generate mock payment status
    generateMockPaymentStatus(orderId) {
        const statuses = ['PENDING', 'AUTHORIZED', 'CHARGED', 'FAILED'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            order_id: orderId,
            status: randomStatus,
            amount: Math.floor(Math.random() * 100000) + 1000, // Random amount between 10-1000 INR
            currency: 'INR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            payment_method: 'CARD',
            payment_method_type: 'CREDIT_CARD',
            gateway_reference_id: 'gtw_' + Date.now(),
            transaction_id: 'txn_' + Date.now(),
            metadata: {
                source: 'glo-coin-platform',
                test_transaction: true
            }
        };
    }

    // Process mock payment completion
    async processMockPayment(orderId, success = true) {
        const paymentResult = {
            order_id: orderId,
            status: success ? 'CHARGED' : 'FAILED',
            amount: Math.floor(Math.random() * 100000) + 1000,
            currency: 'INR',
            transaction_id: 'txn_' + Date.now(),
            gateway_reference_id: 'gtw_' + Date.now(),
            payment_method: 'CARD',
            payment_method_type: 'CREDIT_CARD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            gateway_response: {
                status: success ? 'SUCCESS' : 'FAILURE',
                message: success ? 'Payment processed successfully' : 'Payment failed',
                reference_id: 'ref_' + Date.now()
            },
            metadata: {
                source: 'glo-coin-platform',
                test_transaction: true,
                mock_data: true
            }
        };

        return paymentResult;
    }

    // Create refund
    async createRefund(orderId, amount, reason = 'User requested refund') {
        try {
            if (this.useMockData) {
                return this.generateMockRefund(orderId, amount, reason);
            }

            const response = await this.api.post('/refunds', new URLSearchParams({
                order_id: orderId,
                amount: amount,
                reason: reason
            }));

            return response.data;
        } catch (error) {
            console.error('JusPay Refund Error:', error.response?.data || error.message);
            throw new Error(`Refund creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    // Generate mock refund
    generateMockRefund(orderId, amount, reason) {
        return {
            refund_id: 'refund_' + Date.now(),
            order_id: orderId,
            amount: amount,
            currency: 'INR',
            status: 'PROCESSED',
            reason: reason,
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            metadata: {
                source: 'glo-coin-platform',
                test_refund: true
            }
        };
    }

    // Validate webhook signature (for production use)
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
