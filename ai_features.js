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

/**
* Вызывает наш бэкенд для генерации текста через AI.
* @param {string} promptText - Текст промпта для модели.
* @param {'tip'|'reflection'} feature - Тип запрашиваемой функции.
* @returns {Promise<string>} Ответ от модели в виде текста.
*/
async function callApi(promptText, feature) {
    const apiUrl = '/api/generate';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText, feature: feature }), // Отправляем промпт и тип функции
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
            const tip = await callApi(problem, 'tip');
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
            const reflection = await callApi(feeling, 'reflection');
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