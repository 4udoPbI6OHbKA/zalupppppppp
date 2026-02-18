// Определяем URL WebSocket в зависимости от окружения
const WS_PORT = window.location.hostname === "localhost" ? 8765 : 8765;
const WS_URL = window.location.hostname === "localhost" 
    ? `ws://localhost:${WS_PORT}` 
    : `wss://${window.location.hostname}:${WS_PORT}`;

console.log("Подключение к WebSocket:", WS_URL);

let ws;
let currentRecipient = "себе";
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = function() {
        console.log("Подключено к серверу");
        reconnectAttempts = 0;
        addMessage({ 
            sender: "Система", 
            text: "Вы подключены к чату", 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }, false);
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            addMessage(data, false);
        } catch (e) {
            console.error("Ошибка парсинга сообщения:", e);
        }
    };

    ws.onclose = function() {
        console.log("Отключено от сервера");
        addMessage({ 
            sender: "Система", 
            text: "Отключено от сервера. Переподключение...", 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }, false);
        
        // Пытаемся переподключиться
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 3000);
        }
    };

    ws.onerror = function(error) {
        console.error("WebSocket ошибка:", error);
    };
}

// Запускаем подключение
connectWebSocket();

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
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;

    const message = {
        sender: "Я",
        recipient: currentRecipient,
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        addMessage(message, true);
        input.value = "";
    } else {
        alert("Соединение с сервером потеряно. Пробуем переподключиться...");
        if (ws.readyState === WebSocket.CLOSED) {
            connectWebSocket();
        }
    }
}

function addMessage(data, isOwn) {
    const messages = document.getElementById("messages");
    const msg = document.createElement("div");
    msg.className = `message ${isOwn ? 'own' : 'their'}`;
    msg.innerHTML = `<b>${data.sender}</b> (${data.time})<br>${data.text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
}
