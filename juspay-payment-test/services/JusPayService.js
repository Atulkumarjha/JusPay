const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class JusPayService {
    constructor() {
        this.merchantId = process.env.JUSPAY_MERCHANT_ID;
        this.apiKey = process.env.JUSPAY_API_KEY;
        this.baseUrl = process.env.JUSPAY_BASE_URL;
        this.enableDashboardTracking = process.env.ENABLE_DASHBOARD_TRACKING === 'true';
        
        this.api = axios.create({
            baseURL: this.baseUrl,
            auth: {
                username: this.apiKey,
                password: ''
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

    generateOrderData(amount, currency = 'INR') {
        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const customerId = process.env.MOCK_CUSTOMER_ID || 'customer_' + Date.now();
        
        return {
            order_id: orderId,
            customer_id: customerId,
            amount: amount * 100,
            currency: currency,
            customer_email: process.env.MOCK_CUSTOMER_EMAIL || 'test@example.com',
            customer_phone: process.env.MOCK_CUSTOMER_PHONE || '+91 9999999999',
            return_url: process.env.WEBHOOK_URL || 'https://example.com/return',
            description: `Glo Coin Purchase - ${amount} ${currency}`,
            metadata: {
                source: 'glo-coin-platform',
                version: '1.0.0',
                type: 'payment'
            }
        };
    }

    async createPaymentSession(orderData) {
        try {
            if (this.enableDashboardTracking) {
                console.log('Creating JusPay order for dashboard tracking...');
                await this.createJusPayOrder(orderData);
            }

            console.log('Using mock data for payment session');
            return this.generateMockPaymentSession(orderData);
        } catch (error) {
            console.error('JusPay API Error:', error.response?.data || error.message);
            throw new Error(`Payment session creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async createJusPayOrder(orderData) {
        try {
            console.log('Creating JusPay order:', orderData.order_id);
            
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

    async createWithdrawalOrder(withdrawalData) {
        try {
            console.log('Creating JusPay withdrawal order:', withdrawalData.order_id);
            
            const response = await this.api.post('/orders', new URLSearchParams({
                order_id: withdrawalData.order_id,
                amount: withdrawalData.amount,
                currency: withdrawalData.currency,
                customer_id: withdrawalData.customer_id,
                customer_email: withdrawalData.customer_email || 'customer@example.com',
                customer_phone: withdrawalData.customer_phone || '+91 9999999999',
                description: withdrawalData.description,
                merchant_id: this.merchantId,
                return_url: withdrawalData.return_url || 'https://your-domain.com/withdrawal/success'
            }));

            console.log('JusPay withdrawal order created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('JusPay Withdrawal Order Creation Error:', error.response?.data || error.message);
            throw new Error(`Withdrawal order creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

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
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            metadata: orderData.metadata
        };
    }

    async processPayment(orderId, paymentData) {
        try {
            const success = paymentData.status === 'success';
            
            return {
                success: success,
                order_id: orderId,
                transaction_id: 'txn_' + Date.now(),
                payment_method: 'CARD',
                gateway_reference_id: 'gtw_' + Date.now(),
                amount: paymentData.amount || 0,
                currency: 'INR',
                status: success ? 'CHARGED' : 'FAILED',
                message: success ? 'Payment successful' : 'Payment failed',
                processed_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Payment processing error:', error.message);
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }

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
