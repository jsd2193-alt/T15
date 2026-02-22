class VocaMasterPro {
    constructor() {
        const storedWords = JSON.parse(localStorage.getItem('voca_words'));
        // If stored words contain placeholders (Word_), clear and use VOCABULARY
        if (storedWords && storedWords.some(w => w.word.startsWith('Word_'))) {
            localStorage.removeItem('voca_words');
            this.words = VOCABULARY;
        } else {
            this.words = storedWords || VOCABULARY;
        }

        this.xp = parseInt(localStorage.getItem('voca_xp')) || 0;
        this.level = this.calculateLevel(this.xp);
        this.currentWordIdx = 0;
        this.isMusicPlaying = false;
        this.quizSession = [];
        this.editingWordIndex = -1;

        this.init();
    }

    init() {
        this.updateDashboard();
        this.renderWordList();
        this.setupEventListeners();
    }

    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    addXP(amount) {
        this.xp += amount;
        this.level = this.calculateLevel(this.xp);
        localStorage.setItem('voca_xp', this.xp);
        this.updateDashboard();
    }

    updateDashboard() {
        document.getElementById('user-level').innerText = this.level;
        document.getElementById('current-xp').innerText = this.xp;
        const nextLevelXP = Math.pow(this.level, 2) * 100;
        const prevLevelXP = Math.pow(this.level - 1, 2) * 100;
        document.getElementById('next-level-xp').innerText = nextLevelXP;

        const progress = ((this.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
        document.getElementById('xp-fill').style.width = `${progress}%`;

        document.getElementById('stats-total-words').innerText = this.words.length;
    }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.getAttribute('data-screen') === screenId);
        });

        if (screenId === 'study') this.showStudyWord();
        if (screenId === 'quiz') this.startQuiz();
    }

    // --- Word Manager ---
    renderWordList(filteredWords = this.words) {
        const body = document.getElementById('word-list-body');
        body.innerHTML = '';

        const displayLimit = 50; // Performance: only show first 50 or search results
        filteredWords.slice(0, displayLimit).forEach((w, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${w.word}</strong></td>
                <td>${w.meaning}</td>
                <td style="color: var(--text-muted)">${w.pronunciation || '-'}</td>
                <td>
                    <button class="btn-icon edit" onclick="app.editWord(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="app.deleteWord(${index})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            body.appendChild(tr);
        });
    }

    filterWords() {
        const query = document.getElementById('word-search').value.toLowerCase();
        const filtered = this.words.filter(w =>
            w.word.toLowerCase().includes(query) ||
            w.meaning.toLowerCase().includes(query)
        );
        this.renderWordList(filtered);
    }

    openAddModal() {
        this.editingWordIndex = -1;
        document.getElementById('modal-title').innerText = "Add Word";
        document.getElementById('input-word').value = '';
        document.getElementById('input-meaning').value = '';
        document.getElementById('input-pron').value = '';
        document.getElementById('word-modal').style.display = 'flex';
    }

    editWord(index) {
        this.editingWordIndex = index;
        const w = this.words[index];
        document.getElementById('modal-title').innerText = "Edit Word";
        document.getElementById('input-word').value = w.word;
        document.getElementById('input-meaning').value = w.meaning;
        document.getElementById('input-pron').value = w.pronunciation || '';
        document.getElementById('word-modal').style.display = 'flex';
    }

    deleteWord(index) {
        if (confirm("Are you sure you want to delete this word?")) {
            this.words.splice(index, 1);
            this.saveToStorage();
            this.renderWordList();
            this.updateDashboard();
        }
    }

    saveWord() {
        const word = document.getElementById('input-word').value.trim();
        const meaning = document.getElementById('input-meaning').value.trim();
        const pron = document.getElementById('input-pron').value.trim();

        if (!word || !meaning) return alert("Word and Meaning are required!");

        const newEntry = { word, meaning, pronunciation: pron, keyword: word };

        if (this.editingWordIndex > -1) {
            this.words[this.editingWordIndex] = newEntry;
        } else {
            this.words.unshift(newEntry);
        }

        this.saveToStorage();
        this.closeModal();
        this.renderWordBody();
        this.updateDashboard();
    }

    // helper for refresh
    renderWordBody() { this.renderWordList(); }

    closeModal() {
        document.getElementById('word-modal').style.display = 'none';
    }

    saveToStorage() {
        localStorage.setItem('voca_words', JSON.stringify(this.words));
    }

    // --- Study Mode ---
    showStudyWord() {
        const w = this.words[this.currentWordIdx];
        document.getElementById('study-word-en').innerText = w.word;
        document.getElementById('study-word-en-back').innerText = w.word;
        document.getElementById('study-meaning-ko').innerText = w.meaning;
        document.getElementById('study-pron').innerText = w.pronunciation || '';
        document.getElementById('study-example').innerText = w.example || `Learn the word "${w.word}" to expand your vocabulary!`;
        document.getElementById('study-counter').innerText = `${this.currentWordIdx + 1} / ${this.words.length}`;

        document.getElementById('study-image').src = `https://loremflickr.com/400/300/${w.keyword || w.word}`;
        document.querySelector('.flashcard-pro').classList.remove('flipped');
    }

    nextWord() { this.currentWordIdx = (this.currentWordIdx + 1) % this.words.length; this.showStudyWord(); }
    prevWord() { this.currentWordIdx = (this.currentWordIdx - 1 + this.words.length) % this.words.length; this.showStudyWord(); }

    speakWord(event) {
        if (event) event.stopPropagation();
        this.tts(this.words[this.currentWordIdx].word);
    }

    // --- Quiz Mode ---
    startQuiz() {
        this.quizSession = [...this.words];
        this.shuffle(this.quizSession);
        this.quizIdx = 0;
        this.quizCorrectCount = 0;
        this.showNextQuiz();
    }

    showNextQuiz() {
        if (this.quizIdx >= 10) {
            alert(`Quiz Session Done! You gained ${this.quizCorrectCount * 10} XP.`);
            this.switchScreen('home');
            return;
        }

        const current = this.quizSession[this.quizIdx];
        const options = this.generateOptions(current.word);

        document.getElementById('quiz-image').src = `https://loremflickr.com/400/300/${current.keyword || current.word}`;
        document.getElementById('quiz-progress-fill').style.width = `${(this.quizIdx / 10) * 100}%`;
        document.getElementById('feedback-overlay').className = 'feedback-overlay';

        const container = document.getElementById('quiz-options');
        container.innerHTML = '';
        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn-quiz-opt';
            btn.innerHTML = `<span class="opt-num">${idx + 1}</span> ${opt}`;
            btn.onclick = () => this.checkQuizAnswer(opt, current.word, btn);
            container.appendChild(btn);
        });
    }

    generateOptions(correct) {
        let opts = [correct];
        while (opts.length < 4) {
            const r = this.words[Math.floor(Math.random() * this.words.length)].word;
            if (!opts.includes(r)) opts.push(r);
        }
        return this.shuffle(opts);
    }

    checkQuizAnswer(selected, correct, btn) {
        const all = document.querySelectorAll('.btn-quiz-opt');
        all.forEach(b => b.disabled = true);
        const overlay = document.getElementById('feedback-overlay');

        if (selected === correct) {
            btn.classList.add('correct');
            overlay.classList.add('correct');
            this.quizCorrectCount++;
            this.addXP(10);
            this.tts(correct);
        } else {
            btn.classList.add('wrong');
            overlay.classList.add('wrong');
            all.forEach(b => { if (b.innerText.includes(correct)) b.classList.add('correct'); });
        }

        setTimeout(() => {
            this.quizIdx++;
            this.showNextQuiz();
        }, 2000);
    }

    // --- Multimedia ---
    toggleMusic() {
        const bgm = document.getElementById('bgm');
        const btn = document.getElementById('music-toggle');
        if (this.isMusicPlaying) {
            bgm.pause();
            btn.classList.remove('playing');
        } else {
            bgm.play().catch(e => console.log("BGM Error", e));
            btn.classList.add('playing');
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    tts(text) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'en-US';
        msg.rate = 0.85;
        window.speechSynthesis.speak(msg);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        // Modal background click to close
        window.onclick = (e) => {
            if (e.target.id === 'word-modal') this.closeModal();
        };
    }
}

// Global CSS for dynamic elements
const style = document.createElement('style');
style.innerHTML = `
    .btn-quiz-opt { padding: 1.5rem; background: var(--glass); border: 1px solid var(--glass-border); border-radius: 16px; color: white; border: none; cursor: pointer; text-align: left; font-size: 1.1rem; display: flex; gap: 1rem; align-items: center; transition: all 0.2s; }
    .btn-quiz-opt:hover:not(:disabled) { background: rgba(255,255,255,0.1); transform: translateX(5px); }
    .btn-quiz-opt.correct { background: var(--success); }
    .btn-quiz-opt.wrong { background: var(--error); }
    .opt-num { color: var(--primary); font-weight: 700; opacity: 0.6; }
    .quiz-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; }
    .quiz-card-alt { background: var(--bg-card); border-radius: 24px; padding: 2rem; border: 1px solid var(--glass-border); }
    .quiz-image-frame { width: 100%; aspect-ratio: 16/9; border-radius: 16px; overflow: hidden; position: relative; margin-bottom: 2rem; }
    .quiz-image-frame img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 500px) { .quiz-options { grid-template-columns: 1fr; } }
`;
document.head.appendChild(style);

const app = new VocaMasterPro();
window.app = app;
