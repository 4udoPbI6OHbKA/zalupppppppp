from flask import Flask, send_file, send_from_directory
from flask_socketio import SocketIO, emit
import os
import eventlet
import eventlet.wsgi

# Патч для eventlet
eventlet.monkey_patch()

app = Flask(__name__, static_folder='.')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Хранилище сообщений (для истории)
messages = []
users = set()

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@socketio.on('connect')
def handle_connect():
    print('Клиент подключился')
    users.add(request.sid)
    # Отправляем историю сообщений новому пользователю
    for msg in messages[-50:]:  # последние 50 сообщений
        emit('message', msg, room=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Клиент отключился')
    users.discard(request.sid)

@socketio.on('message')
def handle_message(data):
    print(f'Получено сообщение: {data}')
    # Добавляем в историю
    messages.append(data)
    # Отправляем всем
    emit('message', data, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"Сервер запускается на порту {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
