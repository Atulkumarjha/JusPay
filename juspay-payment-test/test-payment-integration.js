#!/usr/bin/env node

const axios = require('axios');

async function testPaymentIntegration() {
    console.log('🧪 TESTING PAYMENT INTEGRATION');
    console.log('===============================\n');
    
    // First, login as demo user
    try {
        console.log('🔐 Step 1: Logging in as demo user...');
        const loginResponse = await axios.post('http://localhost:3000/login', {
            username: 'demo',
            password: 'demo123'
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // Transform data to form format
            transformRequest: [(data) => {
                return Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
            }]
        });
        
        console.log('✅ Login successful');
        
        // Get session cookie
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies ? cookies.find(c => c.startsWith('connect.sid=')) : null;
        
        if (!sessionCookie) {
            throw new Error('No session cookie received');
        }
        
        console.log('🍪 Session cookie obtained');
        
        // Step 2: Create a payment order
        console.log('\n💳 Step 2: Creating payment order...');
        const paymentResponse = await axios.post('http://localhost:3000/payment/create-order', {
            amount: 100.50,
            currency: 'INR'
        }, {
            headers: {
                'Cookie': sessionCookie,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Payment order created:', paymentResponse.data);
        
        // Step 3: Check recent orders
        console.log('\n📋 Step 3: Fetching recent orders...');
        const ordersResponse = await axios.get('http://localhost:3000/payment/orders', {
            headers: {
                'Cookie': sessionCookie
            }
        });
        
        console.log('📊 Recent orders response:', ordersResponse.data);
        
        console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

// Run the test
testPaymentIntegration();
