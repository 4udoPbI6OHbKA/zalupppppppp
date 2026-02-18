import asyncio
import websockets
import json
import os
import threading
import socket
import http.server
import socketserver

clients = set()
PORT = int(os.environ.get("PORT", 10000))  # Render дает PORT

# WebSocket обработчик
async def chat_handler(websocket):
    clients.add(websocket)
    print(f"Новый пользователь. Всего: {len(clients)}")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Сообщение: {data}")
            # Отправляем всем кроме отправителя
            for client in clients:
                if client != websocket:
                    try:
                        await client.send(json.dumps(data))
                    except:
                        pass
    except websockets.exceptions.ConnectionClosed:
        print("Клиент отключился")
    finally:
        clients.discard(websocket)

# HTTP обработчик для статических файлов
class HTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

# Функция для запуска HTTP сервера
def run_http_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = HTTPHandler
    
    with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"HTTP сервер запущен на порту {PORT}")
        httpd.serve_forever()

# Функция для запуска WebSocket сервера
async def run_websocket_server():
    # Используем другой порт для WebSocket
    ws_port = PORT + 1  # 10001
    async with websockets.serve(chat_handler, "0.0.0.0", ws_port):
        print(f"WebSocket сервер запущен на порту {ws_port}")
        await asyncio.Future()

async def main():
    # Запускаем HTTP в отдельном потоке
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    
    # Запускаем WebSocket
    await run_websocket_server()

if __name__ == "__main__":
    print(f"Сервер запускается... PORT={PORT}")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nСервер остановлен")
