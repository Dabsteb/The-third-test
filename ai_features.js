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
    const payload = {
        contents: [{
            parts: [{ text: promptText }]
        }]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP ошибка: ${response.status}`, errorBody);
            throw new Error(`Сервер ответил ошибкой ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Неожиданный формат ответа от API:", result);
            throw new Error("Не удалось получить корректный ответ от Gemini API.");
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
            const prompt = `Дай короткий, практический и поддерживающий совет по самопомощи (не более 50 слов) для человека, который столкнулся с ситуацией: "${problem}". Говори как заботливый психолог.`;
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
            const prompt = `Напиши короткое (3-4 предложения) позитивное и вдохновляющее размышление или аффирмацию для человека, который сейчас чувствует: "${feeling}". Обращайся к нему на "вы" и говори мягко и ободряюще.`;
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