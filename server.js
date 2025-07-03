require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Асинхронная обертка для поддержки top-level await для import('node-fetch')
async function main() {
    // Динамический импорт node-fetch
    const { default: fetch } = await import('node-fetch');

    const app = express();
    const PORT = process.env.PORT || 8080;

    // --- Middlewares ---
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '')));

    // --- API Route for DeepSeek ---
    app.post('/api/generate', async (req, res) => {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // ВАЖНО: API ключ временно здесь. Для безопасности его лучше хранить в переменных окружения.
        const DEEPSEEK_API_KEY = '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';
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
                        { "role": "system", "content": "You are a helpful assistant." },
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
            
            // Адаптируем ответ DeepSeek под формат, который ожидает фронтенд (похожий на Gemini)
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

// Запускаем асинхронную функцию
main().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
}); 