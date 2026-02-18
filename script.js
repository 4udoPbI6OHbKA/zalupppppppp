// Конфигурация
const WS_URL = 'wss://zalupppppppp.onrender.com'; // ЗАМЕНИ НА СВОЙ URL!

let ws = null;
let myName = "Ч";
let currentRecipient = "Друн";
let reconnectAttempts = 0;
const maxReconnectAttempts = 50;

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

function connectWebSocket() {
    console.log('🔄 Подключаюсь к серверу:', WS_URL);
    console.log('Текущее время:', new Date().toLocaleString());
    
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = function() {
            console.log('✅ WebSocket соединение открыто');
            console.log('Протокол:', ws.protocol);
            console.log('URL:', ws.url);
            
            reconnectAttempts = 0;
            
            addMessage({
                sender: "Система",
                text: "✅ Соединение с сервером установлено",
                time: getCurrentTime(),
                system: true
            }, false);
            
            // Отправляем регистрацию
            const registerMsg = {
                register: myName
            };
            console.log('📤 Отправляю регистрацию:', registerMsg);
            ws.send(JSON.stringify(registerMsg));
        };
        
        ws.onmessage = function(event) {
            console.log('📥 Получено сообщение от сервера:', event.data);
            
            try {
                const data = JSON.parse(event.data);
                console.log('📥 Распарсенные данные:', data);
                
                if (data.system) {
                    addMessage(data, false);
                } else {
                    addMessage(data, false);
                }
            } catch (e) {
                console.error('❌ Ошибка парсинга сообщения:', e);
                console.error('Сырые данные:', event.data);
            }
        };
        
        ws.onclose = function(event) {
            console.log('❌ WebSocket соединение закрыто');
            console.log('Код закрытия:', event.code);
            console.log('Причина:', event.reason);
            console.log('Был чистым?', event.wasClean);
            
            addMessage({
                sender: "Система",
                text: `❌ Соединение закрыто (код: ${event.code})`,
                time: getCurrentTime(),
                system: true
            }, false);
            
            // Переподключаемся с экспоненциальной задержкой
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
                console.log(`🔄 Попытка переподключения ${reconnectAttempts}/${maxReconnectAttempts} через ${delay}мс...`);
                setTimeout(connectWebSocket, delay);
            }
        };
        
        ws.onerror = function(error) {
            console.error('❌ WebSocket ошибка:', error);
            console.error('Тип ошибки:', error.type);
            console.error('Event:', error);
            
            addMessage({
                sender: "Система",
                text: "⚠️ Ошибка соединения. Проверь консоль (F12)",
                time: getCurrentTime(),
                system: true
            }, false);
        };
        
    } catch (e) {
        console.error('❌ Критическая ошибка создания WebSocket:', e);
        console.error('Стек ошибки:', e.stack);
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
        alert("❌ Нет соединения с сервером! Статус: " + (ws ? ws.readyState : 'нет соединения'));
        console.log('WebSocket состояние:', ws ? ws.readyState : 'null');
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

    console.log('📤 Отправляю сообщение:', message);
    
    try {
        ws.send(JSON.stringify(message));
        addMessage(message, true);
        input.value = "";
    } catch (e) {
        console.error('❌ Ошибка отправки:', e);
        alert('Ошибка отправки сообщения');
    }
}

// Запускаем при загрузке
window.onload = function() {
    console.log('📄 Страница загружена, запускаю подключение...');
    console.log('Браузер:', navigator.userAgent);
    connectWebSocket();
};
