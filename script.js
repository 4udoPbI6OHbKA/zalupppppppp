// Конфигурация
const WS_URL = 'https://zalupppppppp.onrender.com'; // ЗАМЕНИТЕ НА СВОЙ URL!

let ws = null;
let myName = "Ч";
let currentRecipient = "Друн";
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Подключаемся к серверу
function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = function() {
        console.log('✅ Подключено к серверу');
        reconnectAttempts = 0;
        
        // Регистрируемся на сервере
        ws.send(JSON.stringify({
            register: myName
        }));
        
        addMessage({
            sender: "Система",
            text: "Вы подключены к чату",
            time: getCurrentTime()
        }, false);
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        // Системное сообщение
        if (data.system) {
            addMessage(data, false);
            return;
        }
        
        // Обычное сообщение
        addMessage(data, false);
    };
    
    ws.onclose = function() {
        console.log('❌ Отключено от сервера');
        addMessage({
            sender: "Система",
            text: "Потеряно соединение с сервером",
            time: getCurrentTime()
        }, false);
        
        // Пытаемся переподключиться
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 3000);
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Функция для получения текущего времени
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

    // Отправляем на сервер
    ws.send(JSON.stringify(message));

    // Добавляем своё сообщение
    addMessage(message, true);

    input.value = "";
}

function addMessage(data, isOwn) {
    const messages = document.getElementById("messages");
    const msg = document.createElement("div");
    msg.className = `message ${isOwn ? 'own' : 'their'}`;
    
    let senderName = data.sender;
    if (isOwn) senderName = 'Вы';
    
    msg.innerHTML = `<b>${senderName}</b> (${data.time})<br>${data.text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}

// Запускаем подключение при загрузке страницы
window.onload = function() {
    connectWebSocket();
};

// Пинг каждые 25 секунд для поддержания соединения
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({type: "ping"}));
    }
}, 25000);
