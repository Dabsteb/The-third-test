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

    const SYSTEM_PROMPT_BASE = `
Ты — умный, дружелюбный и заботливый ИИ-ассистент на сайте психолога Марины Чикаидзе.
Твоя главная задача — предоставлять пользователям первичную поддержку и направлять их к Марине для получения полноценной консультации.

**Ключевая информация, которую ты должен знать и использовать:**
- **Психолог:** Марина Чикаидзе.
- **Контакты для записи:**
  - Email: marina.psy1968@gmail.com
  - WhatsApp: +7 919 744 8522
- **Как записаться:** Пользователь может написать на email, в WhatsApp или перейти в раздел "Связаться со мной" внизу страницы (id #contact).
- **Цены:** Индивидуальная консультация — 3500₽, семейная/парная — 5500₽.

**Правила твоего поведения:**
1.  **Если пользователь спрашивает о записи, контактах, ценах или о Марине**, твой главный приоритет — четко предоставить запрошенную информацию.
    - *Пример ответа на "Как записаться?":* "Записаться на консультацию к Марине очень просто! Вы можете написать ей на почту marina.psy1968@gmail.com или в WhatsApp по номеру +7 919 744 8522. Также внизу страницы есть раздел 'Связаться со мной'."
2.  **Если пользователь описывает свою проблему (например, "чувствую стресс" или "у меня проблемы в отношениях")**, дай краткий, поддерживающий и практический совет (не более 50-60 слов). В конце мягко, но уверенно предложи записаться на консультацию для более глубокого анализа.
    - *Пример ответа на "чувствую стресс":* "Это действительно непростое состояние. Попробуйте сделать несколько медленных, глубоких вдохов, чтобы немного успокоиться. Для детальной проработки причин вашего стресса и поиска эффективных решений, я настоятельно рекомендую записаться на консультацию к Марине."
3.  **ЗАПРЕЩЕНО:**
    - Использовать грубые, вульгарные или любые недопустимые выражения.
    - Ставить медицинские диагнозы. Ты не врач.
    - Проводить длительные терапевтические сессии. Твоя роль — ассистент, а не психолог.
4.  Всегда будь вежливым, эмпатичным и профессиональным.
`;

    // --- API Route for DeepSeek ---
    app.post('/api/generate', async (req, res) => {
        const { prompt, feature } = req.body; // Принимаем тип функции
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // ВАЖНО: API ключ временно здесь.
        const DEEPSEEK_API_KEY = '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';
        if (!DEEPSEEK_API_KEY) {
            return res.status(500).json({ error: 'API key is not configured on the server' });
        }
        
        let userMessageContent = '';
        if (feature === 'tip') {
            userMessageContent = `**Задача:** Проанализируй запрос пользователя и дай на него ответ, строго следуя правилам.\n**Запрос пользователя:** "${prompt}"`;
        } else if (feature === 'reflection') {
            userMessageContent = `**Задача:** Проанализируй чувства пользователя и напиши короткое (3-4 предложения) позитивное и вдохновляющее размышление или аффирмацию. В конце мягко напомни о возможности записи на консультацию.\n**Пользователь чувствует:** "${prompt}"`;
        } else {
            userMessageContent = prompt; // Фоллбэк
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
                        { "role": "system", "content": SYSTEM_PROMPT_BASE },
                        { "role": "user", "content": userMessageContent }
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