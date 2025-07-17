const axios = require('axios');
const crypto = require('crypto');

class JusPayService {
    constructor() {
        this.baseURL = process.env.JUSPAY_BASE_URL || 'https://sandbox.juspay.in';
        this.apiKey = process.env.JUSPAY_API_KEY;
        this.merchantId = process.env.JUSPAY_MERCHANT_ID;
        
        // Validate required configuration
        if (!this.apiKey || !this.merchantId) {
            console.warn('JusPay configuration missing. Please set JUSPAY_API_KEY and JUSPAY_MERCHANT_ID in .env file');
        }
        
        // Create axios instance with default config for Express Checkout API
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
                'version': '2018-10-25'
            }
        });

        // Add request interceptor for logging
        this.api.interceptors.request.use(
            (config) => {
                console.log(`🔵 JusPay Express Checkout API Request: ${config.method?.toUpperCase()} ${config.url}`);
                console.log('Request Data:', config.data);
                return config;
            },
            (error) => {
                console.error('Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.api.interceptors.response.use(
            (response) => {
                console.log(`🟢 JusPay Express Checkout API Response: ${response.status}`);
                console.log('Response Data:', response.data);
                return response;
            },
            (error) => {
                console.error('🔴 JusPay Express Checkout API Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    // Create Express Checkout Order
    async createOrder(orderData) {
        try {
            const payload = {
                order_id: orderData.order_id,
                amount: orderData.amount,
                currency: orderData.currency,
                customer_id: orderData.customer_id,
                customer_email: orderData.customer_email,
                customer_phone: orderData.customer_phone,
                product_id: orderData.product_id || 'default',
                description: orderData.description,
                return_url: orderData.return_url,
                metadata: {
                    ...orderData.metadata,
                    integration_type: 'express_checkout'
                }
            };

            console.log('Creating Express Checkout order with payload:', payload);

            const response = await this.api.post('/order/create', payload);
            
            return {
                order_id: response.data.order_id,
                payment_links: response.data.payment_links,
                sdk_payload: response.data.sdk_payload,
                status: response.data.status
            };
        } catch (error) {
            this.handleError('Failed to create Express Checkout order', error);
        }
    }

    // Create Express Checkout Session
    async createSession(sessionData) {
        try {
            const payload = {
                order_id: sessionData.order_id,
                amount: sessionData.amount,
                currency: sessionData.currency,
                customer_id: sessionData.customer_id,
                customer_email: sessionData.customer_email,
                customer_phone: sessionData.customer_phone,
                return_url: sessionData.return_url,
                options: {
                    get_client_auth_token: true,
                    get_sdk_payload: true
                }
            };

            const response = await this.api.post('/session', payload);
            
            return {
                session_id: response.data.session_id,
                order_id: response.data.order_id,
                payment_links: response.data.payment_links,
                sdk_payload: response.data.sdk_payload,
                client_auth_token: response.data.client_auth_token,
                status: response.data.status
            };
        } catch (error) {
            this.handleError('Failed to create Express Checkout session', error);
        }
    }

    // List Customer's Saved Payment Methods
    async listCustomerPaymentMethods(customerId) {
        try {
            const response = await this.api.get(`/customers/${customerId}/wallets`);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to list customer payment methods', error);
        }
    }

    // Create Customer Wallet (Save Payment Method)
    async createCustomerWallet(customerId, walletData) {
        try {
            const payload = {
                customer_id: customerId,
                ...walletData
            };

            const response = await this.api.post(`/customers/${customerId}/wallets`, payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to create customer wallet', error);
        }
    }

    // Process Express Checkout Payment
    async processExpressCheckoutPayment(sessionId, paymentDetails) {
        try {
            const payload = {
                payment_method: paymentDetails.payment_method,
                payment_method_type: paymentDetails.payment_method_type,
                card: paymentDetails.card && {
                    card_number: paymentDetails.card.card_number,
                    card_exp_month: paymentDetails.card.card_exp_month,
                    card_exp_year: paymentDetails.card.card_exp_year,
                    card_security_code: paymentDetails.card.card_security_code,
                    name_on_card: paymentDetails.card.name_on_card,
                    save_to_locker: paymentDetails.card.save_to_locker || false
                },
                wallet: paymentDetails.wallet && {
                    wallet_id: paymentDetails.wallet.wallet_id
                },
                netbanking: paymentDetails.netbanking && {
                    bank_id: paymentDetails.netbanking.bank_id
                },
                upi: paymentDetails.upi && {
                    vpa: paymentDetails.upi.vpa
                }
            };

            const response = await this.api.post(`/session/${sessionId}/pay`, payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to process Express Checkout payment', error);
        }
    }

    // Get Order Status (Express Checkout)
    async getOrderStatus(orderId) {
        try {
            const response = await this.api.get(`/orders/${orderId}`);
            
            return {
                order_id: response.data.order_id,
                status: response.data.status,
                amount: response.data.amount,
                currency: response.data.currency,
                payment_method: response.data.payment_method,
                payment_method_type: response.data.payment_method_type,
                txn_id: response.data.txn_id,
                gateway_reference_id: response.data.gateway_reference_id,
                created_ts: response.data.created_ts,
                last_updated_ts: response.data.last_updated_ts
            };
        } catch (error) {
            this.handleError('Failed to get order status', error);
        }
    }

    // Get Session Status (Express Checkout)
    async getSessionStatus(sessionId) {
        try {
            const response = await this.api.get(`/session/${sessionId}`);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to get session status', error);
        }
    }

    // Get Payment Methods (Express Checkout)
    async getPaymentMethods(currency = 'INR', amount = null, customerId = null) {
        try {
            const params = { 
                currency,
                ...(amount && { amount }),
                ...(customerId && { customer_id: customerId })
            };

            const response = await this.api.get('/payment_methods', { params });
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to get payment methods', error);
        }
    }

    // Verify payment status (backward compatibility)
    async verifyPayment(orderId, paymentId = null) {
        return this.getOrderStatus(orderId);
    }

    // Get payment status (alias for getOrderStatus for backward compatibility)
    async getPaymentStatus(orderId) {
        return this.getOrderStatus(orderId);
    }

    // Create Express Checkout Payment Link
    async createPaymentLink(linkData) {
        try {
            const payload = {
                order_id: linkData.order_id,
                amount: linkData.amount,
                currency: linkData.currency,
                customer_id: linkData.customer_id,
                customer_email: linkData.customer_email,
                customer_phone: linkData.customer_phone,
                description: linkData.description,
                expire_at: linkData.expire_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                send_sms: linkData.send_sms || false,
                send_email: linkData.send_email || false,
                return_url: linkData.return_url
            };

            const response = await this.api.post('/payment_links', payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to create Express Checkout payment link', error);
        }
    }

    // Refund Payment (Express Checkout)
    async refundPayment(orderId, amount = null, reason = null) {
        try {
            const payload = {
                order_id: orderId,
                amount: amount, // null for full refund
                reason: reason || 'Customer request',
                unique_request_id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            const response = await this.api.post('/refunds', payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to refund payment', error);
        }
    }

    // Get Refund Status (Express Checkout)
    async getRefundStatus(refundId) {
        try {
            const response = await this.api.get(`/refunds/${refundId}`);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to get refund status', error);
        }
    }

    // Capture Payment (for pre-auth transactions)
    async capturePayment(orderId, amount = null) {
        try {
            const payload = {
                order_id: orderId,
                amount: amount
            };

            const response = await this.api.post('/payments/capture', payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to capture payment', error);
        }
    }

    // Cancel/Void Payment (for pre-auth transactions)
    async voidPayment(orderId) {
        try {
            const payload = {
                order_id: orderId
            };

            const response = await this.api.post('/payments/void', payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to void payment', error);
        }
    }

    // Handle webhooks/callbacks (JusPay specific)
    async handleWebhook(webhookData, signature = null) {
        try {
            // JusPay webhook signature verification using API key
            if (signature && !this.verifyJusPayWebhookSignature(webhookData, signature)) {
                throw new Error('Invalid JusPay webhook signature');
            }

            return {
                order_id: webhookData.order_id,
                payment_id: webhookData.payment_id,
                status: webhookData.status,
                amount: webhookData.amount,
                currency: webhookData.currency,
                payment_method: webhookData.payment_method,
                payment_method_type: webhookData.payment_method_type,
                txn_id: webhookData.txn_id,
                gateway_reference_id: webhookData.gateway_reference_id,
                event_type: webhookData.event_type,
                created_ts: webhookData.created_ts,
                last_updated_ts: webhookData.last_updated_ts
            };
        } catch (error) {
            this.handleError('Failed to handle webhook', error);
        }
    }

    // Verify JusPay webhook signature using API key (HMAC-SHA256)
    verifyJusPayWebhookSignature(data, signature) {
        if (!this.apiKey) {
            console.warn('API key not configured - skipping webhook signature verification');
            return false;
        }
        
        try {
            // JusPay sends the raw payload for signature verification
            const payload = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Create HMAC using API key as secret
            const computedSignature = crypto
                .createHmac('sha256', this.apiKey)
                .update(payload, 'utf8')
                .digest('hex');
            
            // JusPay signature format: typically sent as hex string
            const receivedSignature = signature.replace(/^sha256=/, ''); // Remove prefix if present
            
            // Constant-time comparison to prevent timing attacks
            return crypto.timingSafeEqual(
                Buffer.from(computedSignature, 'hex'),
                Buffer.from(receivedSignature, 'hex')
            );
        } catch (error) {
            console.error('Error verifying JusPay webhook signature:', error);
            return false;
        }
    }

    // Legacy method for backward compatibility
    verifyWebhookSignature(data, signature) {
        return this.verifyJusPayWebhookSignature(data, signature);
    }

    // Refund payment
    async refundPayment(paymentId, amount = null, reason = null) {
        try {
            const payload = {
                payment_id: paymentId,
                amount: amount, // null for full refund
                reason: reason || 'Customer request'
            };

            const response = await this.api.post('/refunds', payload);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to refund payment', error);
        }
    }

    // Get refund status
    async getRefundStatus(refundId) {
        try {
            const response = await this.api.get(`/refunds/${refundId}`);
            
            return response.data;
        } catch (error) {
            this.handleError('Failed to get refund status', error);
        }
    }

    // Error handler
    handleError(message, error) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error || error.message;
        const statusCode = error.response?.status;
        
        console.error(`${message}:`, {
            status: statusCode,
            message: errorMessage,
            details: errorData
        });
        
        throw new Error(`${message}: ${errorMessage}`);
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.api.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

// Export singleton instance
module.exports = new JusPayService();
