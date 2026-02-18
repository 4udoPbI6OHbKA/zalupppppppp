import asyncio
import websockets
import json
import os
import logging
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import socket

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Хранилище клиентов
clients = {}
client_names = {}
message_history = {}

# WebSocket обработчик
async def chat_handler(websocket):
    """Обработчик WebSocket подключений"""
    client_name = None
    
    try:
        logger.info(f"🔄 Новое WebSocket подключение с {websocket.remote_address}")
        
        async for message in websocket:
            data = json.loads(message)
            logger.info(f"📨 Получено сообщение: {data}")
            
            # Регистрация нового клиента
            if "register" in data:
                client_name = data["register"]
                clients[websocket] = client_name
                client_names[client_name] = websocket
                logger.info(f"✅ {client_name} зарегистрирован. Всего: {len(clients)}")
                
                # Подтверждение регистрации
                await websocket.send(json.dumps({
                    "sender": "Система",
                    "text": f"👋 Ты зарегистрирован как {client_name}",
                    "time": datetime.now().strftime("%H:%M"),
                    "system": True
                }))
                
                # Уведомляем всех
                await broadcast_system(f"👋 {client_name} присоединился к чату")
                
            # Обычное сообщение
            elif "sender" in data and "recipient" in data:
                sender = data["sender"]
                recipient = data["recipient"]
                
                logger.info(f"📧 {sender} → {recipient}: {data['text'][:30]}")
                
                # Отправляем получателю
                if recipient in client_names:
                    try:
                        await client_names[recipient].send(json.dumps(data))
                        logger.info(f"   ✅ Доставлено {recipient}")
                    except:
                        # Сохраняем в историю
                        if recipient not in message_history:
                            message_history[recipient] = []
                        message_history[recipient].append(data)
                else:
                    # Сохраняем для офлайн
                    if recipient not in message_history:
                        message_history[recipient] = []
                    message_history[recipient].append(data)
                    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"📴 {client_name} отключился")
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
    finally:
        if websocket in clients:
            name = clients[websocket]
            del clients[websocket]
            if name in client_names:
                del client_names[name]
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

# HTTP сервер для раздачи статических файлов
def start_http_server():
    """Запускает HTTP сервер для раздачи HTML, CSS, JS"""
    port = int(os.environ.get("PORT", 10000))
    
    # Создаем HTTP сервер, который раздает файлы из текущей директории
    handler = SimpleHTTPRequestHandler
    
    # Настраиваем CORS для HTTP
    class CORSHTTPRequestHandler(handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    httpd = HTTPServer(('0.0.0.0', port), CORSHTTPRequestHandler)
    logger.info(f"🌐 HTTP сервер запущен на порту {port}")
    logger.info(f"📱 Открой сайт: http://localhost:{port} или https://твой-проект.onrender.com")
    httpd.serve_forever()

async def main():
    """Главная функция"""
    # Получаем порт из переменной окружения Render
    port = int(os.environ.get("PORT", 10000))
    
    logger.info("="*50)
    logger.info("🚀 ЗАПУСК МЕССЕНДЖЕРА")
    logger.info("="*50)
    
    # Запускаем HTTP сервер в отдельном потоке
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()
    logger.info("✅ HTTP сервер запущен в фоне")
    
    # Запускаем WebSocket сервер
    ws_port = port  # Используем тот же порт для WebSocket
    logger.info(f"🔌 Запуск WebSocket сервера на порту {ws_port}")
    
    async with websockets.serve(
        chat_handler,
        "0.0.0.0",
        ws_port,
        ping_interval=20,
        ping_timeout=60,
        max_size=10**6,
        origins=None  # Разрешаем все источники
    ):
        logger.info(f"✅ WebSocket сервер работает на порту {ws_port}")
        logger.info(f"📱 Полный адрес: wss://{os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'localhost')}:{ws_port}")
        logger.info("="*50)
        logger.info("✨ Сервер готов к работе!")
        logger.info("="*50)
        
        # Держим сервер запущенным
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Сервер остановлен")
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
