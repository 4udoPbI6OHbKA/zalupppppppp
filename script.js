// КОНФИГУРАЦИЯ - ВАЖНО! Используй свой URL
const WS_URL = 'wss://zalupppppppp.onrender.com'; // ЗАМЕНИ НА СВОЙ URL
const HTTP_URL = 'https://zalupppppppp.onrender.com'; // Тот же URL, но с https://

let ws = null;
let myName = "Ч";
let currentRecipient = "Друн";
let reconnectAttempts = 0;
const maxReconnectAttempts = 50;

// Функция добавления сообщения
function addMessage(data, isOwn) {
    const messages = document.getElementById("messages");
    const msg = document.createElement("div");
    msg.className = `message ${isOwn ? 'own' : 'their'}`;
    
    let senderName = data.sender;
    if (isOwn) senderName = 'Вы';
    if (data.system) senderName = '📢 ' + data.sender;
    
    msg.innerHTML = `<b>${senderName}</b> (${data.time})<br>${data.text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

// Подключение к WebSocket
function connectWebSocket() {
    console.log('🔄 Подключение к WebSocket серверу...');
    console.log('URL:', WS_URL);
    console.log('HTTP URL:', HTTP_URL);
    
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = function() {
            console.log('✅ WebSocket подключен!');
            reconnectAttempts = 0;
            
            addMessage({
                sender: "Система",
                text: "✅ Подключено к серверу",
                time: getCurrentTime(),
                system: true
            }, false);
            
            // Регистрируемся
            ws.send(JSON.stringify({
                register: myName
            }));
        };
        
        ws.onmessage = function(event) {
            console.log('📨 Получено:', event.data);
            try {
                const data = JSON.parse(event.data);
                addMessage(data, false);
            } catch (e) {
                console.error('Ошибка парсинга:', e);
            }
        };
        
        ws.onclose = function(event) {
            console.log('❌ WebSocket отключен. Код:', event.code);
            
            addMessage({
                sender: "Система",
                text: `❌ Отключено от сервера (код: ${event.code})`,
                time: getCurrentTime(),
                system: true
            }, false);
            
            // Переподключаемся
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                setTimeout(connectWebSocket, 3000);
            }
        };
        
        ws.onerror = function(error) {
            console.error('❌ WebSocket ошибка:', error);
        };
        
    } catch (e) {
        console.error('❌ Ошибка создания WebSocket:', e);
    }
}

function getCurrentTime() {
    return new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function setRecipient(name) {
    currentRecipient = name;
    document.getElementById("recipient").textContent = name;
}

function handleEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function sendMessage() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Нет соединения с сервером!");
        return;
    }
    
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;

    const message = {
        sender: myName,
        recipient: currentRecipient,
        text: text,
        time: getCurrentTime()
    };

    console.log('📤 Отправка:', message);
    ws.send(JSON.stringify(message));
    addMessage(message, true);
    input.value = "";
}

// Запуск при загрузке
window.onload = function() {
    console.log('📄 Страница загружена');
    console.log('Браузер:', navigator.userAgent);
    console.log('URL страницы:', window.location.href);
    connectWebSocket();
};
