// check this out
// KEYBOARD input - handles the inputs
// ============================================

class InputHandler {
    constructor() {
        // the og controls
        this.defaultBindings = {
            player1: {
                left: 'a',
                right: 'd',
                jump: 'w',
                attack: ' ',
                special: 'f'
            },
            player2: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                jump: 'ArrowUp',
                attack: '.',
                special: '/'
            }
        };

        // memory card stuff
        this.bindings = this.loadBindings();

        // what are u pressing???
        this.keys = {};

        // nobody touching nothing
        Object.values(this.bindings.player1).forEach(key => this.keys[key] = false);
        Object.values(this.bindings.player2).forEach(key => this.keys[key] = false);

        // tap check
        this.justPressed = {};

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            // dont scroll the page bro
            if (this.isGameKey(e.key)) {
                e.preventDefault();
            }

            if (!this.keys[e.key]) {
                this.justPressed[e.key] = true;
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.justPressed[e.key] = false;
        });
    }

    isGameKey(key) {
        const allKeys = [
            ...Object.values(this.bindings.player1),
            ...Object.values(this.bindings.player2)
        ];
        return allKeys.includes(key);
    }

    // u holding this?
    isPressed(player, action) {
        const key = this.bindings[player][action];
        return this.keys[key] || false;
    }

    // u just poked this?
    isJustPressed(player, action) {
        const key = this.bindings[player][action];
        const wasJustPressed = this.justPressed[key] || false;
        if (wasJustPressed) {
            this.justPressed[key] = false; // nom nom consumed
        }
        return wasJustPressed;
    }

    // wipe the slate
    clearJustPressed() {
        this.justPressed = {};
    }

    // dont forget this
    saveBindings() {
        localStorage.setItem('flavourman_bindings', JSON.stringify(this.bindings));
    }

    // what did i forget?
    loadBindings() {
        const saved = localStorage.getItem('flavourman_bindings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { ...this.defaultBindings };
            }
        }
        return { ...this.defaultBindings };
    }

    // go back to normal pls
    resetBindings() {
        this.bindings = { ...this.defaultBindings };
        this.saveBindings();
    }

    // change ur mind
    rebind(player, action, newKey) {
        this.bindings[player][action] = newKey;
        this.saveBindings();
    }
}

// just one allowed
const inputHandler = new InputHandler();
export default inputHandler;
