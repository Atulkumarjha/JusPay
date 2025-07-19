const JusPayService = require('./JusPayService');
const RazorpayService = require('./RazorpayService');

class PaymentGatewayManager {
    constructor() {
        this.gateways = {
            juspay: new JusPayService(),
            razorpay: new RazorpayService()
        };
        
        // Default gateway (can be changed by super admin)
        this.activeGateway = process.env.ACTIVE_PAYMENT_GATEWAY || 'juspay';
        
        console.log('Payment Gateway Manager initialized with active gateway:', this.activeGateway);
    }

    // Get current active gateway instance
    getActiveGateway() {
        return this.gateways[this.activeGateway];
    }

    // Get gateway name
    getActiveGatewayName() {
        return this.activeGateway;
    }

    // Switch payment gateway (super admin only)
    switchGateway(gatewayName) {
        if (!this.gateways[gatewayName]) {
            throw new Error(`Invalid gateway: ${gatewayName}. Available gateways: ${Object.keys(this.gateways).join(', ')}`);
        }
        
        const previousGateway = this.activeGateway;
        this.activeGateway = gatewayName;
        
        console.log(`Payment gateway switched from ${previousGateway} to ${gatewayName}`);
        return {
            success: true,
            previous: previousGateway,
            current: gatewayName,
            timestamp: new Date().toISOString()
        };
    }

    // Get all available gateways
    getAvailableGateways() {
        return {
            current: this.activeGateway,
            available: Object.keys(this.gateways).map(name => ({
                name: name,
                displayName: name.charAt(0).toUpperCase() + name.slice(1),
                active: name === this.activeGateway
            }))
        };
    }

    // Proxy methods to active gateway
    async createPaymentSession(orderData) {
        const gateway = this.getActiveGateway();
        const result = await gateway.createPaymentSession(orderData);
        
        // Add gateway information to the result
        result.gateway = this.activeGateway;
        result.gateway_display_name = this.activeGateway.charAt(0).toUpperCase() + this.activeGateway.slice(1);
        
        return result;
    }

    async createWithdrawalOrder(withdrawalData) {
        const gateway = this.getActiveGateway();
        const result = await gateway.createWithdrawalOrder(withdrawalData);
        
        // Add gateway information
        result.gateway = this.activeGateway;
        
        return result;
    }

    async processPayment(orderId, paymentData) {
        const gateway = this.getActiveGateway();
        const result = await gateway.processPayment(orderId, paymentData);
        
        // Add gateway information
        result.gateway = this.activeGateway;
        
        return result;
    }

    validateWebhookSignature(payload, signature) {
        const gateway = this.getActiveGateway();
        return gateway.validateWebhookSignature(payload, signature);
    }

    // Generate order data using active gateway
    generateOrderData(amount, currency = 'INR') {
        const gateway = this.getActiveGateway();
        const orderData = gateway.generateOrderData(amount, currency);
        
        // Add gateway prefix to order ID for tracking
        orderData.order_id = `${this.activeGateway.toUpperCase()}_${orderData.order_id}`;
        
        return orderData;
    }

    // Get gateway-specific configuration for frontend
    getGatewayConfig() {
        const config = {
            gateway: this.activeGateway,
            name: this.activeGateway.charAt(0).toUpperCase() + this.activeGateway.slice(1)
        };

        if (this.activeGateway === 'juspay') {
            config.merchantId = process.env.JUSPAY_MERCHANT_ID;
            config.baseUrl = process.env.JUSPAY_BASE_URL;
            config.type = 'juspay';
        } else if (this.activeGateway === 'razorpay') {
            config.keyId = process.env.RAZORPAY_KEY_ID;
            config.type = 'razorpay';
        }

        return config;
    }

    // Health check for all gateways
    async healthCheck() {
        const results = {};
        
        for (const [name, gateway] of Object.entries(this.gateways)) {
            try {
                // Check if gateway is properly configured
                if (name === 'juspay') {
                    results[name] = {
                        status: gateway.merchantId && gateway.apiKey ? 'healthy' : 'misconfigured',
                        merchantId: gateway.merchantId ? 'configured' : 'missing',
                        apiKey: gateway.apiKey ? 'configured' : 'missing',
                        active: name === this.activeGateway
                    };
                } else if (name === 'razorpay') {
                    results[name] = {
                        status: gateway.keyId && gateway.keySecret ? 'healthy' : 'misconfigured',
                        keyId: gateway.keyId ? 'configured' : 'missing',
                        keySecret: gateway.keySecret ? 'configured' : 'missing',
                        active: name === this.activeGateway
                    };
                }
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message,
                    active: name === this.activeGateway
                };
            }
        }
        
        return {
            activeGateway: this.activeGateway,
            gateways: results,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = PaymentGatewayManager;
