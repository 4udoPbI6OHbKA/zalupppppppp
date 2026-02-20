// Подключаемся к серверу
const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
});

let currentRecipient = "себе";
let mySocketId = null;
let messageQueue = new Set();

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
    mySocketId = socket.id;
    console.log('Подключено к серверу. ID:', mySocketId);
    
    if (connectionStatus) {
        connectionStatus.textContent = 'Онлайн';
        connectionStatus.style.color = '#2ecc71';
    }
    
    addMessage({
        sender: 'Система',
        text: 'Вы подключены к чату',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }, false);
});

socket.on('disconnect', function() {
    console.log('Отключено от сервера');
    if (connectionStatus) {
        connectionStatus.textContent = 'Офлайн';
        connectionStatus.style.color = '#e74c3c';
    }
});

socket.on('connect_error', function(error) {
    console.error('Ошибка подключения:', error);
    if (connectionStatus) {
        connectionStatus.textContent = 'Ошибка';
        connectionStatus.style.color = '#f39c12';
    }
});

// Получение сообщений
socket.on('message', function(data) {
    console.log('Получено сообщение от сервера:', data);
    
    if (data.id && messageQueue.has(data.id)) {
        console.log('Это наше сообщение (по ID), пропускаем');
        messageQueue.delete(data.id);
        return;
    }
    
    if (data.sender === 'Я' || data.sender === mySocketId || data.sender === socket.id) {
        console.log('Это наше сообщение (по отправителю), пропускаем');
        return;
    }
    
    console.log('Сообщение от другого пользователя, показываем');
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
    
    const messageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const message = {
        id: messageId,
        sender: mySocketId || 'temp-' + Date.now(),
        senderName: 'Я',
        recipient: currentRecipient,
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    };
    
    console.log('Отправляем сообщение:', message);
    
    messageQueue.add(messageId);
    socket.emit('message', message);
    
    addMessage({
        ...message,
        sender: 'Я'
    }, true);
    
    messageInput.value = '';
}

function addMessage(data, isOwn) {
    if (!messagesDiv) return;
    
    console.log('Добавляем сообщение в чат:', data, 'Своё:', isOwn);
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwn ? 'own' : 'their'}`;
    
    let displaySender = data.senderName || data.sender;
    if (displaySender === mySocketId) {
        displaySender = 'Я';
    }
    
    messageElement.innerHTML = `<b>${displaySender}</b> (${data.time})<br>${data.text}`;
    messagesDiv.appendChild(messageElement);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

window.clearMessageQueue = function() {
    messageQueue.clear();
    console.log('Очередь сообщений очищена');
};
