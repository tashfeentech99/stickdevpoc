const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Get Railway's outbound IP
app.get('/api/get-ip', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        res.json({
            ip: response.data.ip,
            message: 'This is the IP that Sticky.io sees from Railway'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Sticky config
app.get('/api/sticky/config', (req, res) => {
    res.json({
        app_key: process.env.STICKY_APP_KEY
    });
});

// Create Sticky order
app.post('/api/sticky/new-order', async (req, res) => {
    try {
        const {
            payment_token,
            product_id,
            first_name,
            last_name,
            email,
            phone,
            country
        } = req.body;

        console.log('Creating Sticky order with:', {
            payment_token: payment_token?.substring(0, 20) + '...',
            product_id,
            email
        });

        const orderData = {
            campaignId: 1,
            offerId: 1,
            billingModelId: 2,
            shippingId: 2,
            product1_id: product_id || 1,
            product1_qty: 1,
            firstName: first_name,
            lastName: last_name,
            emailAddress: email,
            phoneNumber: phone,
            country: country || 'US',
            [process.env.STICKY_TOKEN_FIELD || 'payment_token']: payment_token
        };

        const response = await axios.post(
            `${process.env.STICKY_API_URL}/new_order`,
            orderData,
            {
                auth: {
                    username: process.env.STICKY_API_USERNAME,
                    password: process.env.STICKY_API_PASSWORD
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('✅ Sticky order created:', response.data);

        res.json({
            success: true,
            order_id: response.data.order_id,
            data: response.data
        });

    } catch (error) {
        console.error('❌ Sticky order error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
            details: error.response?.status ? `HTTP ${error.response.status}` : 'Network error'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
});
