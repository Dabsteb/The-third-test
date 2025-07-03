require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

async function main() {
    const { default: fetch } = await import('node-fetch');

    const app = express();
    const PORT = process.env.PORT || 8080;

    // --- Middlewares ---
    app.use(cors()); // Включаем CORS для всех маршрутов
    app.use(express.json()); // Для парсинга JSON-тел запросов
    app.use(express.static(path.join(__dirname, ''))); // Обслуживаем статические файлы из корня проекта

    // --- API Route for DeepSeek ---
    app.post('/api/generate', async (req, res) => {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            return res.status(500).json({ error: 'API key is not configured on the server' });
        }

        const apiUrl = `https://api.deepseek.com/v1/chat/completions`;

        try {
            const apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { "role": "user", "content": prompt }
                    ],
                    stream: false
                }),
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error('DeepSeek API Error:', errorText);
                return res.status(apiResponse.status).json({ error: `Failed to generate content: ${errorText}` });
            }

            const data = await apiResponse.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const responseText = data.choices[0].message.content;
                const geminiLikeResponse = {
                    candidates: [{
                        content: {
                            parts: [{
                                text: responseText
                            }]
                        }
                    }]
                };
                res.json(geminiLikeResponse);
            } else {
                console.error('Unexpected DeepSeek response format:', data);
                res.status(500).json({ error: 'Invalid response format from AI service.' });
            }

        } catch (error) {
            console.error('Server Error:', error);
            res.status(500).json({ error: 'An internal server error occurred.' });
        }
    });

    // --- Fallback for SPA ---
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // --- Server Activation ---
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
}); 