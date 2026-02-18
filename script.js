// Подключаемся к серверу
const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
});

let currentRecipient = "себе";

// Элементы DOM
const messagesDiv = document.getElementById('messages');
const recipientSpan = document.getElementById('recipient');
const connectionStatus = document.getElementById('connection-status');
const messageInput = document.getElementById('message-input');

// Устанавливаем получателя по умолчанию
if (recipientSpan) {
    recipientSpan.textContent = currentRecipient;
}

// Подключение к серверу
socket.on('connect', function() {
    console.log('✅ Подключено к серверу');
    if (connectionStatus) {
        connectionStatus.textContent = '🟢 Онлайн';
        connectionStatus.style.color = '#2ecc71';
    }
    addMessage({
        sender: 'Система',
        text: 'Вы подключены к чату',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }, false);
});

socket.on('disconnect', function() {
    console.log('❌ Отключено от сервера');
    if (connectionStatus) {
        connectionStatus.textContent = '🔴 Офлайн';
        connectionStatus.style.color = '#e74c3c';
    }
});

socket.on('connect_error', function(error) {
    console.error('Ошибка подключения:', error);
    if (connectionStatus) {
        connectionStatus.textContent = '⚠️ Ошибка';
        connectionStatus.style.color = '#f39c12';
    }
});

// Получение сообщений
socket.on('message', function(data) {
    console.log('Получено сообщение:', data);
    addMessage(data, false);
});

function setRecipient(name) {
    currentRecipient = name;
    if (recipientSpan) {
        recipientSpan.textContent = name;
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    if (!messageInput) return;
    
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    const message = {
        sender: 'Я',
        recipient: currentRecipient,
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    };
    
    // Отправляем на сервер
    socket.emit('message', message);
    
    // Показываем в чате
    addMessage(message, true);
    
    // Очищаем поле ввода
    messageInput.value = '';
}

function addMessage(data, isOwn) {
    if (!messagesDiv) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwn ? 'own' : 'their'}`;
    messageElement.innerHTML = `<b>${data.sender}</b> (${data.time})<br>${data.text}`;
    messagesDiv.appendChild(messageElement);
    
    // Прокручиваем вниз
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
