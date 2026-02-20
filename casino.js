// Начальный баланс
let balance = 10000;
let isSpinning = false;

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

// Анимация вращения
function spinAnimation() {
    return new Promise(resolve => {
        let spins = 0;
        const maxSpins = 8;
        
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
    resultEl.textContent = 'Вращение...';
    
    balance -= bet;
    updateBalance();
    saveBalance();
    
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
        updateBalance();
        saveBalance();
        resultEl.className = 'result win';
        
        if (final1 === '🎰' && final2 === '🎰' && final3 === '🎰') {
            resultEl.textContent = '🎉 ДЖЕКПОТ! x10 🎉';
        } else if (final1 === final2 && final2 === final3) {
            resultEl.textContent = `🎉 ВЫИГРЫШ: +${winAmount} ₴ 🎉`;
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
    
    if (betInput) {
        betInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 10) this.value = 10;
            if (value > 1000) this.value = 1000;
        });
    }
});
