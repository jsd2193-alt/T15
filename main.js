class EnglishVocaMaster {
    constructor() {
        this.currentWordIdx = 0;
        this.score = 0;
        this.quizQuestions = [];
        this.isMusicPlaying = false;
        this.audioCtx = null;
        this.words = VOCABULARY; // Loaded from vocabulary.js
        this.init();
    }

    init() {
        this.shuffle(this.words);
        console.log("App initialized with", this.words.length, "words");
    }

    startStudy() {
        this.switchScreen('study');
        this.currentWordIdx = 0;
        this.showWord();
    }

    startQuiz() {
        this.switchScreen('quiz');
        this.score = 0;
        document.getElementById('current-score').innerText = '0';
        this.generateQuiz();
    }

    goHome() {
        this.switchScreen('landing');
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    showWord() {
        const word = this.words[this.currentWordIdx];
        document.getElementById('study-word').innerText = word.word;
        document.getElementById('study-meaning').innerText = word.meaning;
        document.getElementById('study-pron').innerText = word.pronunciation || '';
        document.getElementById('study-example').innerText = word.example || '';
        document.getElementById('study-progress').innerText = `${this.currentWordIdx + 1} / ${this.words.length}`;

        const img = document.getElementById('word-image');
        img.src = `https://loremflickr.com/400/300/${word.keyword || word.word}`;

        // Reset card flip
        document.getElementById('flashcard').classList.remove('flipped');
    }

    nextWord() {
        if (this.currentWordIdx < this.words.length - 1) {
            this.currentWordIdx++;
            this.showWord();
        }
    }

    prevWord() {
        if (this.currentWordIdx > 0) {
            this.currentWordIdx--;
            this.showWord();
        }
    }

    speakWord(event) {
        if (event) event.stopPropagation();
        const word = this.words[this.currentWordIdx].word;
        this.tts(word);
    }

    tts(text) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'en-US';
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
    }

    // Quiz Logic
    generateQuiz() {
        this.quizWords = [...this.words];
        this.shuffle(this.quizWords);
        this.quizIdx = 0;
        this.totalQuizQuestions = 10; // Let's do 10 at a time
        this.showQuizQuestion();
    }

    showQuizQuestion() {
        if (this.quizIdx >= this.totalQuizQuestions) {
            alert(`Quiz Finished! Your score: ${this.score} / ${this.totalQuizQuestions}`);
            this.goHome();
            return;
        }

        const current = this.quizWords[this.quizIdx];
        const options = this.generateOptions(current.meaning);

        document.getElementById('quiz-word').innerText = current.word;
        document.getElementById('quiz-image').src = `https://loremflickr.com/200/150/${current.keyword || current.word}`;
        document.getElementById('quiz-progress-inner').style.width = `${(this.quizIdx / this.totalQuizQuestions) * 100}%`;

        const grid = document.getElementById('options-grid');
        grid.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => this.checkAnswer(opt, current.meaning, btn);
            grid.appendChild(btn);
        });
    }

    generateOptions(correct) {
        const options = [correct];
        while (options.length < 4) {
            const randomMeaning = this.words[Math.floor(Math.random() * this.words.length)].meaning;
            if (!options.includes(randomMeaning)) {
                options.push(randomMeaning);
            }
        }
        return this.shuffle(options);
    }

    checkAnswer(selected, correct, btn) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        if (selected === correct) {
            btn.classList.add('correct');
            this.score++;
            document.getElementById('current-score').innerText = this.score;
            this.playSound(true);
        } else {
            btn.classList.add('wrong');
            allBtns.forEach(b => {
                if (b.innerText === correct) b.classList.add('correct');
            });
            this.playSound(false);
        }

        setTimeout(() => {
            this.quizIdx++;
            this.showQuizQuestion();
        }, 1500);
    }

    speakQuizWord() {
        const text = document.getElementById('quiz-word').innerText;
        this.tts(text);
    }

    // Multimedia
    toggleMusic() {
        const bgm = document.getElementById('bgm');
        const btn = document.getElementById('music-toggle');

        if (this.isMusicPlaying) {
            bgm.pause();
            btn.classList.remove('playing');
        } else {
            bgm.play().catch(e => console.log("BGM play error", e));
            btn.classList.add('playing');
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    playSound(isCorrect) {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        if (isCorrect) {
            oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5
            gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + 0.5);
        } else {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, this.audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + 0.3);
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

const app = new EnglishVocaMaster();
window.app = app;
