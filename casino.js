// Начальный баланс
let balance = 10000;
let isSpinning = false;

// Пути к изображениям
const symbols = [
    { file: 'cherry.png', name: 'cherry', multiplier: 2 },
    { file: 'orange.png', name: 'orange', multiplier: 3 },
    { file: 'grape.png', name: 'grape', multiplier: 4 },
    { file: 'lemon.png', name: 'lemon', multiplier: 3 },
    { file: 'seven.png', name: 'seven', multiplier: 7 },
    { file: 'diamond.png', name: 'diamond', multiplier: 6 },
    { file: 'jackpot.png', name: 'jackpot', multiplier: 10 }
];

// Для обратной совместимости с эмодзи (оставляем для определения множителей)
const symbolNames = ['cherry', 'orange', 'grape', 'lemon', 'seven', 'diamond', 'jackpot'];

// Элементы DOM
const balanceEl = document.getElementById('balance');
const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const betInput = document.getElementById('betAmount');

// Загрузка баланса
function loadBalance() {
    const saved = localStorage.getItem('casinoBalance');
    if (saved) {
        balance = parseInt(saved) || 10000;
    }
    updateBalance();
}

// Сохранение баланса
function saveBalance() {
    localStorage.setItem('casinoBalance', balance);
}

// Обновление отображения баланса
function updateBalance() {
    if (balanceEl) {
        balanceEl.textContent = balance.toFixed(0);
    }
}

// Получение HTML для символа
function getSymbolHTML(symbol) {
    return `<img src="images/${symbol.file}" alt="${symbol.name}" class="symbol-img">`;
}

// Анимация вращения
function spinAnimation() {
    return new Promise(resolve => {
        let spins = 0;
        const maxSpins = 8;
        
        reel1.classList.add('spinning');
        reel2.classList.add('spinning');
        reel3.classList.add('spinning');
        
        const interval = setInterval(() => {
            const random1 = symbols[Math.floor(Math.random() * symbols.length)];
            const random2 = symbols[Math.floor(Math.random() * symbols.length)];
            const random3 = symbols[Math.floor(Math.random() * symbols.length)];
            
            reel1.innerHTML = getSymbolHTML(random1);
            reel2.innerHTML = getSymbolHTML(random2);
            reel3.innerHTML = getSymbolHTML(random3);
            
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

// Получение символа по индексу
function getSymbolByIndex(index) {
    return symbols[index];
}

// Получение имени файла из HTML
function getSymbolFromReel(reel) {
    const img = reel.querySelector('img');
    if (!img) return symbols[0];
    
    const src = img.src.split('/').pop();
    return symbols.find(s => s.file === src) || symbols[0];
}

// Проверка выигрыша
function checkWin(sym1, sym2, sym3, bet) {
    if (sym1.name === sym2.name && sym2.name === sym3.name) {
        return bet * sym1.multiplier;
    }
    else if (sym1.name === sym2.name || sym2.name === sym3.name || sym1.name === sym3.name) {
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
    resultEl.textContent = 'Вращение...';
    
    balance -= bet;
    updateBalance();
    saveBalance();
    
    await spinAnimation();
    
    const final1 = symbols[Math.floor(Math.random() * symbols.length)];
    const final2 = symbols[Math.floor(Math.random() * symbols.length)];
    const final3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    reel1.innerHTML = getSymbolHTML(final1);
    reel2.innerHTML = getSymbolHTML(final2);
    reel3.innerHTML = getSymbolHTML(final3);
    
    const winAmount = checkWin(final1, final2, final3, bet);
    
    if (winAmount > 0) {
        balance += winAmount;
        updateBalance();
        saveBalance();
        resultEl.className = 'result win';
        
        if (final1.name === 'jackpot' && final2.name === 'jackpot' && final3.name === 'jackpot') {
            resultEl.textContent = '🎉 ДЖЕКПОТ! x10 🎉';
        } else {
            resultEl.textContent = `🎉 ВЫИГРЫШ: +${winAmount} ₴ 🎉`;
        }
    } else {
        resultEl.className = 'result lose';
        resultEl.textContent = `😔 ПРОИГРЫШ: -${bet} ₴`;
    }
    
    isSpinning = false;
    spinBtn.disabled = false;
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadBalance();
    
    // Устанавливаем начальные изображения
    reel1.innerHTML = getSymbolHTML(symbols[0]);
    reel2.innerHTML = getSymbolHTML(symbols[0]);
    reel3.innerHTML = getSymbolHTML(symbols[0]);
    
    if (betInput) {
        betInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 10) this.value = 10;
            if (value > 1000) this.value = 1000;
        });
    }
});
