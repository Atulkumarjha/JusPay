// Quick test to create Cashfree order and verify gateway detection
const fetch = require('node-fetch');

async function testCashfreeOrder() {
    console.log('🧪 Testing Cashfree order creation...');
    
    try {
        // First, login as demo user
        const loginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'demo',
                password: 'demo123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.success);
        
        // Get session cookies
        const cookies = loginResponse.headers.raw()['set-cookie'];
        const sessionCookie = cookies.find(c => c.startsWith('connect.sid'));
        
        if (!sessionCookie) {
            throw new Error('No session cookie found');
        }
        
        // Create a Cashfree order
        const orderResponse = await fetch('http://localhost:3000/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                amount: 150.75,
                customerName: 'Test Customer',
                customerPhone: '9876543210',
                description: 'Test Cashfree Payment',
                gateway: 'cashfree'
            })
        });
        
        const orderData = await orderResponse.json();
        console.log('🎯 Cashfree order creation response:', JSON.stringify(orderData, null, 2));
        
        // Now fetch orders to verify it appears with proper gateway info
        const ordersResponse = await fetch('http://localhost:3000/orders', {
            headers: {
                'Cookie': sessionCookie
            }
        });
        
        const orders = await ordersResponse.json();
        console.log('📋 Latest orders with gateway info:');
        orders.slice(0, 3).forEach(order => {
            console.log(`  - ${order.order_id}: ${order.gateway_info?.display_name || 'Unknown'} (${order.gateway_info?.gateway || 'unknown'})`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCashfreeOrder();
