// Global variables
let lastOrderId = null;

// DOM elements
const paymentForm = document.getElementById('paymentForm');
const payBtn = document.getElementById('payBtn');
const responseArea = document.getElementById('responseArea');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const getMethodsBtn = document.getElementById('getMethodsBtn');
const healthCheckBtn = document.getElementById('healthCheckBtn');
const clearBtn = document.getElementById('clearBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    displayMessage('🚀 JusPay Express Checkout Test Environment Ready!\n\nFill the form and click "Create Express Checkout" to start testing.', 'info');
});

// Setup event listeners
function setupEventListeners() {
    paymentForm.addEventListener('submit', handlePaymentSubmit);
    checkStatusBtn.addEventListener('click', handleCheckStatus);
    getMethodsBtn.addEventListener('click', handleGetPaymentMethods);
    healthCheckBtn.addEventListener('click', handleHealthCheck);
    clearBtn.addEventListener('click', clearResponse);
}

// Handle payment form submission
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(paymentForm);
    const paymentData = Object.fromEntries(formData.entries());
    
    // Validate form data
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        displayMessage('❌ Please enter a valid amount', 'error');
        return;
    }
    
    setLoading(payBtn, true);
    
    try {
        const paymentType = paymentData.payment_type || 'order';
        let endpoint, actionText;
        
        switch (paymentType) {
            case 'order':
                endpoint = '/api/payment/create';
                actionText = 'Express Checkout order';
                break;
            case 'session':
                endpoint = '/api/payment/session';
                actionText = 'Express Checkout session';
                break;
            case 'link':
                endpoint = '/api/payment/link';
                actionText = 'payment link';
                break;
            default:
                endpoint = '/api/payment/create';
                actionText = 'Express Checkout order';
        }
        
        displayMessage(`Creating ${actionText}...`, 'info');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            lastOrderId = result.order_id;
            checkStatusBtn.disabled = false;
            
            displayMessage(JSON.stringify(result, null, 2), 'success');
            
            // If there's a payment URL, show it
            if (result.data && result.data.payment_links) {
                showPaymentLink(result.data.payment_links.web || result.data.payment_links.mobile);
            }
            
            // Show next steps based on payment type
            showExpressCheckoutSteps(result.data, paymentType);
            
        } else {
            displayMessage(`❌ Error: ${result.error}\n${result.message || ''}`, 'error');
        }
        
    } catch (error) {
        console.error('Express Checkout creation error:', error);
        displayMessage(`🌐 Network Error: ${error.message}`, 'error');
    } finally {
        setLoading(payBtn, false);
    }
}

// Handle check payment status
async function handleCheckStatus() {
    if (!lastOrderId) {
        displayMessage('❌ No order to check', 'error');
        return;
    }
    
    setLoading(checkStatusBtn, true);
    
    try {
        displayMessage('🔍 Checking order status...', 'info');
        
        const response = await fetch(`/api/payment/order/${lastOrderId}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
            displayMessage(JSON.stringify(result, null, 2), 'success');
        } else {
            displayMessage(`❌ Error: ${result.error}\n${result.message || ''}`, 'error');
        }
        
    } catch (error) {
        console.error('Status check error:', error);
        displayMessage(`🌐 Network Error: ${error.message}`, 'error');
    } finally {
        setLoading(checkStatusBtn, false);
    }
}

// Handle get payment methods
async function handleGetPaymentMethods() {
    setLoading(getMethodsBtn, true);
    
    try {
        const currency = document.getElementById('currency').value;
        const amount = document.getElementById('amount').value;
        
        displayMessage('🔍 Fetching available payment methods...', 'info');
        
        const params = new URLSearchParams();
        if (currency) params.append('currency', currency);
        if (amount) params.append('amount', amount);
        
        const response = await fetch(`/api/payment/methods?${params}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
            displayMessage(JSON.stringify(result, null, 2), 'success');
        } else {
            displayMessage(`❌ Error: ${result.error}\n${result.message || ''}`, 'error');
        }
        
    } catch (error) {
        console.error('Get payment methods error:', error);
        displayMessage(`🌐 Network Error: ${error.message}`, 'error');
    } finally {
        setLoading(getMethodsBtn, false);
    }
}

// Handle health check
async function handleHealthCheck() {
    setLoading(healthCheckBtn, true);
    
    try {
        displayMessage('🔍 Checking JusPay service health...', 'info');
        
        const response = await fetch('/api/payment/health');
        const result = await response.json();
        
        if (response.ok) {
            displayMessage(JSON.stringify(result, null, 2), result.success ? 'success' : 'error');
        } else {
            displayMessage(`❌ Health Check Failed: ${result.message || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Health check error:', error);
        displayMessage(`🌐 Network Error: ${error.message}`, 'error');
    } finally {
        setLoading(healthCheckBtn, false);
    }
}

// Display message in response area
function displayMessage(message, type = 'info') {
    responseArea.innerHTML = '';
    
    const messageElement = document.createElement('div');
    messageElement.className = type;
    messageElement.textContent = message;
    
    responseArea.appendChild(messageElement);
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.style.cssText = 'margin-top: 10px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;';
    timestamp.textContent = `⏰ ${new Date().toLocaleString()}`;
    responseArea.appendChild(timestamp);
}

// Show payment link
function showPaymentLink(paymentUrl) {
    if (!paymentUrl) return;
    
    const linkContainer = document.createElement('div');
    linkContainer.style.cssText = 'margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 5px; border-left: 4px solid #2196f3;';
    
    const linkText = document.createElement('p');
    linkText.innerHTML = '<strong>🔗 Payment Link Generated:</strong>';
    linkText.style.marginBottom = '10px';
    
    const link = document.createElement('a');
    link.href = paymentUrl;
    link.target = '_blank';
    link.textContent = paymentUrl;
    link.style.cssText = 'word-break: break-all; color: #1976d2; text-decoration: none;';
    
    const button = document.createElement('button');
    button.textContent = '🚀 Open Payment Page';
    button.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;';
    button.onclick = () => window.open(paymentUrl, '_blank');
    
    linkContainer.appendChild(linkText);
    linkContainer.appendChild(link);
    linkContainer.appendChild(document.createElement('br'));
    linkContainer.appendChild(button);
    
    responseArea.appendChild(linkContainer);
}

// Show Express Checkout specific next steps
function showExpressCheckoutSteps(paymentData, paymentType) {
    const stepsContainer = document.createElement('div');
    stepsContainer.style.cssText = 'margin-top: 15px; padding: 15px; background: #f0f8f0; border-radius: 5px; border-left: 4px solid #4caf50;';
    
    const stepsTitle = document.createElement('h4');
    stepsTitle.textContent = '🎯 Express Checkout Next Steps:';
    stepsTitle.style.marginBottom = '10px';
    
    const stepsList = document.createElement('ul');
    stepsList.style.margin = '0';
    stepsList.style.paddingLeft = '20px';
    
    let steps = [];
    
    switch (paymentType) {
        case 'order':
            steps = [
                'Order created successfully with Express Checkout',
                'Use the payment link above to complete the payment',
                'Check order status using the "Check Payment Status" button',
                'Monitor webhook callbacks for payment updates'
            ];
            break;
        case 'session':
            steps = [
                'Express Checkout session created with client auth token',
                'Use the SDK payload for mobile/web integration',
                'Process payment using /api/payment/process endpoint',
                'Check session status for real-time updates'
            ];
            break;
        case 'link':
            steps = [
                'Payment link created and ready to use',
                'Share the link with customers for payment',
                'Link expires in 24 hours by default',
                'Track payment status via webhooks'
            ];
            break;
        default:
            steps = [
                'Express Checkout integration ready',
                'Test with different payment methods',
                'Monitor payment flow and status changes',
                'Verify webhook payload handling'
            ];
    }
    
    steps.forEach(step => {
        const listItem = document.createElement('li');
        listItem.textContent = step;
        listItem.style.marginBottom = '5px';
        stepsList.appendChild(listItem);
    });
    
    stepsContainer.appendChild(stepsTitle);
    stepsContainer.appendChild(stepsList);
    responseArea.appendChild(stepsContainer);
}

// Set loading state for buttons
function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Clear response area
function clearResponse() {
    responseArea.innerHTML = '<p class="placeholder">Payment response will appear here...</p>';
    lastOrderId = null;
    checkStatusBtn.disabled = true;
}

// Utility function to format JSON
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        paymentForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear response
    if (e.key === 'Escape') {
        clearResponse();
    }
});

// Auto-fill demo data for Express Checkout
function fillDemoData() {
    document.getElementById('amount').value = '100.00';
    document.getElementById('currency').value = 'INR';
    document.getElementById('customer_email').value = 'test@example.com';
    document.getElementById('customer_phone').value = '+91 9876543210';
    document.getElementById('product_id').value = 'test_product_123';
    document.getElementById('payment_type').value = 'order';
}

// Add demo data button
document.addEventListener('DOMContentLoaded', function() {
    const demoButton = document.createElement('button');
    demoButton.textContent = '🎯 Fill Demo Data';
    demoButton.type = 'button';
    demoButton.className = 'secondary-button';
    demoButton.style.marginTop = '15px';
    demoButton.onclick = fillDemoData;
    
    const formContainer = document.querySelector('.payment-form-container');
    formContainer.appendChild(demoButton);
});
