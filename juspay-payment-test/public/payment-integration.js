// Payment Gateway Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentIntegration();
});

function initializePaymentIntegration() {
    // Modal elements
    const paymentModal = document.getElementById('paymentModal');
    const orderModal = document.getElementById('orderModal');
    const closePaymentModal = document.getElementById('closePaymentModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    
    // Modal event listeners
    if (closePaymentModal) {
        closePaymentModal.onclick = () => paymentModal.style.display = 'none';
    }
    
    if (closeOrderModal) {
        closeOrderModal.onclick = () => orderModal.style.display = 'none';
    }
    
    window.onclick = (event) => {
        if (event.target == paymentModal) paymentModal.style.display = 'none';
        if (event.target == orderModal) orderModal.style.display = 'none';
    };
    
    // View order history
    if (viewOrdersBtn) {
        viewOrdersBtn.onclick = async () => {
            try {
                const response = await fetch('/payment/orders');
                const data = await response.json();
                
                if (data.success) {
                    const historyDiv = document.getElementById('orderHistory');
                    historyDiv.innerHTML = '';
                    
                    if (data.orders.length === 0) {
                        historyDiv.innerHTML = '<p>No orders found.</p>';
                    } else {
                        data.orders.forEach(order => {
                            const item = document.createElement('div');
                            item.className = 'transaction-item';
                            
                            // Determine gateway from order ID
                            let gateway = 'Unknown';
                            if (order.order_id.startsWith('JUSPAY_')) {
                                gateway = 'JusPay';
                            } else if (order.order_id.startsWith('RAZORPAY_')) {
                                gateway = 'Razorpay';
                            }
                            
                            item.innerHTML = `
                                <div class="transaction-details">
                                    <h4>Order #${order.order_id}</h4>
                                    <p>Amount: ₹${order.amount}</p>
                                    <p>Gateway: <strong>${gateway}</strong></p>
                                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                                    <p>Status: <span class="status-${order.status}">${order.status}</span></p>
                                </div>
                            `;
                            historyDiv.appendChild(item);
                        });
                    }
                    
                    orderModal.style.display = 'block';
                } else {
                    alert('Error loading order history');
                }
            } catch (error) {
                console.error('Error loading order history:', error);
                alert('Error loading order history');
            }
        };
    }
    
    // Payment form handling
    const juspayForm = document.getElementById('juspayPaymentForm');
    if (juspayForm) {
        juspayForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = document.getElementById('juspayAmount').value;
            const btn = document.getElementById('juspayBtn');
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/payment/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        currency: 'INR'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show payment modal with gateway information
                    document.getElementById('paymentOrderId').textContent = data.order.order_id;
                    document.getElementById('paymentAmount').textContent = data.order.amount;
                    document.getElementById('paymentStatus').textContent = 'Pending';
                    document.getElementById('paymentStatus').className = 'status-pending';
                    
                    // Update gateway display
                    const gatewayDisplay = document.getElementById('paymentGateway');
                    if (gatewayDisplay) {
                        gatewayDisplay.textContent = data.gateway_name || 'Payment Gateway';
                        gatewayDisplay.className = `gateway-badge gateway-${data.gateway}`;
                    }
                    
                    paymentModal.style.display = 'block';
                    
                    // Store order and gateway info for simulation
                    window.currentOrderId = data.order.order_id;
                    window.currentGateway = data.gateway;
                    
                    // Update simulation buttons based on gateway
                    updateSimulationButtons(data.gateway);
                    
                    // Clear form
                    document.getElementById('juspayAmount').value = '';
                } else {
                    alert('Error: ' + (data.message || data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error creating order:', error);
                alert('Error creating order');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Payment Order';
            }
        });
    }
    
    // Payment simulation buttons
    const simulateSuccessBtn = document.getElementById('simulateSuccess');
    const simulateFailureBtn = document.getElementById('simulateFailure');
    
    if (simulateSuccessBtn) {
        simulateSuccessBtn.onclick = async () => {
            if (!window.currentOrderId) return;
            
            const btn = simulateSuccessBtn;
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/payment/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: window.currentOrderId,
                        status: 'success',
                        gateway: window.currentGateway
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('paymentStatus').textContent = 'Success';
                    document.getElementById('paymentStatus').className = 'status-success';
                    alert('Payment successful! Glo Coins added to your wallet.');
                    
                    setTimeout(() => {
                        paymentModal.style.display = 'none';
                        window.currentOrderId = null;
                        window.currentGateway = null;
                        // Refresh user balance
                        if (typeof loadUserBalance === 'function') {
                            loadUserBalance();
                        }
                    }, 2000);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error simulating success:', error);
                alert('Error simulating payment success');
            } finally {
                btn.disabled = false;
                updateSimulationButtons(window.currentGateway);
            }
        });
    }
    
    if (simulateFailureBtn) {
        simulateFailureBtn.onclick = async () => {
            if (!window.currentOrderId) return;
            
            const btn = simulateFailureBtn;
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/payment/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: window.currentOrderId,
                        status: 'failed',
                        gateway: window.currentGateway
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('paymentStatus').textContent = 'Failed';
                    document.getElementById('paymentStatus').className = 'status-failed';
                    alert('Payment failed! Please try again.');
                    
                    setTimeout(() => {
                        paymentModal.style.display = 'none';
                        window.currentOrderId = null;
                        window.currentGateway = null;
                    }, 2000);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error simulating failure:', error);
                alert('Error simulating payment failure');
            } finally {
                btn.disabled = false;
                updateSimulationButtons(window.currentGateway);
            }
        });
    }
}

// Update simulation buttons based on active gateway
function updateSimulationButtons(gateway) {
    const successBtn = document.getElementById('simulateSuccess');
    const failureBtn = document.getElementById('simulateFailure');
    
    if (gateway === 'razorpay') {
        if (successBtn) successBtn.textContent = 'Simulate Razorpay Success';
        if (failureBtn) failureBtn.textContent = 'Simulate Razorpay Failure';
    } else if (gateway === 'juspay') {
        if (successBtn) successBtn.textContent = 'Simulate JusPay Success';
        if (failureBtn) failureBtn.textContent = 'Simulate JusPay Failure';
    } else {
        if (successBtn) successBtn.textContent = 'Simulate Success';
        if (failureBtn) failureBtn.textContent = 'Simulate Failure';
    }
}

// Handle Razorpay-specific payment flows (if needed in future)
function handleRazorpayPayment(options) {
    if (typeof Razorpay !== 'undefined') {
        var rzp = new Razorpay(options);
        rzp.open();
    } else {
        console.log('Razorpay SDK not loaded, using simulation');
        // Fall back to simulation
    }
}

// Handle JusPay-specific payment flows (if needed in future)
function handleJusPayPayment(options) {
    // JusPay SDK integration can be added here
    console.log('JusPay payment with options:', options);
    // Fall back to simulation for now
}
