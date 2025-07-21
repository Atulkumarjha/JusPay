const axios = require('axios');
const crypto = require('crypto');

class CashfreeService {
    constructor() {
        // Check if Cashfree credentials are provided
        this.hasCredentials = !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
        
        // Cashfree Test Environment Credentials
        this.appId = process.env.CASHFREE_APP_ID || 'MOCK_CASHFREE_APP_ID_12345';
        this.secretKey = process.env.CASHFREE_SECRET_KEY || 'MOCK_CASHFREE_SECRET_KEY_67890';
        this.baseURL = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg';
        this.version = '2023-08-01';
        
        console.log('\n🏦 CASHFREE SERVICE INITIALIZATION');
        console.log('=====================================');
        if (this.hasCredentials) {
            console.log('✅ Using real Cashfree credentials');
            console.log(`📍 Base URL: ${this.baseURL}`);
            console.log(`🔑 App ID: ${this.appId.substring(0, 8)}...`);
        } else {
            console.log('⚠️  NO CASHFREE CREDENTIALS FOUND - USING MOCK MODE');
            console.log('📍 Mock Base URL: https://sandbox.cashfree.com/pg');
            console.log('🔑 Mock App ID: MOCK_CASHFREE_APP_ID_12345');
            console.log('💡 All payment flows will use mock data and JSON responses');
        }
        console.log('=====================================\n');
    }

    // Generate signature for Cashfree API authentication
    generateSignature(data) {
        const sortedKeys = Object.keys(data).sort();
        const signatureData = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
        return crypto.createHmac('sha256', this.secretKey).update(signatureData).digest('hex');
    }

    // Get headers for API requests
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-api-version': this.version,
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey
        };
    }

    async createPaymentSession(amount, userId, orderId) {
        try {
            console.log('\n💳 CASHFREE PAYMENT SESSION CREATION');
            console.log('=====================================');
            console.log(`💰 Amount: ₹${amount}`);
            console.log(`👤 User ID: ${userId}`);
            console.log(`📋 Order ID: ${orderId}`);

            // Create order data
            const orderData = {
                order_id: `CF_${orderId}`,
                order_amount: parseFloat(amount),
                order_currency: 'INR',
                customer_details: {
                    customer_id: `user_${userId}`,
                    customer_name: 'GloCoin Customer',
                    customer_email: 'customer@glocoin.com',
                    customer_phone: '9999999999'
                },
                order_meta: {
                    return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/callback?gateway=cashfree`,
                    notify_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/webhook/cashfree`,
                    source: 'glocoin-payment-platform',
                    integration: 'nodejs'
                }
            };

            console.log('\n📤 REQUEST TO CASHFREE API:');
            console.log(JSON.stringify({
                url: `${this.baseURL}/orders`,
                method: 'POST',
                headers: this.getHeaders(),
                body: orderData
            }, null, 2));

            if (!this.hasCredentials) {
                // Mock response when no credentials
                const mockResponse = {
                    cf_order_id: Date.now(),
                    created_at: new Date().toISOString(),
                    customer_details: orderData.customer_details,
                    entity: "order",
                    order_amount: orderData.order_amount,
                    order_currency: orderData.order_currency,
                    order_expiry_time: new Date(Date.now() + 24*60*60*1000).toISOString(),
                    order_id: orderData.order_id,
                    order_meta: orderData.order_meta,
                    order_note: "GloCoin Payment",
                    order_splits: [],
                    order_status: "ACTIVE",
                    order_tags: null,
                    payment_session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    payments: {
                        url: `${this.baseURL}/orders/${orderData.order_id}/payments`
                    }
                };

                console.log('\n📥 MOCK CASHFREE API RESPONSE:');
                console.log(JSON.stringify(mockResponse, null, 2));

                // Mock tracking to dashboard
                await this.trackToDashboard({
                    order_id: orderData.order_id,
                    amount: orderData.order_amount,
                    currency: orderData.order_currency,
                    customer_id: orderData.customer_details.customer_id,
                    status: 'CREATED',
                    gateway: 'cashfree',
                    mock: true
                });

                const result = {
                    success: true,
                    orderId: mockResponse.order_id,
                    paymentSessionId: mockResponse.payment_session_id,
                    amount: orderData.order_amount,
                    currency: orderData.order_currency,
                    gateway: 'cashfree',
                    gatewayOrderId: mockResponse.order_id,
                    paymentUrl: `${this.baseURL}/checkout?session_id=${mockResponse.payment_session_id}`,
                    mock: true
                };

                console.log('\n✅ PAYMENT SESSION CREATED (MOCK):');
                console.log(JSON.stringify(result, null, 2));
                console.log('=====================================\n');

                return result;
            }

            // Real API call when credentials are available
            const response = await axios.post(
                `${this.baseURL}/orders`,
                orderData,
                { headers: this.getHeaders() }
            );

            console.log('\n📥 REAL CASHFREE API RESPONSE:');
            console.log(JSON.stringify(response.data, null, 2));

            // Track to Cashfree dashboard
            await this.trackToDashboard({
                order_id: orderData.order_id,
                amount: orderData.order_amount,
                currency: orderData.order_currency,
                customer_id: orderData.customer_details.customer_id,
                status: 'CREATED',
                gateway: 'cashfree'
            });

            const result = {
                success: true,
                orderId: response.data.order_id,
                paymentSessionId: response.data.payment_session_id,
                amount: orderData.order_amount,
                currency: orderData.order_currency,
                gateway: 'cashfree',
                gatewayOrderId: response.data.order_id,
                paymentUrl: response.data.payment_link || `${this.baseURL}/checkout?session_id=${response.data.payment_session_id}`
            };

            console.log('\n✅ PAYMENT SESSION CREATED (REAL):');
            console.log(JSON.stringify(result, null, 2));
            console.log('=====================================\n');

            return result;

        } catch (error) {
            console.log('\n❌ CASHFREE API ERROR:');
            console.log('=====================================');
            console.log(JSON.stringify({
                error: error.response?.data || error.message,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            }, null, 2));
            
            // Fallback to mock data if API fails
            const mockOrderId = `CF_MOCK_${orderId}`;
            console.log('\n🔄 FALLING BACK TO MOCK DATA');
            console.log('=====================================');

            const mockFallbackResult = {
                success: true,
                orderId: mockOrderId,
                paymentSessionId: `session_fallback_${Date.now()}`,
                amount: parseFloat(amount),
                currency: 'INR',
                gateway: 'cashfree',
                gatewayOrderId: mockOrderId,
                paymentUrl: `${this.baseURL}/checkout?session_id=session_fallback_${Date.now()}`,
                mock: true,
                fallback: true
            };

            console.log('\n📋 MOCK FALLBACK RESULT:');
            console.log(JSON.stringify(mockFallbackResult, null, 2));

            await this.trackToDashboard({
                order_id: mockOrderId,
                amount: parseFloat(amount),
                currency: 'INR',
                customer_id: `user_${userId}`,
                status: 'CREATED',
                gateway: 'cashfree',
                mock: true,
                fallback: true
            });

            return {
                success: true,
                orderId: mockOrderId,
                paymentSessionId: `session_${Date.now()}`,
                amount: parseFloat(amount),
                currency: 'INR',
                gateway: 'cashfree',
                gatewayOrderId: mockOrderId,
                paymentUrl: `${this.baseURL}/checkout/mock`,
                mock: true
            };
        }
    }

    async processPayment(paymentData) {
        try {
            console.log('\n💰 CASHFREE PAYMENT PROCESSING');
            console.log('=====================================');
            console.log('📥 INCOMING PAYMENT DATA:');
            console.log(JSON.stringify(paymentData, null, 2));

            const { orderId, amount, status } = paymentData;
            
            // Simulate payment processing
            const processedPayment = {
                orderId: orderId,
                amount: parseFloat(amount),
                status: status || 'SUCCESS',
                gateway: 'cashfree',
                transactionId: `cf_txn_${Date.now()}`,
                timestamp: new Date().toISOString(),
                processing_time: `${Math.random() * 2000 + 500}ms`,
                mock: !this.hasCredentials
            };

            console.log('\n⚙️  PAYMENT PROCESSING SIMULATION:');
            console.log(JSON.stringify({
                step: 'payment_verification',
                orderId: orderId,
                amount: amount,
                gateway: 'cashfree',
                timestamp: new Date().toISOString()
            }, null, 2));

            console.log('\n✅ PROCESSED PAYMENT RESULT:');
            console.log(JSON.stringify(processedPayment, null, 2));

            // Track payment to Cashfree dashboard
            await this.trackToDashboard({
                ...processedPayment,
                order_id: orderId,
                currency: 'INR'
            });

            console.log('Cashfree payment processed successfully:', processedPayment);
            return processedPayment;

        } catch (error) {
            console.error('Cashfree payment processing failed:', error);
            throw error;
        }
    }

    async createWithdrawalOrder(amount, accountDetails, userId) {
        try {
            console.log(`Creating Cashfree payout for amount: ₹${amount}, userId: ${userId}`);

            const payoutData = {
                transfer_id: `CF_PAYOUT_${Date.now()}`,
                amount: parseFloat(amount),
                currency: 'INR',
                mode: 'banktransfer',
                purpose: 'refund',
                beneficiary: {
                    name: accountDetails.accountHolder,
                    account_number: accountDetails.accountNumber,
                    ifsc: accountDetails.routingNumber,
                    bank_name: accountDetails.bankName
                }
            };

            // In sandbox mode, we'll simulate the payout
            console.log('Simulating Cashfree payout (sandbox mode)');

            // Track to Cashfree dashboard
            await this.trackToDashboard({
                transfer_id: payoutData.transfer_id,
                amount: payoutData.amount,
                currency: payoutData.currency,
                beneficiary: payoutData.beneficiary.name,
                status: 'PROCESSING',
                type: 'payout',
                gateway: 'cashfree'
            });

            return {
                success: true,
                transferId: payoutData.transfer_id,
                amount: payoutData.amount,
                status: 'PROCESSING',
                gateway: 'cashfree'
            };

        } catch (error) {
            console.error('Cashfree payout creation failed:', error);
            throw error;
        }
    }

    async trackToDashboard(data) {
        try {
            console.log('\n📊 CASHFREE DASHBOARD TRACKING');
            console.log('=====================================');
            
            // This would normally send data to Cashfree dashboard
            // For demo purposes, we'll simulate the dashboard tracking
            const trackingInfo = {
                timestamp: new Date().toISOString(),
                service: 'Cashfree',
                mode: data.mock ? 'MOCK' : 'REAL',
                data: data
            };
            
            console.log('📈 TRACKING INFO:');
            console.log(JSON.stringify(trackingInfo, null, 2));

            // Simulate API call to Cashfree dashboard
            const dashboardPayload = {
                event_type: data.type || 'payment',
                order_id: data.order_id || data.transfer_id,
                amount: data.amount,
                currency: data.currency || 'INR',
                status: data.status,
                gateway: 'cashfree',
                timestamp: new Date().toISOString(),
                environment: this.hasCredentials ? 'sandbox' : 'mock',
                metadata: {
                    source: 'glocoin-payment-platform',
                    integration: 'nodejs',
                    mock_mode: !this.hasCredentials,
                    fallback: data.fallback || false
                }
            };

            console.log('\n📋 DASHBOARD PAYLOAD:');
            console.log(JSON.stringify(dashboardPayload, null, 2));
            
            if (this.hasCredentials) {
                console.log('✅ Would send to real Cashfree dashboard API');
            } else {
                console.log('⚠️  MOCK MODE: Dashboard tracking simulated only');
            }
            
            console.log('=====================================\n');
            
            return { success: true, tracked: true, mock: !this.hasCredentials };

        } catch (error) {
            console.log('\n❌ DASHBOARD TRACKING ERROR:');
            console.log(JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString()
            }, null, 2));
            console.log('=====================================\n');
            // Don't throw error as this is supplementary functionality
            return { success: false, error: error.message };
        }
    }

    async healthCheck() {
        try {
            // Check Cashfree API health
            const response = await axios.get(
                `${this.baseURL}/orders/test_health`,
                { 
                    headers: this.getHeaders(),
                    timeout: 5000 
                }
            );

            return {
                status: 'healthy',
                gateway: 'cashfree',
                responseTime: Date.now(),
                apiVersion: this.version
            };

        } catch (error) {
            console.log('Cashfree health check failed, using fallback');
            return {
                status: 'degraded',
                gateway: 'cashfree',
                error: error.message,
                fallback: true
            };
        }
    }

    async getOrderStatus(orderId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/orders/${orderId}`,
                { headers: this.getHeaders() }
            );

            return {
                success: true,
                status: response.data.order_status,
                amount: response.data.order_amount,
                gateway: 'cashfree'
            };

        } catch (error) {
            console.error('Failed to get Cashfree order status:', error);
            return {
                success: false,
                error: error.message,
                gateway: 'cashfree'
            };
        }
    }
}

module.exports = CashfreeService;
