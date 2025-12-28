/**
 * Game Engine - Режим "Обміну" (Swap) з підтримкою рекордів та музики
 */

const Game = {
    board: document.getElementById('puzzle-board'),
    imageSrc: '',
    currentLevelId: null,
    size: 4,
    sortable: null,

    // Статистика
    moves: 0,
    seconds: 0,
    timerInterval: null,
    isPaused: false,

    /* Ініціалізація */
    init() {
        this.setupEventListeners();
    },

    /* Прив'язка подій до кнопок */
    setupEventListeners() {
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.onclick = () => this.pauseGame();

        const btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.onclick = () => this.resumeGame();

        const btnHint = document.getElementById('btn-hint');
        if (btnHint) {
            btnHint.onmousedown = () => this.toggleHint(true);
            btnHint.onmouseup = () => this.toggleHint(false);
            btnHint.onmouseleave = () => this.toggleHint(false);
            btnHint.ontouchstart = (e) => { e.preventDefault(); this.toggleHint(true); };
            btnHint.ontouchend = (e) => { e.preventDefault(); this.toggleHint(false); };
        }
    },

    /* Запуск рівня */
    start(imageSrc, levelId) {
        this.imageSrc = imageSrc;
        this.currentLevelId = levelId;
        this.size = Settings.config.difficulty; 
        this.moves = 0;
        this.seconds = 0;
        this.isPaused = false;
        
        this.board.innerHTML = '';
        this.createPuzzle();
        this.startTimer();
        this.updateStats();

        // Запускаємо музику
        Settings.manageMusic('play');
    },

    /* Створення сітки */
    createPuzzle() {
        // Розрахунок розмірів для адаптивності
        const boardSize = Math.min(window.innerWidth * 0.9, 500);
        const tileSize = boardSize / this.size;

        this.board.style.width = boardSize + 'px';
        this.board.style.height = boardSize + 'px';
        this.board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.board.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

        let pieces = [];
        for (let i = 0; i < this.size * this.size; i++) pieces.push(i);
        
        // Перемішування
        do {
            pieces.sort(() => Math.random() - 0.5);
        } while (this.isAlreadySolved(pieces));

        pieces.forEach(idx => {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.dataset.index = idx; 
            piece.style.backgroundImage = `url(${this.imageSrc})`;
            piece.style.backgroundSize = `${boardSize}px ${boardSize}px`;
            
            const r = Math.floor(idx / this.size);
            const c = idx % this.size;
            piece.style.backgroundPosition = `-${c * tileSize}px -${r * tileSize}px`;
            this.board.appendChild(piece);
        });

        this.initSortable();
        this.checkLockedPieces(); 
    },

    initSortable() {
        if (this.sortable) this.sortable.destroy();
        this.sortable = new Sortable(this.board, {
            swap: true, 
            swapClass: 'sortable-swap-highlight', 
            animation: 200,
            filter: '.locked', 
            onMove: (evt) => !evt.related.classList.contains('locked'),
            onEnd: () => {
                this.moves++;
                Settings.playSound('clickSound'); 
                this.updateStats();
                this.checkLockedPieces();
                this.checkWin();
            }
        });
    },

    checkLockedPieces() {
        const items = this.board.querySelectorAll('.puzzle-piece');
        items.forEach((item, currentIndex) => {
            if (parseInt(item.dataset.index) === currentIndex) {
                item.classList.add('locked');
                item.setAttribute('draggable', 'false');
            } else {
                item.classList.remove('locked');
                item.setAttribute('draggable', 'true');
            }
        });
    },

    isAlreadySolved(pieces) {
        return pieces.every((val, index) => val === index);
    },

    /* Таймер та статистика */
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) { this.seconds++; this.updateStats(); }
        }, 1000);
    },

    stopTimer() { clearInterval(this.timerInterval); },

    updateStats() {
        const timerEl = document.getElementById('timer');
        const movesEl = document.getElementById('moves');
        if (timerEl) timerEl.innerText = this.formatTime(this.seconds);
        if (movesEl) movesEl.innerText = this.moves;
    },

    formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    /* Завершення гри */
    checkWin() {
        const lockedCount = this.board.querySelectorAll('.locked').length;
        if (lockedCount === this.size * this.size) {
            this.stopTimer();
            const recordData = Settings.saveProgress(this.currentLevelId, this.seconds, this.moves);
            setTimeout(() => this.showWinModal(recordData), 500);
        }
    },

    showWinModal(recordData) {
        const winModal = document.getElementById('win-modal');
        const finalTime = document.getElementById('final-time');
        const finalMoves = document.getElementById('final-moves');
        const bestTimeEl = document.getElementById('best-time');
        const bestMovesEl = document.getElementById('best-moves');
        const badge = document.getElementById('new-record-badge');

        if (finalTime) finalTime.innerText = this.formatTime(this.seconds);
        if (finalMoves) finalMoves.innerText = this.moves;

        if (recordData) {
            const { oldRecord, isNewRecord } = recordData;
            if (badge) isNewRecord ? badge.classList.remove('hidden') : badge.classList.add('hidden');

            if (bestTimeEl && bestMovesEl) {
                if (isNewRecord) {
                    bestTimeEl.innerText = this.formatTime(this.seconds);
                    bestMovesEl.innerText = this.moves;
                } else if (oldRecord) {
                    bestTimeEl.innerText = this.formatTime(oldRecord.time);
                    bestMovesEl.innerText = oldRecord.moves;
                }
            }
        }

        if (winModal) winModal.classList.remove('hidden');
        if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    },

    toggleHint(show) {
        const hint = document.getElementById('hint-overlay');
        const img = document.getElementById('hint-image');
        if (show) { img.src = this.imageSrc; hint.classList.remove('hidden'); }
        else { hint.classList.add('hidden'); }
    },

    pauseGame() {
        if (this.seconds === 0 && this.moves === 0) return;
        this.isPaused = true;
        document.getElementById('pause-modal').classList.remove('hidden');
        
        // Ставимо музику на паузу
        Settings.manageMusic('pause');
    },

    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-modal').classList.add('hidden');
        
        // Продовжуємо музику
        Settings.manageMusic('play');
    }
};

Game.init();