const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const juspayService = require('../utils/juspay');

// Create Express Checkout order
router.post('/create', async (req, res) => {
    try {
        const { amount, currency, customer_id, customer_email, customer_phone, product_id } = req.body;

        // Validate required fields
        if (!amount || !currency) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['amount', 'currency']
            });
        }

        // Generate unique order ID
        const order_id = `order_${Date.now()}_${uuidv4().split('-')[0]}`;

        // Create Express Checkout order with JusPay
        const orderData = {
            order_id,
            amount: parseFloat(amount),
            currency: currency || 'INR',
            customer_id: customer_id || `customer_${uuidv4()}`,
            customer_email,
            customer_phone,
            product_id: product_id || 'default_product',
            return_url: `${req.protocol}://${req.get('host')}/payment/callback`,
            description: 'Express Checkout payment via JusPay Gateway',
            metadata: {
                created_at: new Date().toISOString(),
                source: 'test-environment',
                integration_type: 'express_checkout'
            }
        };

        console.log('Creating Express Checkout order:', orderData);

        const response = await juspayService.createOrder(orderData);

        res.json({
            success: true,
            data: response,
            order_id,
            message: 'Express Checkout order created successfully'
        });

    } catch (error) {
        console.error('Express Checkout order creation error:', error);
        res.status(500).json({
            error: 'Failed to create Express Checkout order',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Create Express Checkout session
router.post('/session', async (req, res) => {
    try {
        const { amount, currency, customer_id, customer_email, customer_phone, order_id } = req.body;

        // Validate required fields
        if (!amount || !currency) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['amount', 'currency']
            });
        }

        // Use provided order_id or generate new one
        const orderId = order_id || `session_${Date.now()}_${uuidv4().split('-')[0]}`;

        const sessionData = {
            order_id: orderId,
            amount: parseFloat(amount),
            currency: currency || 'INR',
            customer_id: customer_id || `customer_${uuidv4()}`,
            customer_email,
            customer_phone,
            return_url: `${req.protocol}://${req.get('host')}/payment/callback`
        };

        console.log('Creating Express Checkout session:', sessionData);

        const response = await juspayService.createSession(sessionData);

        res.json({
            success: true,
            data: response,
            order_id: orderId,
            message: 'Express Checkout session created successfully'
        });

    } catch (error) {
        console.error('Express Checkout session creation error:', error);
        res.status(500).json({
            error: 'Failed to create Express Checkout session',
            message: error.message
        });
    }
});

// Process Express Checkout payment
router.post('/process', async (req, res) => {
    try {
        const { session_id, payment_details } = req.body;

        if (!session_id || !payment_details) {
            return res.status(400).json({
                error: 'Session ID and payment details are required'
            });
        }

        console.log('Processing Express Checkout payment:', { session_id, payment_method: payment_details.payment_method });

        const response = await juspayService.processExpressCheckoutPayment(session_id, payment_details);

        res.json({
            success: true,
            data: response,
            message: 'Express Checkout payment processed successfully'
        });

    } catch (error) {
        console.error('Express Checkout payment processing error:', error);
        res.status(500).json({
            error: 'Failed to process Express Checkout payment',
            message: error.message
        });
    }
});

// Get customer payment methods (saved cards/wallets)
router.get('/customer/:customer_id/methods', async (req, res) => {
    try {
        const { customer_id } = req.params;

        console.log('Getting customer payment methods:', customer_id);

        const response = await juspayService.listCustomerPaymentMethods(customer_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Get customer payment methods error:', error);
        res.status(500).json({
            error: 'Failed to get customer payment methods',
            message: error.message
        });
    }
});

// Save customer payment method
router.post('/customer/:customer_id/wallet', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const walletData = req.body;

        console.log('Creating customer wallet:', { customer_id, walletData });

        const response = await juspayService.createCustomerWallet(customer_id, walletData);

        res.json({
            success: true,
            data: response,
            message: 'Customer wallet created successfully'
        });

    } catch (error) {
        console.error('Create customer wallet error:', error);
        res.status(500).json({
            error: 'Failed to create customer wallet',
            message: error.message
        });
    }
});

// Get payment methods
router.get('/methods', async (req, res) => {
    try {
        const { currency, amount, customer_id } = req.query;

        console.log('Getting payment methods:', { currency, amount, customer_id });

        const response = await juspayService.getPaymentMethods(currency, amount, customer_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({
            error: 'Failed to get payment methods',
            message: error.message
        });
    }
});

// Get order status
router.get('/order/:order_id', async (req, res) => {
    try {
        const { order_id } = req.params;

        console.log('Getting order status for:', order_id);

        const response = await juspayService.getOrderStatus(order_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Order status error:', error);
        res.status(500).json({
            error: 'Failed to get order status',
            message: error.message
        });
    }
});

// Get session status
router.get('/session/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;

        console.log('Getting session status for:', session_id);

        const response = await juspayService.getSessionStatus(session_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Session status error:', error);
        res.status(500).json({
            error: 'Failed to get session status',
            message: error.message
        });
    }
});

// Verify payment
router.post('/verify', async (req, res) => {
    try {
        const { order_id, payment_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                error: 'Order ID is required'
            });
        }

        console.log('Verifying payment:', { order_id, payment_id });

        const response = await juspayService.verifyPayment(order_id, payment_id);

        res.json({
            success: true,
            data: response,
            message: 'Payment verification completed'
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            error: 'Failed to verify payment',
            message: error.message
        });
    }
});

// Get payment status
router.get('/status/:order_id', async (req, res) => {
    try {
        const { order_id } = req.params;

        console.log('Getting payment status for:', order_id);

        const response = await juspayService.getPaymentStatus(order_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({
            error: 'Failed to get payment status',
            message: error.message
        });
    }
});

// Create payment link
router.post('/link', async (req, res) => {
    try {
        const { amount, currency, customer_id, customer_email, customer_phone, expire_in_hours } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['amount', 'currency']
            });
        }

        const order_id = `link_${Date.now()}_${uuidv4().split('-')[0]}`;

        const linkData = {
            order_id,
            amount: parseFloat(amount),
            currency,
            customer_id: customer_id || `customer_${uuidv4()}`,
            customer_email,
            customer_phone,
            expire_in_hours: expire_in_hours || 24,
            description: 'Payment link via JusPay'
        };

        console.log('Creating payment link:', linkData);

        const response = await juspayService.createPaymentLink(linkData);

        res.json({
            success: true,
            data: response,
            order_id
        });

    } catch (error) {
        console.error('Payment link creation error:', error);
        res.status(500).json({
            error: 'Failed to create payment link',
            message: error.message
        });
    }
});

// Handle refunds
router.post('/refund', async (req, res) => {
    try {
        const { order_id, amount, reason } = req.body;

        if (!order_id) {
            return res.status(400).json({
                error: 'Order ID is required'
            });
        }

        console.log('Processing refund:', { order_id, amount, reason });

        const response = await juspayService.refundPayment(order_id, amount, reason);

        res.json({
            success: true,
            data: response,
            message: 'Refund initiated successfully'
        });

    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            error: 'Failed to process refund',
            message: error.message
        });
    }
});

// Capture payment (for pre-auth)
router.post('/capture', async (req, res) => {
    try {
        const { order_id, amount } = req.body;

        if (!order_id) {
            return res.status(400).json({
                error: 'Order ID is required'
            });
        }

        console.log('Capturing payment:', { order_id, amount });

        const response = await juspayService.capturePayment(order_id, amount);

        res.json({
            success: true,
            data: response,
            message: 'Payment captured successfully'
        });

    } catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({
            error: 'Failed to capture payment',
            message: error.message
        });
    }
});

// Void payment (for pre-auth)
router.post('/void', async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                error: 'Order ID is required'
            });
        }

        console.log('Voiding payment:', { order_id });

        const response = await juspayService.voidPayment(order_id);

        res.json({
            success: true,
            data: response,
            message: 'Payment voided successfully'
        });

    } catch (error) {
        console.error('Void error:', error);
        res.status(500).json({
            error: 'Failed to void payment',
            message: error.message
        });
    }
});

// Get refund status
router.get('/refund/:refund_id', async (req, res) => {
    try {
        const { refund_id } = req.params;

        console.log('Getting refund status for:', refund_id);

        const response = await juspayService.getRefundStatus(refund_id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Refund status error:', error);
        res.status(500).json({
            error: 'Failed to get refund status',
            message: error.message
        });
    }
});

// Payment callback (webhook) - JusPay specific
router.post('/callback', async (req, res) => {
    try {
        console.log('JusPay webhook received:', req.body);
        console.log('Headers:', req.headers);

        // JusPay typically sends signature in these headers (check JusPay docs for exact header name)
        const signature = req.headers['x-juspay-signature'] || 
                         req.headers['juspay-signature'] || 
                         req.headers['signature'];
        
        console.log('Webhook signature:', signature);
        
        // Handle webhook with signature verification using API key
        const webhookData = await juspayService.handleWebhook(req.body, signature);

        // Process the webhook data based on event type
        console.log('Processed JusPay webhook data:', webhookData);

        // Add your business logic here based on the webhook event
        switch (webhookData.status) {
            case 'CHARGED':
                console.log('✅ Payment successful:', webhookData.order_id);
                // Update order status, send confirmation emails, etc.
                break;
            case 'FAILED':
                console.log('❌ Payment failed:', webhookData.order_id);
                // Handle failed payment, update order status, etc.
                break;
            case 'PENDING':
                console.log('⏳ Payment pending:', webhookData.order_id);
                // Handle pending payment status
                break;
            default:
                console.log('🔄 Payment status update:', webhookData.status, webhookData.order_id);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'JusPay webhook processed successfully',
            order_id: webhookData.order_id
        });

    } catch (error) {
        console.error('JusPay webhook processing error:', error);
        
        // Still return 200 to prevent JusPay from retrying invalid webhooks
        // Log the error for investigation
        res.status(200).json({
            success: false,
            error: 'Webhook processing failed',
            message: error.message
        });
    }
});

// Health check for JusPay service
router.get('/health', async (req, res) => {
    try {
        const health = await juspayService.healthCheck();
        
        res.json({
            success: true,
            service: 'JusPay Payment Gateway',
            status: health.status || 'unknown',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'JusPay Payment Gateway',
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
