import asyncio
import websockets
import json
import os

clients = set()

async def chat_handler(websocket):
    clients.add(websocket)
    print("Новый пользователь подключился")
    
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
        print(f"Клиентов онлайн: {len(clients)}")

async def main():
    # Получаем порт из переменных окружения Render
    port = int(os.environ.get("PORT", 8765))
    host = "0.0.0.0"  # Важно: на Render нужно слушать все интерфейсы
    
    async with websockets.serve(chat_handler, host, port):
        print(f"Сервер запущен на {host}:{port}")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
