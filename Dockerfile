FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директорию для изображений, если её нет
RUN mkdir -p images

# Добавляем тестовое изображение (можно заменить на своё)
RUN echo "Заглушка для изображения" > images/hqdefault.jpg

EXPOSE $PORT

CMD ["python", "server.py"]
