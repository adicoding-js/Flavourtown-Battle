// check this out
// AUDIO GOD (makes the noise)
// ============================================

class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.audioContext = null;
        this.initialized = false;
    }

    // kickstart the beats (needs a click first)
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }

    // beep boop maker (web audio api magic)
    generateTone(frequency, duration, type = 'square') {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // oof sound
    playHit() {
        this.init();
        // bonk
        this.generateTone(200, 0.1, 'square');
        setTimeout(() => this.generateTone(100, 0.05, 'square'), 20);
    }

    // boing sound
    playJump() {
        this.init();
        // yeet upwards
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // ultra instinct sounds
    playSpecial(type) {
        this.init();
        switch (type) {
            case 'fireball':
                this.generateTone(300, 0.2, 'sawtooth');
                setTimeout(() => this.generateTone(250, 0.15, 'sawtooth'), 50);
                break;
            case 'shield':
                this.generateTone(400, 0.3, 'sine');
                this.generateTone(600, 0.3, 'sine');
                break;
            case 'acid':
                this.generateTone(100, 0.4, 'triangle');
                break;
            case 'speed':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => this.generateTone(300 + i * 100, 0.05, 'square'), i * 30);
                }
                break;
            case 'hammer':
                this.generateTone(80, 0.3, 'square');
                setTimeout(() => this.generateTone(60, 0.2, 'square'), 100);
                break;
        }
    }

    // clicky sounds
    playUI(type) {
        this.init();
        switch (type) {
            case 'select':
                this.generateTone(500, 0.05, 'square');
                break;
            case 'hover':
                this.generateTone(400, 0.02, 'sine');
                break;
            case 'back':
                this.generateTone(300, 0.1, 'square');
                break;
        }
    }

    // hype man
    playAnnouncement(type) {
        this.init();
        switch (type) {
            case 'fight':
                // LETS GET READY TO RUMBLE
                [400, 500, 600, 800].forEach((freq, i) => {
                    setTimeout(() => this.generateTone(freq, 0.15, 'square'), i * 80);
                });
                break;
            case 'ko':
                // rip in peace
                this.generateTone(200, 0.5, 'sawtooth');
                setTimeout(() => this.generateTone(100, 0.3, 'sawtooth'), 200);
                break;
            case 'win':
                // we are the champions
                [523, 659, 784, 1047].forEach((freq, i) => {
                    setTimeout(() => this.generateTone(freq, 0.2, 'square'), i * 150);
                });
                break;
        }
    }

    // sleep tight
    playKnockout() {
        this.init();
        this.generateTone(150, 0.2, 'square');
        setTimeout(() => this.generateTone(80, 0.3, 'sawtooth'), 100);
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
}

const audioManager = new AudioManager();
export default audioManager;
