/**
 * Main Controller - керування екранами, галереєю та ініціалізація
 */

const Main = {
    levels: [], // заповнюється з json
    currentLevelIndex: 0,

    async init() {
        try {
            // 1. Завантажуємо дані рівнів
            const response = await fetch('../levels.json');
            this.levels = await response.json();
            
            // 2. Ініціалізуємо навігацію та модулі
            this.setupNavigation();
            this.setupImageUpload();
            
            // 3. Оновлюємо інтерфейс (текст кнопки та галерею)
            Settings.updateMainMenuButton(); 
            this.renderGallery();
            
            console.log("Додаток ініціалізовано, рівнів завантажено:", this.levels.length);
        } catch (error) {
            console.error("Помилка завантаження рівнів:", error);
        }
    },

    /* Відображення списку рівнів у галереї з рекордами */
    renderGallery() {
        const container = document.getElementById('levels-grid');
        if (!container) return;

        container.innerHTML = ''; 

        this.levels.forEach((level, index) => {
            // Отримуємо рекорд для цього рівня з Settings
            const record = Settings.records[level.id];
            const isCompleted = !!record;
            
            const card = document.createElement('div');
            card.className = `level-card ${isCompleted ? 'completed' : ''}`;
            
            // Форматуємо час рекорду для відображення
            const timeText = isCompleted ? this.formatTime(record.time) : '--:--';
            const movesText = isCompleted ? record.moves : '--';

            card.innerHTML = `
                <div class="level-badge">${isCompleted ? '<i class="fas fa-check"></i>' : index + 1}</div>
                <img src="${level.img}" alt="${level.title}">
                <div class="level-info">
                    <span class="level-title">${level.title}</span>
                    ${isCompleted ? `
                        <div class="level-record">
                            <span><i class="fas fa-clock"></i> ${timeText}</span>
                            <span><i class="fas fa-redo"></i> ${movesText}</span>
                        </div>
                    ` : '<span class="not-played">Ще не пройдено</span>'}
                </div>
            `;

            card.onclick = () => {
                this.currentLevelIndex = index;
                this.switchScreen('game-screen');
                Game.start(level.img, level.id);
            };

            container.appendChild(card);
        });
    },

    /* Перемикання екранів */
    switchScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        const target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');
        
        // Закриваємо модальні вікна при переході
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    },

    /* Налаштування кнопок меню та навігації */
    setupNavigation() {
        // Логіка кнопки ПОЧАТИ / ПРОДОВЖИТИ
        document.getElementById('btn-start').onclick = () => {
            // Шукаємо ID першого непройденого рівня через Settings
            const nextLevelId = Settings.getFirstIncompleteLevelId(this.levels);
            
            // Знаходимо індекс цього рівня в нашому масиві
            const index = this.levels.findIndex(l => l.id == nextLevelId);
            this.currentLevelIndex = index !== -1 ? index : 0;
            
            const levelToStart = this.levels[this.currentLevelIndex];
            
            this.switchScreen('game-screen');
            Game.start(levelToStart.img, levelToStart.id);
            Settings.playMusic();
        };

        // Галерея
        document.getElementById('btn-gallery').onclick = () => {
            this.renderGallery(); 
            this.switchScreen('gallery-screen');
        };

        // Назад з галереї
        document.getElementById('btn-gallery-back').onclick = () => {
            this.switchScreen('main-menu');
        };

        // Кнопки виходу в меню (з паузи та перемоги)
        const backToMenuBtns = ['btn-to-menu', 'btn-win-to-menu'];
        backToMenuBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = () => {
                    Game.stopTimer();
                    this.switchScreen('main-menu');
                    Settings.updateMainMenuButton(); // Оновлюємо текст кнопки при поверненні
                };
            }
        });

        // Наступний рівень у вікні перемоги
        document.getElementById('btn-next-level').onclick = () => {
            // Переходимо до наступного за списком
            this.currentLevelIndex = (this.currentLevelIndex + 1) % this.levels.length;
            const nextLevel = this.levels[this.currentLevelIndex];
            
            this.switchScreen('game-screen');
            Game.start(nextLevel.img, nextLevel.id);
        };
    },

    /* Завантаження власного зображення */
    setupImageUpload() {
        const trigger = document.getElementById('btn-upload-trigger');
        const input = document.getElementById('user-image-input');

        if (trigger && input) {
            trigger.onclick = () => input.click();

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    this.switchScreen('game-screen');
                    // Використовуємо 'custom' як ID, щоб рекорди не змішувалися з сюжетними рівнями
                    Game.start(event.target.result, 'custom'); 
                    Settings.playMusic();
                };
                reader.readAsDataURL(file);
            };
        }
    },

    // Допоміжна функція для форматування часу в галереї
    formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
};

// Запуск при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    Main.init();
});