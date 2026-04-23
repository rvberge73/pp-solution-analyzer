const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Config endpoint
app.get('/api/config', (req, res) => {
    res.json({
        hasApiKey: !!process.env.GEMINI_API_KEY
    });
});

// AI Chat Proxy endpoint
app.post('/api/chat', async (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return res.status(500).json({ error: 'Server-side Gemini API key not configured.' });
    }

    const { message, context } = req.body;
    const models = [
        { ver: 'v1beta', name: 'gemini-2.0-flash' },
        { ver: 'v1beta', name: 'gemini-1.5-flash' }
    ];

    let lastError = '';
    for (const model of models) {
        try {
            const resp = await axios.post(`https://generativelanguage.googleapis.com/${model.ver}/models/${model.name}:generateContent?key=${key}`, {
                contents: [{ parts: [{ text: `${context}\n\nVraag: ${message}\n\nAntwoord in NL.` }] }]
            });

            if (resp.data.candidates?.[0]?.content) {
                return res.json({ text: resp.data.candidates[0].content.parts[0].text });
            }
        } catch (e) {
            lastError = e.response?.data?.error?.message || e.message;
        }
    }

    res.status(500).json({ error: `AI Proxy error: ${lastError}` });
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`Analyzer backend running on port ${PORT}`));
