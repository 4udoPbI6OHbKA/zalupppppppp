// Определяем URL для подключения
const WS_PORT = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
const WS_URL = `wss://${window.location.hostname}:10001`; // Явно указываем порт WebSocket

console.log("Подключение к WebSocket:", WS_URL);

let ws;
let currentRecipient = "себе";
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

function connectWebSocket() {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = function() {
        console.log("✅ Подключено к серверу");
        document.getElementById("connection-status").textContent = "🟢 Онлайн";
        document.getElementById("connection-status").style.color = "#2ecc71";
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
            console.error("Ошибка парсинга:", e);
        }
    };

    ws.onclose = function() {
        console.log("❌ Отключено от сервера");
        document.getElementById("connection-status").textContent = "🔴 Офлайн";
        document.getElementById("connection-status").style.color = "#e74c3c";
        
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 3000);
        }
    };

    ws.onerror = function(error) {
        console.error("WebSocket ошибка:", error);
    };
}

// Запускаем через 1 секунду после загрузки страницы
window.addEventListener('load', function() {
    setTimeout(connectWebSocket, 1000);
});

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
        alert("Нет подключения к серверу. Пробуем переподключиться...");
        connectWebSocket();
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
