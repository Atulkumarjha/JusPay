// JusPay Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize JusPay integration
    initializeJusPayIntegration();
});

function initializeJusPayIntegration() {
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
                const response = await fetch('/api/payment/orders');
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
                            item.innerHTML = `
                                <div class="transaction-details">
                                    <h4>Order #${order.order_id}</h4>
                                    <p>Amount: ₹${order.amount}</p>
                                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                                    <p>Status: <span class="status-${order.status}">${order.status}</span></p>
                                    <p>Payment ID: ${order.payment_id || 'N/A'}</p>
                                </div>
                            `;
                            historyDiv.appendChild(item);
                        });
                    }
                    
                    orderModal.style.display = 'block';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error fetching order history:', error);
                alert('Error fetching order history');
            }
        };
    }
    
    // JusPay Payment Form
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
                const response = await fetch('/api/payment/create-order', {
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
                    // Show payment modal
                    document.getElementById('paymentOrderId').textContent = data.order.order_id;
                    document.getElementById('paymentAmount').textContent = data.order.amount;
                    document.getElementById('paymentStatus').textContent = 'Pending';
                    document.getElementById('paymentStatus').className = 'status-pending';
                    paymentModal.style.display = 'block';
                    
                    // Store order ID for simulation
                    window.currentOrderId = data.order.order_id;
                    
                    // Clear form
                    document.getElementById('juspayAmount').value = '';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error creating order:', error);
                alert('Error creating order');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Pay with JusPay';
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
                const response = await fetch('/api/payment/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: window.currentOrderId,
                        status: 'success'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('paymentStatus').textContent = 'Success';
                    document.getElementById('paymentStatus').className = 'status-success';
                    alert('Payment successful! Your wallet has been credited.');
                    
                    // Update balance if function exists
                    if (typeof updateBalanceDisplay === 'function') {
                        updateBalanceDisplay();
                    }
                    
                    setTimeout(() => {
                        paymentModal.style.display = 'none';
                        window.currentOrderId = null;
                    }, 2000);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error completing payment:', error);
                alert('Error completing payment');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Simulate Success';
            }
        };
    }
    
    if (simulateFailureBtn) {
        simulateFailureBtn.onclick = async () => {
            if (!window.currentOrderId) return;
            
            const btn = simulateFailureBtn;
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/api/payment/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_id: window.currentOrderId,
                        status: 'failed'
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
                    }, 2000);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error completing payment:', error);
                alert('Error completing payment');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Simulate Failure';
            }
        };
    }
}

// Utility function to check payment status
async function checkPaymentStatus(orderId) {
    try {
        const response = await fetch(`/api/payment/status/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.order;
        } else {
            console.error('Error checking payment status:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        return null;
    }
}

// Update balance function for JusPay integration
async function updateBalanceFromJusPay() {
    try {
        const response = await fetch('/api/balance');
        const data = await response.json();
        
        if (data.success) {
            const walletBalanceEl = document.getElementById('walletBalance');
            const gloBalanceEl = document.getElementById('gloBalance');
            
            if (walletBalanceEl) {
                walletBalanceEl.textContent = data.balance.wallet_balance.toFixed(2);
            }
            
            if (gloBalanceEl) {
                gloBalanceEl.textContent = data.balance.glo_coin_balance.toFixed(2);
            }
        } else {
            console.error('Error fetching balance:', data.message);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}
