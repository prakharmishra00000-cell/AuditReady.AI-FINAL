const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Universal CORS Proxy Endpoint
app.post('/api/proxy', async (req, res) => {
    const { url, method = 'GET', headers = {}, body = null } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const config = {
            method: method.toLowerCase(),
            url: url,
            headers: headers,
            data: body
        };
        const response = await axios(config);
        res.status(response.status).send(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Secure Gemini API Backend Proxy
app.post('/api/gemini/scan', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'GEMINI_API_KEY environment variable is not set on the server. Please add it to your Render dashboard.' 
        });
    }
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

// For any other GET request, send the index.html (SPA fallback)
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => {
    console.log(`AuditReady.AI Backend running on port ${PORT}`);
});
