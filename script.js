// Определяем URL WebSocket в зависимости от окружения
const WS_URL = window.location.hostname === "localhost" 
    ? "ws://localhost:8765" 
    : `wss://${window.location.host}`;

const ws = new WebSocket(WS_URL);
let currentRecipient = "себе";

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

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        addMessage(message, true);
        input.value = "";
    } else {
        alert("Соединение с сервером потеряно. Пробуем переподключиться...");
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

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    addMessage(data, false);
};

ws.onopen = function() {
    console.log("Подключено к серверу");
    addMessage({ 
        sender: "Система", 
        text: "Вы подключены к чату", 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }, false);
};

ws.onclose = function() {
    console.log("Отключено от сервера");
    addMessage({ 
        sender: "Система", 
        text: "Отключено от сервера. Пытаемся переподключиться...", 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }, false);
    
    // Пытаемся переподключиться через 3 секунды
    setTimeout(() => {
        window.location.reload();
    }, 3000);
};

ws.onerror = function(error) {
    console.error("WebSocket ошибка:", error);
};
