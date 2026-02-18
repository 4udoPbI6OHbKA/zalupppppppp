import asyncio
import websockets
import json
import os
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Хранилище клиентов {websocket: имя}
clients = {}
# Хранилище имен {имя: websocket}
client_names = {}
# История сообщений для офлайн пользователей
message_history = {}

async def chat_handler(websocket):
    """Обработчик подключения"""
    client_name = None
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            # Регистрация нового клиента
            if "register" in data:
                client_name = data["register"]
                clients[websocket] = client_name
                client_names[client_name] = websocket
                logger.info(f"[+] {client_name} подключился. Всего: {len(clients)}")
                
                # Отправляем историю сообщений, если есть
                if client_name in message_history:
                    for msg in message_history[client_name][-20:]:  # последние 20
                        await websocket.send(json.dumps(msg))
                    del message_history[client_name]
                
                # Уведомляем всех о новом пользователе
                await broadcast_system(f"👋 {client_name} присоединился к чату")
                
            # Обычное сообщение
            elif "sender" in data and "recipient" in data:
                sender = data["sender"]
                recipient = data["recipient"]
                
                logger.info(f"[→] {sender} → {recipient}: {data['text'][:30]}...")
                
                # Если получатель онлайн
                if recipient in client_names:
                    try:
                        await client_names[recipient].send(json.dumps(data))
                        logger.info(f"    ✓ Доставлено {recipient}")
                    except:
                        # Если не получилось отправить, сохраняем
                        if recipient not in message_history:
                            message_history[recipient] = []
                        message_history[recipient].append(data)
                        logger.info(f"    ✗ Ошибка отправки {recipient}, сохранено")
                else:
                    # Сохраняем для офлайн пользователя
                    if recipient not in message_history:
                        message_history[recipient] = []
                    message_history[recipient].append(data)
                    logger.info(f"    ✗ {recipient} офлайн, сообщение сохранено")
            
            # Пинг для поддержания соединения
            elif data.get("type") == "ping":
                await websocket.send(json.dumps({"type": "pong"}))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"[-] {client_name if client_name else 'Клиент'} отключился")
    except Exception as e:
        logger.error(f"[!] Ошибка: {e}")
    finally:
        # Удаляем клиента
        if websocket in clients:
            name = clients[websocket]
            del clients[websocket]
            if name in client_names:
                del client_names[name]
            logger.info(f"[-] {name} отключен. Осталось: {len(clients)}")
            await broadcast_system(f"👋 {name} покинул чат")

async def broadcast_system(message):
    """Отправляет системное сообщение всем онлайн пользователям"""
    system_msg = {
        "sender": "Система",
        "text": message,
        "time": datetime.now().strftime("%H:%M"),
        "system": True
    }
    
    offline = []
    for name, client in client_names.items():
        try:
            await client.send(json.dumps(system_msg))
        except:
            offline.append(name)
    
    # Удаляем отключившихся
    for name in offline:
        if name in client_names:
            del client_names[name]

async def main():
    """Запуск сервера"""
    # Render дает порт в переменной окружения PORT
    port = int(os.environ.get("PORT", 8765))
    host = "0.0.0.0"  # Важно: 0.0.0.0 для продакшена!
    
    logger.info(f"🚀 Сервер запускается на {host}:{port}")
    
    async with websockets.serve(
        chat_handler, 
        host, 
        port,
        ping_interval=20,
        ping_timeout=60
    ):
        logger.info(f"✅ Сервер работает! WebSocket: ws://{host}:{port}")
        await asyncio.Future()  # Работаем вечно

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Сервер остановлен")