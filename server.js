const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

/* --- 1. CONFIG ENDPOINT --- */
// Serve public frontend credentials (UPI, Google Client ID, etc.)
app.get('/api/config', (req, res) => {
    res.json({
        UPI_ID: process.env.UPI_ID || '6372843175@kotakbank',
        UPI_NAME: process.env.UPI_NAME || 'AuditReady.AI',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
        FIREBASE_CONFIG: process.env.FIREBASE_CONFIG || '{}',
        CLOUDFLARE_WORKER_URL: process.env.CLOUDFLARE_WORKER_URL || '',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'prakharmishra00000@gmail.com'
    });
});

/* --- 2. GEMINI API KEY ROTATION --- */
let geminiKeyIndex = 0;
function getNextGeminiKey() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) return null;
    
    const key = keys[geminiKeyIndex % keys.length];
    return key;
}

function rotateGeminiKey() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k);
    if (keys.length > 1) {
        geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
        console.log(`Rotated to Gemini API Key #${geminiKeyIndex + 1}`);
    }
}

app.post('/api/gemini/scan', async (req, res) => {
    const { prompt } = req.body;
    let apiKey = getNextGeminiKey();
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'GEMINI_API_KEY or GEMINI_API_KEYS environment variable is not set.' 
        });
    }
    
    try {
        let response;
        try {
            response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { 'Content-Type': 'application/json' } }
            );
        } catch (err) {
            // Check for 429 Rate Limit
            if (err.response && err.response.status === 429) {
                console.warn("Gemini Rate Limit Hit (429). Rotating key...");
                rotateGeminiKey();
                apiKey = getNextGeminiKey();
                // Retry once with new key
                response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                    { contents: [{ parts: [{ text: prompt }] }] },
                    { headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                throw err;
            }
        }
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

/* --- 3. SHADOW DATA PROXIES (JIRA, SLACK, NOTION) --- */
app.post('/api/shadow/slack', async (req, res) => {
    const slackToken = process.env.SLACK_BOT_TOKEN;
    if (!slackToken) return res.status(500).json({ error: 'SLACK_BOT_TOKEN not configured' });
    try {
        const response = await axios.get('https://slack.com/api/conversations.list?limit=5', {
            headers: { 'Authorization': `Bearer ${slackToken}` }
        });
        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

app.post('/api/shadow/jira', async (req, res) => {
    const { JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;
    if (!JIRA_BASE_URL || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
        return res.status(500).json({ error: 'Jira credentials not configured' });
    }
    try {
        const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
        const response = await axios.get(`${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/search?jql=order+by+created+DESC&maxResults=3`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

app.post('/api/shadow/notion', async (req, res) => {
    const notionKey = process.env.NOTION_API_KEY;
    if (!notionKey) return res.status(500).json({ error: 'NOTION_API_KEY not configured' });
    try {
        const response = await axios.post('https://api.notion.com/v1/search', { page_size: 3 }, {
            headers: { 'Authorization': `Bearer ${notionKey}`, 'Notion-Version': '2022-06-28' }
        });
        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

/* --- 4. WEBHOOK PROXIES (BREVO, SLACK WEBHOOK, PAGERDUTY) --- */
app.post('/api/webhook/alert', async (req, res) => {
    const { message } = req.body;
    
    // Slack Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
        try { await axios.post(process.env.SLACK_WEBHOOK_URL, { text: message }); } catch (e) { console.error("Slack alert failed", e.message); }
    }
    
    // PagerDuty
    if (process.env.PAGERDUTY_ROUTING_KEY) {
        try { 
            await axios.post('https://events.pagerduty.com/v2/enqueue', {
                routing_key: process.env.PAGERDUTY_ROUTING_KEY,
                event_action: 'trigger',
                payload: { summary: message, source: 'AuditReady.AI', severity: 'critical' }
            }); 
        } catch (e) { console.error("PagerDuty alert failed", e.message); }
    }
    
    res.json({ success: true, message: "Alerts dispatched" });
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
