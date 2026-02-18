import asyncio
import websockets
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import socket

# Множество подключенных клиентов WebSocket
clients = set()

# WebSocket обработчик
async def chat_handler(websocket):
    clients.add(websocket)
    print(f"Новый пользователь подключился. Всего клиентов: {len(clients)}")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Получено сообщение: {data}")
            # Отправляем сообщение всем клиентам кроме отправителя
            for client in clients.copy():
                if client != websocket:
                    try:
                        await client.send(json.dumps(data))
                    except:
                        pass
    except websockets.exceptions.ConnectionClosed:
        print("Клиент отключился")
    finally:
        clients.discard(websocket)
        print(f"Клиент отключился. Осталось: {len(clients)}")

# Функция для запуска WebSocket сервера
async def start_websocket_server():
    port = int(os.environ.get("WS_PORT", 8765))
    host = "0.0.0.0"
    
    async with websockets.serve(chat_handler, host, port):
        print(f"WebSocket сервер запущен на {host}:{port}")
        await asyncio.Future()

# HTTP сервер для статических файлов
def start_http_server():
    port = int(os.environ.get("PORT", 10000))
    host = "0.0.0.0"
    
    # Создаем директорию для текущей работы
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = SimpleHTTPRequestHandler
    
    # Добавляем CORS заголовки
    class CORSHTTPRequestHandler(handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def do_GET(self):
            if self.path == '/':
                self.path = '/index.html'
            return super().do_GET()
    
    httpd = HTTPServer((host, port), CORSHTTPRequestHandler)
    print(f"HTTP сервер запущен на http://{host}:{port}")
    httpd.serve_forever()

# Функция для получения свободного порта
def get_free_port():
    sock = socket.socket()
    sock.bind(('', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port

async def main():
    # Запускаем HTTP сервер в отдельном потоке
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Запускаем WebSocket сервер
    await start_websocket_server()

if __name__ == "__main__":
    print("Запуск сервера...")
    print(f"Текущая директория: {os.getcwd()}")
    print(f"Файлы в директории: {os.listdir('.')}")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nСервер остановлен")
