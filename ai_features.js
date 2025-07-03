/**
* Отображает временное уведомление в углу экрана.
* @param {string} message - Сообщение для отображения.
* @param {string} [type='success'] - Тип уведомления ('success', 'error').
*/
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white text-base z-[1050] transition-all duration-300 transform translate-y-20 opacity-0`;
    
    notification.classList.add(type === 'success' ? 'bg-green-600' : 'bg-red-600');
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Плавное появление
    setTimeout(() => {
        notification.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    // Плавное исчезновение
    setTimeout(() => {
        notification.classList.add('opacity-0');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 3500);
}

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

---
`;

// DOM Elements для AI-функций
const quickTipInput = document.getElementById('quick-tip-input');
const getQuickTipButton = document.getElementById('get-quick-tip-button');
const quickTipOutput = document.getElementById('quick-tip-output');
const quickTipLoadingIndicator = document.getElementById('quick-tip-loading-indicator');

const thoughtInput = document.getElementById('thought-input');
const getReflectionButton = document.getElementById('get-reflection-button');
const reflectionOutput = document.getElementById('reflection-output');
const reflectionLoadingIndicator = document.getElementById('reflection-loading-indicator');

// API ключ для Gemini [[memory:762811]]
const GEMINI_API_KEY = "AIzaSyCeNqKnRs3unMHeyhLz_weKI0j-tEf4j7w";

/**
* Вызывает Gemini API для генерации текста.
* @param {string} promptText - Текст промпта для модели.
* @returns {Promise<string>} Ответ от модели в виде текста.
*/
async function callGeminiAPI(promptText) {
    const apiUrl = '/api/generate'; // Обращаемся к нашему бэкенд-посреднику

    try {
const response = await fetch(apiUrl, {
    method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText }), // Отправляем промпт на наш сервер
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Ошибка сервера-посредника: ${response.status}`, errorData.error);
            throw new Error(`Сервер ответил ошибкой: ${errorData.error || response.status}`);
        }

const result = await response.json();

if (result.candidates && result.candidates.length > 0 &&
    result.candidates[0].content && result.candidates[0].content.parts &&
    result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
} else {
            console.error("Неожиданный формат ответа от нашего сервера:", result);
            throw new Error("Не удалось получить корректный ответ от API.");
        }
    } catch (error) {
        console.error("Сетевая ошибка или ошибка выполнения запроса:", error);
        throw error;
    }
}

// 1. Генератор советов
if (getQuickTipButton) {
    getQuickTipButton.addEventListener('click', async () => {
        const problem = quickTipInput.value.trim();
        if (!problem) {
            showNotification('Пожалуйста, опишите вашу проблему.', 'error');
            return;
        }
        quickTipLoadingIndicator.style.display = 'block';
        quickTipOutput.innerHTML = '';
        
        try {
            const prompt = SYSTEM_PROMPT_BASE + 
                           `**Задача:** Проанализируй запрос пользователя и дай на него ответ, строго следуя правилам.\n` +
                           `**Запрос пользователя:** "${problem}"`;
    const tip = await callGeminiAPI(prompt);
            quickTipOutput.innerHTML = `<p>${tip}</p>`;
    showNotification('Совет сгенерирован!', 'success');
} catch (error) {
            quickTipOutput.innerHTML = '<p class="text-center text-red-500">К сожалению, не удалось сгенерировать совет. Попробуйте переформулировать запрос или повторите попытку позже.</p>';
    showNotification('Ошибка при генерации совета.', 'error');
        } finally {
            quickTipLoadingIndicator.style.display = 'none';
        }
    });
}

// 2. Ежедневное размышление/аффирмация
if (getReflectionButton) {
getReflectionButton.addEventListener('click', async () => {
        const feeling = thoughtInput.value.trim();
        if (!feeling) {
            showNotification('Пожалуйста, опишите, как вы себя чувствуете.', 'error');
            return;
        }
        reflectionLoadingIndicator.style.display = 'block';
        reflectionOutput.innerHTML = '';

        try {
            const prompt = SYSTEM_PROMPT_BASE +
                           `**Задача:** Проанализируй чувства пользователя и напиши короткое (3-4 предложения) позитивное и вдохновляющее размышление или аффирмацию. В конце мягко напомни о возможности записи на консультацию.\n` +
                           `**Пользователь чувствует:** "${feeling}"`;
    const reflection = await callGeminiAPI(prompt);
    reflectionOutput.innerHTML = `<p>${reflection}</p>`;
    showNotification('Размышление сгенерировано!', 'success');
} catch (error) {
            reflectionOutput.innerHTML = '<p class="text-center text-red-500">Не удалось сгенерировать размышление. Попробуйте повторить попытку позже.</p>';
    showNotification('Ошибка при генерации размышления.', 'error');
        } finally {
            reflectionLoadingIndicator.style.display = 'none';
        }
});
}