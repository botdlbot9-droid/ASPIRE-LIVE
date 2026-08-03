const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Proxy endpoint - Livepush की तरह
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        console.log('🌐 Proxying:', url);
        
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'Referer': 'https://livepush.io/',
                'Origin': 'https://livepush.io/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        // CORS headers for your frontend
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        response.data.pipe(res);
        
    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        res.status(500).send('Proxy Error: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Proxy server running on port ${PORT}`);
    console.log(`🌐 Use: /proxy?url=YOUR_M3U8_URL`);
});
