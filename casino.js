// Начальный баланс
let balance = 10000;
let isSpinning = false;
let gamesPlayed = 0;
let winsCount = 0;
let maxWin = 0;

// Символы для слотов
const symbols = ['🍒', '🍊', '🍇', '🍋', '7️⃣', '💎', '🎰'];

// Множители выигрыша
const multipliers = {
    '🎰': 10,
    '7️⃣': 7,
    '💎': 6,
    '🍇': 5,
    '🍊': 4,
    '🍋': 3,
    '🍒': 2
};

// Элементы DOM
const balanceEl = document.getElementById('balance');
const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const betInput = document.getElementById('betAmount');
const historyList = document.getElementById('historyList');
const gamesPlayedEl = document.getElementById('gamesPlayed');
const winsCountEl = document.getElementById('winsCount');
const maxWinEl = document.getElementById('maxWin');

// Обновление отображения баланса и статистики
function updateDisplay() {
    if (balanceEl) balanceEl.textContent = balance.toFixed(0);
    if (gamesPlayedEl) gamesPlayedEl.textContent = gamesPlayed;
    if (winsCountEl) winsCountEl.textContent = winsCount;
    if (maxWinEl) maxWinEl.textContent = maxWin + ' ₴';
}

// Сохранение состояния в localStorage
function saveGameState() {
    const gameState = {
        balance: balance,
        gamesPlayed: gamesPlayed,
        winsCount: winsCount,
        maxWin: maxWin,
        history: []
    };
    
    // Сохраняем историю
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        gameState.history.push(item.outerHTML);
    });
    
    localStorage.setItem('casinoState', JSON.stringify(gameState));
}

// Загрузка состояния из localStorage
function loadGameState() {
    const savedState = localStorage.getItem('casinoState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            balance = state.balance || 10000;
            gamesPlayed = state.gamesPlayed || 0;
            winsCount = state.winsCount || 0;
            maxWin = state.maxWin || 0;
            
            // Восстанавливаем историю
            if (state.history && historyList) {
                historyList.innerHTML = state.history.join('');
            }
            
            updateDisplay();
        } catch (e) {
            console.log('Ошибка загрузки состояния');
        }
    }
}

// Добавление записи в историю
function addToHistory(bet, win, symbols) {
    if (!historyList) return;
    
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${win > 0 ? 'win-item' : 'lose-item'}`;
    
    const date = new Date();
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    
    historyItem.innerHTML = `
        <span>${symbols.join(' ')}</span>
        <span>${time} | ${win > 0 ? '+' + win.toFixed(0) : '-' + bet.toFixed(0)} ₴</span>
    `;
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Ограничиваем историю 10 записями
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    saveGameState();
}

// Анимация вращения
function spinAnimation() {
    return new Promise(resolve => {
        let spins = 0;
        const maxSpins = 10;
        
        reel1.classList.add('spinning');
        reel2.classList.add('spinning');
        reel3.classList.add('spinning');
        
        const interval = setInterval(() => {
            reel1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            
            spins++;
            if (spins >= maxSpins) {
                clearInterval(interval);
                reel1.classList.remove('spinning');
                reel2.classList.remove('spinning');
                reel3.classList.remove('spinning');
                resolve();
            }
        }, 100);
    });
}

// Проверка выигрыша
function checkWin(sym1, sym2, sym3, bet) {
    if (sym1 === sym2 && sym2 === sym3) {
        const multiplier = multipliers[sym1] || 2;
        return bet * multiplier;
    }
    else if (sym1 === sym2 || sym2 === sym3 || sym1 === sym3) {
        return bet * 1.5;
    }
    return 0;
}

// Основная функция вращения
async function spin() {
    if (isSpinning) return;
    
    const bet = parseInt(betInput.value);
    
    if (bet < 10) {
        alert('Минимальная ставка 10 ₴');
        betInput.value = 10;
        return;
    }
    
    if (bet > 1000) {
        alert('Максимальная ставка 1000 ₴');
        betInput.value = 1000;
        return;
    }
    
    if (bet > balance) {
        alert('Недостаточно средств!');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.className = 'result';
    resultEl.textContent = '🎰 Вращение...';
    
    balance -= bet;
    gamesPlayed++;
    updateDisplay();
    
    await spinAnimation();
    
    const final1 = symbols[Math.floor(Math.random() * symbols.length)];
    const final2 = symbols[Math.floor(Math.random() * symbols.length)];
    const final3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    reel1.textContent = final1;
    reel2.textContent = final2;
    reel3.textContent = final3;
    
    const winAmount = checkWin(final1, final2, final3, bet);
    
    if (winAmount > 0) {
        balance += winAmount;
        winsCount++;
        
        if (winAmount > maxWin) {
            maxWin = winAmount;
        }
        
        updateDisplay();
        resultEl.className = 'result win';
        
        let winText = '';
        if (final1 === '🎰' && final2 === '🎰' && final3 === '🎰') {
            winText = '🎉 ДЖЕКПОТ! x10 🎉';
        } else if (final1 === final2 && final2 === final3) {
            winText = `🎉 ВЫИГРЫШ: +${winAmount.toFixed(0)} ₴ (x${multipliers[final1] || 2}) 🎉`;
        } else {
            winText = `🎉 ВЫИГРЫШ: +${winAmount.toFixed(0)} ₴ (x1.5) 🎉`;
        }
        resultEl.textContent = winText;
    } else {
        resultEl.className = 'result lose';
        resultEl.textContent = `😔 ПРОИГРЫШ: -${bet} ₴`;
    }
    
    addToHistory(bet, winAmount, [final1, final2, final3]);
    
    isSpinning = false;
    spinBtn.disabled = false;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    
    if (betInput) {
        betInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 10) {
                this.value = 10;
            } else if (value > 1000) {
                this.value = 1000;
            }
        });

        betInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                spin();
            }
        });
    }
    
    // Добавляем приветственное сообщение в историю, если она пуста
    if (historyList && historyList.children.length === 0) {
        addToHistory(0, 0, ['🎰', '🎰', '🎰']);
    }
});

// Сохраняем состояние при закрытии страницы
window.addEventListener('beforeunload', function() {
    saveGameState();
});
