/**
 * Settings Manager - відповідає за конфігурацію, звук та збереження прогресу з рекордами
 */

const Settings = {
    config: {
        difficulty: 4,
        volume: 0.5,
        isMuted: false,
        isMusicPlaying: false
    },
    
    // Зберігаємо об'єкти: { levelId: { time: 60, moves: 20 } }
    records: {}, 

    init() {
        this.loadFromLocalStorage();
        this.applySettings();
        this.setupEventListeners();
        this.updateMainMenuButton();
    },

    loadFromLocalStorage() {
        const saved = localStorage.getItem('puzzleGameSettings');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
        
        const savedRecords = localStorage.getItem('puzzleRecords');
        this.records = savedRecords ? JSON.parse(savedRecords) : {};
    },

    saveToLocalStorage() {
        localStorage.setItem('puzzleGameSettings', JSON.stringify(this.config));
    },

    /**
     * Збереження прогресу та перевірка рекордів
     * @returns {Object|null} Повертає старий рекорд для порівняння, або null
     */
    saveProgress(levelId, currentTime, currentMoves) {
        const oldRecord = this.records[levelId] || null;
        let isNewRecord = false;

        if (!oldRecord) {
            // Перше проходження
            this.records[levelId] = { time: currentTime, moves: currentMoves };
            isNewRecord = true;
        } else {
            // Перевіряємо чи новий результат кращий (менше ходів або менше часу)
            if (currentMoves < oldRecord.moves || (currentMoves === oldRecord.moves && currentTime < oldRecord.time)) {
                this.records[levelId] = { time: currentTime, moves: currentMoves };
                isNewRecord = true;
            }
        }

        localStorage.setItem('puzzleRecords', JSON.stringify(this.records));
        this.updateMainMenuButton();
        
        return { oldRecord, isNewRecord };
    },

    /* Повертає ID першого не пройденого рівня */
    getFirstIncompleteLevelId(allLevels) {
        if (!allLevels || allLevels.length === 0) return null;
        const completedIds = Object.keys(this.records);
        const nextLevel = allLevels.find(level => !completedIds.includes(level.id.toString()));
        return nextLevel ? nextLevel.id : allLevels[0].id; // Якщо все пройшли, повертаємо перший
    },

    /* Оновлює текст головної кнопки */
    updateMainMenuButton() {
        const btnStart = document.getElementById('btn-start-game'); // Переконайтесь, що такий ID є в HTML
        if (btnStart) {
            const hasProgress = Object.keys(this.records).length > 0;
            btnStart.innerHTML = hasProgress ? '<span>Продовжити гру</span>' : '<span>Почати гру</span>';
        }
    },

    applySettings() {
        const volSlider = document.getElementById('volume-slider');
        const diffSelect = document.getElementById('difficulty-select');
        const bgMusic = document.getElementById('bgMusic');

        if (volSlider) volSlider.value = this.config.volume;
        if (diffSelect) diffSelect.value = this.config.difficulty;
        
        if (bgMusic) {
            bgMusic.volume = this.config.volume;
            bgMusic.muted = this.config.isMuted;
        }
        this.updateMuteIcon();
    },

    setupEventListeners() {
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.config.difficulty = parseInt(e.target.value);
            this.saveToLocalStorage();
        });

        document.getElementById('volume-slider').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.config.volume = val;
            const bgMusic = document.getElementById('bgMusic');
            if (bgMusic) bgMusic.volume = val;
            this.saveToLocalStorage();
        });

        document.getElementById('btn-mute').addEventListener('click', () => {
            this.toggleMute();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.getElementById('btn-close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });
    },

    toggleMute() {
        this.config.isMuted = !this.config.isMuted;
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic) bgMusic.muted = this.config.isMuted;
        this.updateMuteIcon();
        this.saveToLocalStorage();
    },

    updateMuteIcon() {
        const btn = document.getElementById('btn-mute');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = this.config.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
    },

    playMusic() {
        const audio = document.getElementById('bgMusic');
        if (audio && !this.config.muted) {
            audio.play().catch(e => console.log("Браузер заблокував автозапуск:", e));
        }
    },

    pauseMusic() {
        const audio = document.getElementById('bgMusic');
        if (audio) {
            audio.pause();
        }
    },
    
    playSound(soundId) {
        if (this.config.isMuted) return;
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    },
    
    manageMusic(action) {
        const music = document.getElementById('bgMusic');
        if (!music) return;
    
        if (action === 'play' && !this.config.isMuted) {
            music.play().catch(() => {});
        } else {
            music.pause();
        }
    }

};


Settings.init();
