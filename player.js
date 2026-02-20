// Глобальные переменные для аудио
let currentAudio = null;
let currentTrack = 0;
let isPlaying = false;
let updateTimer = null;

// URL треков (бесплатные демо-треки)
// URL треков (локальные файлы)
const tracks = {
    1: {
        url: '/music/track1.mp3',  // или 'music/track1.mp3'
        name: 'Название трека 1',
        artist: 'Исполнитель 1'
    },
    2: {
        url: '/music/track2.mp3',
        name: 'Название трека 2',
        artist: 'Исполнитель 2'
    },
    3: {
        url: '/music/track3.mp3',
        name: 'Название трека 3',
        artist: 'Исполнитель 3'
    }
};

// Функция закрытия плеера
function closePlayer() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    window.location.href = '/';
}

// Функция воспроизведения трека
function playTrack(trackNumber) {
    // Останавливаем предыдущий трек
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Убираем класс playing у всех треков
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('playing');
    });

    // Добавляем класс playing выбранному треку
    document.getElementById(`track${trackNumber}`).classList.add('playing');

    // Создаем новый аудио объект
    currentAudio = new Audio(tracks[trackNumber].url);
    currentAudio.volume = document.getElementById('volumeSlider').value;
    
    // Обновляем информацию о текущем треке
    document.getElementById('nowPlaying').textContent = `${tracks[trackNumber].name} - ${tracks[trackNumber].artist}`;
    
    // Включаем кнопку стоп
    document.getElementById('stopBtn').disabled = false;
    
    // Меняем текст кнопки на "Пауза"
    document.getElementById('playPauseIcon').textContent = '⏸';
    document.getElementById('playPauseBtn').innerHTML = '<span id="playPauseIcon">⏸</span> Пауза';
    
    // Воспроизводим
    currentAudio.play().catch(error => {
        console.log('Ошибка воспроизведения:', error);
        alert('Не удалось воспроизвести трек. Попробуйте другой.');
    });
    
    isPlaying = true;
    currentTrack = trackNumber;

    // Обновляем прогресс
    startProgressUpdate();

    // Обработчик окончания трека
    currentAudio.onended = function() {
        stopPlayback();
    };

    // Загружаем длительность
    currentAudio.addEventListener('loadedmetadata', function() {
        document.getElementById('duration').textContent = formatTime(currentAudio.duration);
    });
}

// Функция паузы/воспроизведения
function togglePlayPause() {
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        document.getElementById('playPauseIcon').textContent = '▶';
        document.getElementById('playPauseBtn').innerHTML = '<span id="playPauseIcon">▶</span> Играть';
        stopProgressUpdate();
    } else {
        currentAudio.play().catch(error => {
            console.log('Ошибка воспроизведения:', error);
        });
        document.getElementById('playPauseIcon').textContent = '⏸';
        document.getElementById('playPauseBtn').innerHTML = '<span id="playPauseIcon">⏸</span> Пауза';
        startProgressUpdate();
    }
    
    isPlaying = !isPlaying;
}

// Функция остановки
function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    isPlaying = false;
    currentTrack = 0;
    
    // Обновляем UI
    document.getElementById('nowPlaying').textContent = 'Не выбран';
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('playPauseIcon').textContent = '▶';
    document.getElementById('playPauseBtn').innerHTML = '<span id="playPauseIcon">▶</span> Играть';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    document.getElementById('duration').textContent = '0:00';
    
    // Убираем класс playing у всех треков
    document.querySelectorAll('.track-item').forEach(item => {
        item.classList.remove('playing');
    });
    
    stopProgressUpdate();
}

// Функция установки громкости
document.getElementById('volumeSlider').addEventListener('input', function(e) {
    if (currentAudio) {
        currentAudio.volume = e.target.value;
    }
});

// Функция перемотки
function seek(event) {
    if (!currentAudio) return;
    
    const progressBar = document.getElementById('progressBar');
    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    
    currentAudio.currentTime = pos * currentAudio.duration;
}

// Обновление прогресса
function startProgressUpdate() {
    stopProgressUpdate();
    updateTimer = setInterval(updateProgress, 100);
}

function stopProgressUpdate() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
}

function updateProgress() {
    if (!currentAudio || !currentAudio.duration) return;
    
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentTime').textContent = formatTime(currentAudio.currentTime);
}

// Форматирование времени
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Обработка клавиш
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && currentAudio) {
        event.preventDefault();
        togglePlayPause();
    }
});

// Сохраняем состояние при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (currentAudio) {
        currentAudio.pause();
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Плеер загружен');
});
