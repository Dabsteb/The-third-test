<!-- Модальное окно чата с психологом -->
<div id="psychologist-chat-modal" class="psychologist-chat-modal">
    <div class="psychologist-chat-header">
        <h2 class="text-xl font-semibold">Написать психологу</h2>
        <button id="psychologist-close-button" class="text-white hover:text-gray-200 focus:outline-none">
            <i class="fas fa-times text-xl"></i>
        </button>
    </div>
    <div id="psychologist-chat-messages" class="psychologist-chat-messages">
        <!-- Приветственное сообщение от психолога -->
        <div class="message-bubble psychologist-message-other">
            <div class="font-bold text-sm mb-1">Марина Чикаидзе</div>
            <div class="text-base">Здравствуйте! Я Марина Чикаидзе. Чем могу помочь?</div>
            <div class="text-xs text-gray-400 mt-1">сейчас</div>
        </div>
    </div>
    <div class="loading-indicator" id="psychologist-loading-indicator">
        <div class="loading-spinner"></div>
        <p class="mt-2">Психолог печатает...</p>
    </div>
    <div class="psychologist-chat-input-area">
        <input type="text" id="psychologist-message-input" class="psychologist-chat-input" placeholder="Напишите сообщение...">
        <button id="psychologist-send-button" class="psychologist-send-button">
            <i class="fas fa-paper-plane"></i>
        </button>
    </div>
</div>
```javascript
// DOM Elements для чата психолога
const psychologistChatToggleButton = document.getElementById('psychologist-chat-toggle-button');
const psychologistChatModal = document.getElementById('psychologist-chat-modal');
const psychologistCloseButton = document.getElementById('psychologist-close-button');
const psychologistMessageInput = document.getElementById('psychologist-message-input');
const psychologistSendButton = document.getElementById('psychologist-send-button');
const psychologistChatMessagesDiv = document.getElementById('psychologist-chat-messages');
const psychologistLoadingIndicator = document.getElementById('psychologist-loading-indicator');

/**
* Отображает сообщение в чате психолога.
* @param {object} message - Объект сообщения.
*/
function displayPsychologistMessage(message) {
const messageBubble = document.createElement('div');
messageBubble.classList.add('message-bubble');
const senderInfo = document.createElement('div');
senderInfo.classList.add('font-bold', 'text-sm', 'mb-1');
const messageText = document.createElement('div');
messageText.classList.add('text-base');
const timestampText = document.createElement('div');
timestampText.classList.add('text-xs', 'text-gray-400', 'mt-1');

if (message.senderId === userId) {
    messageBubble.classList.add('psychologist-message-self');
    senderInfo.textContent = 'Вы';
} else {
    messageBubble.classList.add('psychologist-message-other');
    senderInfo.textContent = message.senderName || 'Психолог';
}

messageText.textContent = message.text;
if (message.timestamp) {
    const date = message.timestamp.toDate();
    timestampText.textContent = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

messageBubble.appendChild(senderInfo);
messageBubble.appendChild(messageText);
messageBubble.appendChild(timestampText);
psychologistChatMessagesDiv.appendChild(messageBubble);
psychologistChatMessagesDiv.scrollTop = psychologistChatMessagesDiv.scrollHeight;
}

// Открытие/закрытие модального окна чата психолога
psychologistChatToggleButton.addEventListener('click', () => {
openModal(psychologistChatModal);
psychologistChatMessagesDiv.scrollTop = psychologistChatMessagesDiv.scrollHeight;
});
psychologistCloseButton.addEventListener('click', () => { closeModal(psychologistChatModal); });

// Отправка сообщения и вызов Gemini API
async function sendMessageToPsychologist() {
const text = psychologistMessageInput.value.trim();
if (text === '') return;

try {
    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/psychologist_messages`), {
        senderId: userId,
        senderName: userName,
        text: text,
        timestamp: serverTimestamp()
    });
    psychologistMessageInput.value = '';

    psychologistLoadingIndicator.classList.add('show');

    // ВАЖНО: Замени "ТВОЙ_ПОЛУЧЕННЫЙ_API_КЛЮЧ_ЗДЕСЬ" на свой API-ключ Gemini
    const GEMINI_API_KEY = "AIzaSyCeNqKnRs3unMHeyhLz_weKI0j-tEf4j7w"; // <-- ЗАМЕНИ ЭТО!

    const prompt = `Ответь на следующее сообщение от пользователя как психолог Марина Чикаидзе, поддерживающим и эмпатичным тоном. Сообщение: "${text}"`;
    const psychologistResponse = await callGeminiAPI(prompt); // Используем общую функцию callGeminiAPI

    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/psychologist_messages`), {
        senderId: 'psychologist_ai',
        senderName: 'Марина Чикаидзе',
        text: psychologistResponse,
        timestamp: serverTimestamp()
    });
} catch (e) {
    console.error("Ошибка при отправке сообщения психологу или вызове API: ", e);
    showNotification('Извините, произошла ошибка. Пожалуйста, проверьте ваше интернет-соединение или попробуйте позже.', 'error');
} finally {
    psychologistLoadingIndicator.classList.remove('show');
}
}

psychologistSendButton.addEventListener('click', sendMessageToPsychologist);
psychologistMessageInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
    sendMessageToPsychologist();
}
});

// Загрузка данных (внутри onAuthStateChanged в основном скрипте)
/*
// Загружаем приватные сообщения (чат психолога)
const qPsychologist = query(collection(db, `artifacts/${appId}/users/${userId}/psychologist_messages`), orderBy('timestamp'));
onSnapshot(qPsychologist, (snapshot) => {
    // Очищаем и добавляем начальное сообщение
    psychologistChatMessagesDiv.innerHTML = `
        <div class="message-bubble psychologist-message-other">
            <div class="font-bold text-sm mb-1">Марина Чикаидзе</div>
            <div class="text-base">Здравствуйте! Я Марина Чикаидзе. Чем могу помочь?</div>
            <div class="text-xs text-gray-400 mt-1">сейчас</div>
        </div>
    `;
    snapshot.docs.forEach((doc) => {
        const message = { id: doc.id, ...doc.data() };
        displayPsychologistMessage(message);
    });
}, (error) => { console.error("Ошибка при получении сообщений чата психолога:", error); });
*/
