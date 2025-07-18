// JusPay Dashboard Integration via Webhook Simulation
const axios = require('axios');

class JusPayWebhookSender {
    constructor() {
        this.webhookUrl = process.env.WEBHOOK_URL || 'https://4fc85aa9398b.ngrok-free.app/api/payment/callback';
        this.merchantId = process.env.JUSPAY_MERCHANT_ID;
    }

    // Send order creation webhook to JusPay dashboard
    async sendOrderCreated(orderData) {
        try {
            console.log('Sending order created webhook to JusPay dashboard...');
            
            const webhookPayload = {
                event_name: 'order_created',
                order_id: orderData.order_id,
                merchant_id: this.merchantId,
                amount: orderData.amount,
                currency: orderData.currency,
                customer_id: orderData.customer_id,
                customer_email: orderData.customer_email,
                customer_phone: orderData.customer_phone,
                description: orderData.description,
                status: 'PENDING',
                created_at: new Date().toISOString(),
                metadata: {
                    source: 'glo-coin-platform',
                    type: 'PAYMENT'
                }
            };

            // This simulates JusPay sending a webhook to your system
            // In reality, JusPay would send this to your webhook URL
            console.log('Webhook payload for JusPay dashboard:', webhookPayload);
            
            // Also log this in a format that can be manually added to JusPay dashboard
            this.logForManualDashboard('ORDER_CREATED', webhookPayload);
            
            return { success: true, data: webhookPayload };
        } catch (error) {
            console.error('Error sending order created webhook:', error);
            return { success: false, error: error.message };
        }
    }

    // Send withdrawal webhook to JusPay dashboard
    async sendWithdrawalCreated(withdrawalData) {
        try {
            console.log('Sending withdrawal created webhook to JusPay dashboard...');
            
            const webhookPayload = {
                event_name: 'withdrawal_created',
                order_id: withdrawalData.order_id,
                merchant_id: this.merchantId,
                amount: withdrawalData.amount,
                currency: withdrawalData.currency,
                customer_id: withdrawalData.customer_id,
                description: `Withdrawal to ${withdrawalData.bank_name} - ${withdrawalData.account_holder}`,
                status: 'WITHDRAWAL_INITIATED',
                created_at: new Date().toISOString(),
                metadata: {
                    source: 'glo-coin-platform',
                    type: 'WITHDRAWAL',
                    bank_name: withdrawalData.bank_name,
                    account_holder: withdrawalData.account_holder,
                    bank_account: withdrawalData.bank_account
                }
            };

            console.log('Withdrawal webhook payload for JusPay dashboard:', webhookPayload);
            this.logForManualDashboard('WITHDRAWAL_CREATED', webhookPayload);
            
            return { success: true, data: webhookPayload };
        } catch (error) {
            console.error('Error sending withdrawal webhook:', error);
            return { success: false, error: error.message };
        }
    }

    // Send payment status update webhook
    async sendPaymentStatusUpdate(orderId, status, transactionData = {}) {
        try {
            console.log(`Sending payment status update webhook: ${orderId} -> ${status}`);
            
            const webhookPayload = {
                event_name: status === 'CHARGED' ? 'payment_captured' : 'payment_failed',
                order_id: orderId,
                merchant_id: this.merchantId,
                status: status,
                transaction_id: transactionData.transaction_id || `txn_${Date.now()}`,
                payment_method: transactionData.payment_method || 'TEST_CARD',
                gateway_reference_id: transactionData.gateway_reference_id || `gw_${Date.now()}`,
                updated_at: new Date().toISOString(),
                metadata: {
                    source: 'glo-coin-platform',
                    type: 'PAYMENT_UPDATE'
                }
            };

            console.log('Payment status webhook payload for JusPay dashboard:', webhookPayload);
            this.logForManualDashboard('PAYMENT_STATUS_UPDATE', webhookPayload);
            
            return { success: true, data: webhookPayload };
        } catch (error) {
            console.error('Error sending payment status webhook:', error);
            return { success: false, error: error.message };
        }
    }

    // Log data in format suitable for manual JusPay dashboard entry
    logForManualDashboard(eventType, payload) {
        console.log('\n=== JusPay Dashboard Manual Entry ===');
        console.log(`Event Type: ${eventType}`);
        console.log(`Order ID: ${payload.order_id}`);
        console.log(`Merchant ID: ${payload.merchant_id}`);
        console.log(`Amount: ${payload.amount} ${payload.currency}`);
        console.log(`Status: ${payload.status}`);
        console.log(`Description: ${payload.description || 'N/A'}`);
        console.log(`Customer ID: ${payload.customer_id || 'N/A'}`);
        console.log(`Timestamp: ${payload.created_at || payload.updated_at}`);
        console.log('=====================================\n');
    }
}

module.exports = JusPayWebhookSender;
