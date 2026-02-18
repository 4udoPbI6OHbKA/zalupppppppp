import asyncio
import websockets
import json
import os
import logging
from datetime import datetime
from websockets.server import WebSocketServerProtocol
from websockets.http import Headers

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Хранилище клиентов
clients = {}
client_names = {}
message_history = {}

async def chat_handler(websocket: WebSocketServerProtocol):
    """Обработчик подключения с поддержкой CORS"""
    client_name = None
    
    try:
        # Принимаем соединение с любыми заголовками
        logger.info(f"Новое подключение с {websocket.remote_address}")
        
        async for message in websocket:
            data = json.loads(message)
            logger.info(f"Получено сообщение: {data}")
            
            # Регистрация нового клиента
            if "register" in data:
                client_name = data["register"]
                clients[websocket] = client_name
                client_names[client_name] = websocket
                logger.info(f"[+] {client_name} подключился. Всего: {len(clients)}")
                
                # Подтверждение регистрации
                await websocket.send(json.dumps({
                    "sender": "Система",
                    "text": f"Ты зарегистрирован как {client_name}",
                    "time": datetime.now().strftime("%H:%M"),
                    "system": True
                }))
                
                # Отправляем историю
                if client_name in message_history:
                    for msg in message_history[client_name][-20:]:
                        await websocket.send(json.dumps(msg))
                    del message_history[client_name]
                
                # Уведомляем всех
                await broadcast_system(f"👋 {client_name} присоединился к чату")
                
            # Обычное сообщение
            elif "sender" in data and "recipient" in data:
                sender = data["sender"]
                recipient = data["recipient"]
                
                logger.info(f"[→] {sender} → {recipient}: {data['text'][:30]}")
                
                if recipient in client_names:
                    try:
                        await client_names[recipient].send(json.dumps(data))
                        logger.info(f"    ✓ Доставлено {recipient}")
                    except:
                        if recipient not in message_history:
                            message_history[recipient] = []
                        message_history[recipient].append(data)
                else:
                    if recipient not in message_history:
                        message_history[recipient] = []
                    message_history[recipient].append(data)
                    
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"[-] Соединение закрыто: {e}")
    except Exception as e:
        logger.error(f"[!] Ошибка: {e}")
    finally:
        if websocket in clients:
            name = clients[websocket]
            del clients[websocket]
            if name in client_names:
                del client_names[name]
            logger.info(f"[-] {name} отключен")
            await broadcast_system(f"👋 {name} покинул чат")

async def broadcast_system(message):
    """Отправка системных сообщений"""
    system_msg = {
        "sender": "Система",
        "text": message,
        "time": datetime.now().strftime("%H:%M"),
        "system": True
    }
    
    for name, client in list(client_names.items()):
        try:
            await client.send(json.dumps(system_msg))
        except:
            pass

async def main():
    """Запуск сервера"""
    port = int(os.environ.get("PORT", 8765))
    host = "0.0.0.0"
    
    logger.info(f"🚀 Сервер запускается на {host}:{port}")
    
    # Настройки сервера с поддержкой CORS
    async def handler_with_cors(websocket, path):
        # Добавляем CORS заголовки в ответ
        await chat_handler(websocket)
    
    async with websockets.serve(
        handler_with_cors,
        host, 
        port,
        ping_interval=20,
        ping_timeout=60,
        max_size=10**6,
        # Разрешаем все origin (для разработки)
        origins=None  # Это важно - разрешает все источники
    ):
        logger.info(f"✅ Сервер работает!")
        logger.info(f"📱 Открой сайт: https://{os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'localhost')}")
        
        # Держим сервер запущенным
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Сервер остановлен")
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
