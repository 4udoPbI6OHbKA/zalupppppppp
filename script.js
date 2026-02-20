// Функции для меню и плеера
function toggleMenu() {
    const menu = document.getElementById('player-menu');
    menu.classList.toggle('hidden');
}

function playTrack(trackNumber) {
    let trackName = '';
    let audioUrl = '';
    
    switch(trackNumber) {
        case 1:
            trackName = 'Трек 1 - Энергия';
            audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
            break;
        case 2:
            trackName = 'Трек 2 - Спокойствие';
            audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
            break;
        case 3:
            trackName = 'Трек 3 - Вдохновение';
            audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
            break;
    }
    
    // Обновляем отображение
    document.getElementById('now-playing').textContent = 'Сейчас играет: ' + trackName;
    
    // Если уже есть аудиоплеер, останавливаем его
    if (window.currentAudio) {
        window.currentAudio.pause();
    }
    
    // Создаем новый аудио элемент
    window.currentAudio = new Audio(audioUrl);
    window.currentAudio.play();
    
    // Добавляем кнопку остановки
    addStopButton();
}

function addStopButton() {
    const playerControls = document.querySelector('.player-controls');
    
    // Удаляем старую кнопку если есть
    const oldStopBtn = document.getElementById('stop-button');
    if (oldStopBtn) {
        oldStopBtn.remove();
    }
    
    // Создаем новую кнопку
    const stopBtn = document.createElement('button');
    stopBtn.id = 'stop-button';
    stopBtn.textContent = '⏹ Остановить';
    stopBtn.style.marginTop = '10px';
    stopBtn.style.width = '100%';
    stopBtn.onclick = function() {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.currentTime = 0;
            document.getElementById('now-playing').textContent = 'Сейчас не играет';
        }
    };
    
    playerControls.appendChild(stopBtn);
}

// Закрываем меню при клике вне его
document.addEventListener('click', function(event) {
    const menu = document.getElementById('player-menu');
    const menuButton = document.querySelector('.menu-button');
    
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
        menu.classList.add('hidden');
    }
});
