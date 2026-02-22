class VisualQuizApp {
    constructor() {
        this.words = VOCABULARY; // Global from vocabulary.js
        this.score = 0;
        this.currentIndex = 0;
        this.totalQuestions = 20; // Sessions of 20
        this.isMusicPlaying = false;

        this.init();
    }

    init() {
        this.shuffle(this.words);
        this.loadQuestion();
    }

    loadQuestion() {
        if (this.currentIndex >= this.totalQuestions) {
            alert(`학습 완료! 점수: ${this.score} / ${this.totalQuestions}`);
            this.currentIndex = 0;
            this.score = 0;
            this.shuffle(this.words);
        }

        const currentWord = this.words[this.currentIndex];
        const options = this.generateOptions(currentWord.word);

        // Update UI
        document.getElementById('quiz-image').src = `https://loremflickr.com/400/300/${currentWord.keyword || currentWord.word}`;
        document.getElementById('current-score').innerText = this.score;
        document.getElementById('progress-fill').style.width = `${(this.currentIndex / this.totalQuestions) * 100}%`;
        document.getElementById('feedback-overlay').className = 'feedback-overlay';

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="num">${idx + 1}</span> <span>${opt}</span>`;
            btn.onclick = () => this.handleSelection(opt, currentWord.word, btn);
            grid.appendChild(btn);
        });
    }

    generateOptions(correct) {
        let choices = [correct];
        while (choices.length < 4) {
            const randomWord = this.words[Math.floor(Math.random() * this.words.length)].word;
            if (!choices.includes(randomWord)) {
                choices.push(randomWord);
            }
        }
        return this.shuffle(choices);
    }

    handleSelection(selected, correct, btn) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);
        const overlay = document.getElementById('feedback-overlay');

        if (selected === correct) {
            btn.classList.add('correct');
            overlay.classList.add('correct');
            this.score++;
            this.tts(correct); // Pronounce immediately on success
        } else {
            btn.classList.add('wrong');
            overlay.classList.add('wrong');
            // Show correct one
            allBtns.forEach(b => {
                if (b.innerText.includes(correct)) b.classList.add('correct');
            });
        }

        setTimeout(() => {
            this.currentIndex++;
            this.loadQuestion();
        }, 2000);
    }

    tts(text) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'en-US';
        msg.rate = 0.8;
        window.speechSynthesis.speak(msg);
    }

    toggleMusic() {
        const bgm = document.getElementById('bgm');
        const btn = document.getElementById('music-toggle');
        if (this.isMusicPlaying) {
            bgm.pause();
            btn.classList.remove('playing');
        } else {
            bgm.play().catch(e => console.log("BGM play blocked", e));
            btn.classList.add('playing');
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Start the app
const app = new VisualQuizApp();
window.app = app;
