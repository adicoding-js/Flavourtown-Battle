// ============================================
// FLAVORTOWN BATTLE - Complete Game Engine
// ============================================

(function () {
    'use strict';

    // ==================== CUSTOMIZABLE CONTROLS ====================
    const defaultControls = {
        p1: { left: 'a', right: 'd', jump: 'w', attack: ' ', special: 'f' },
        p2: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', attack: '.', special: '/' }
    };

    let controls = JSON.parse(JSON.stringify(defaultControls));

    // Load saved controls
    try {
        const saved = localStorage.getItem('flavortownControls');
        if (saved) controls = JSON.parse(saved);
    } catch (e) { }

    function saveControls() {
        localStorage.setItem('flavortownControls', JSON.stringify(controls));
    }

    // Expose for settings UI
    window.gameControls = controls;
    window.saveGameControls = saveControls;
    window.resetControls = function () {
        controls = JSON.parse(JSON.stringify(defaultControls));
        window.gameControls = controls;
        saveControls();
    };

    // ==================== AUDIO ====================
    const audioManager = {
        ctx: null, vol: 0.5,
        init() {
            if (this.ctx) return;
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
        },
        tone(f, d, t = 'square') {
            if (!this.ctx) return;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = t; o.frequency.value = f;
            g.gain.setValueAtTime(this.vol * 0.3, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
            o.start(); o.stop(this.ctx.currentTime + d);
        },
        hit() { this.init(); this.tone(200, 0.1); },
        jump() { this.init(); this.tone(400, 0.1, 'sine'); },
        special() { this.init(); this.tone(500, 0.2, 'sawtooth'); },
        announce() { this.init();[400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.tone(f, 0.15), i * 80)); }
    };

    // ==================== PARTICLES ====================
    class Particle {
        constructor(x, y, vx, vy, color, size, life) {
            Object.assign(this, { x, y, vx, vy, color, size, life, maxLife: life });
        }
        update() { this.x += this.vx; this.y += this.vy; this.vy += 0.15; this.life--; }
        draw(ctx) {
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    const particles = [];
    function spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 5;
            particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s - 4, color, 3 + Math.random() * 4, 25 + Math.random() * 15));
        }
    }

    // ==================== LERP HELPER ====================
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ==================== FIGHTER CLASS ====================
    class Fighter {
        constructor(x, y, color, name, isP1, stats = {}) {
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.width = 50; this.height = 120;
            this.color = color; this.name = name;
            this.isP1 = isP1;
            this.facingRight = isP1;
            this.maxHealth = stats.hp || 100;
            this.health = this.maxHealth;
            this.power = stats.power || 10;
            this.speed = stats.speed || 5;
            this.isGrounded = false;
            this.isAttacking = false;
            this.attackTimer = 0;
            this.specialCooldown = 0;
            this.specialMaxCooldown = stats.specialCd || 120;
            this.hitstun = 0;
            this.isDead = false;
            this.damageDealt = 0;

            this.limbs = { lArm: 0, rArm: 0, lLeg: 0, rLeg: 0 };
            this.limbTargets = { lArm: 0, rArm: 0, lLeg: 0, rLeg: 0 };
            this.bodyStretch = 1;
            this.animTime = 0;
            this.windingUp = false;
            this.windupTimer = 0;
        }

        update(keys, arena, ctrl) {
            if (this.isDead) return;
            if (this.attackTimer > 0) this.attackTimer--;
            if (this.specialCooldown > 0) this.specialCooldown--;
            if (this.hitstun > 0) { this.hitstun--; return; }

            const left = keys[ctrl.left];
            const right = keys[ctrl.right];
            const jump = keys[ctrl.jump];

            if (left) { this.vx = -this.speed; this.facingRight = false; }
            else if (right) { this.vx = this.speed; this.facingRight = true; }

            if (jump && this.isGrounded) {
                this.vy = -16;
                this.isGrounded = false;
                this.bodyStretch = 1.3;
                audioManager.jump();
            }

            this.vy += 0.7;
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= this.isGrounded ? 0.82 : 0.96;

            const wasInAir = !this.isGrounded;
            const platY = arena.platformY;
            if (this.vy >= 0 && this.y + this.height >= platY && this.y + this.height <= platY + 25) {
                if (this.x + this.width > arena.platformX && this.x < arena.platformX + arena.platformWidth) {
                    this.y = platY - this.height;
                    if (wasInAir && this.vy > 5) this.bodyStretch = 0.7;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            } else if (this.y + this.height < platY) {
                this.isGrounded = false;
            }

            this.bodyStretch = lerp(this.bodyStretch, 1, 0.15);
            this.animTime += 0.15;
            this.updateAnimation();
        }

        attack() {
            if (this.attackTimer > 0 || this.windingUp) return false;
            this.windingUp = true;
            this.windupTimer = 6;
            setTimeout(() => {
                this.windingUp = false;
                this.isAttacking = true;
                this.attackTimer = 25;
                setTimeout(() => this.isAttacking = false, 120);
            }, 100);
            return true;
        }

        useSpecial() {
            if (this.specialCooldown > 0) return null;
            this.specialCooldown = this.specialMaxCooldown;
            audioManager.special();
            return this.createSpecial();
        }

        createSpecial() { return null; }

        takeDamage(amount, kbX, kbY, attacker) {
            const mult = 1 + (1 - this.health / this.maxHealth);
            this.health -= amount;
            this.vx = kbX * mult;
            this.vy = kbY * mult;
            this.hitstun = 18;
            if (attacker) attacker.damageDealt += amount;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color);
            audioManager.hit();
            if (this.health <= 0) { this.health = 0; this.isDead = true; }
        }

        getAttackBox() {
            return {
                x: this.facingRight ? this.x + this.width : this.x - 70,
                y: this.y + 25, width: 70, height: 55
            };
        }

        updateAnimation() {
            if (!this.isGrounded) {
                this.limbTargets = { lArm: -0.8, rArm: 0.8, lLeg: 0.4, rLeg: -0.4 };
            } else if (this.windingUp) {
                const dir = this.facingRight ? 1 : -1;
                this.limbTargets = { lArm: dir * -1.2, rArm: dir * -0.5, lLeg: 0.1, rLeg: -0.1 };
            } else if (this.isAttacking) {
                const dir = this.facingRight ? 1 : -1;
                this.limbTargets = { lArm: dir * 0.2, rArm: dir * 2.2, lLeg: 0.3, rLeg: -0.2 };
            } else if (Math.abs(this.vx) > 0.8) {
                const cycle = Math.sin(this.animTime * 1.5);
                this.limbTargets = { lArm: cycle * 1, rArm: -cycle * 1, lLeg: -cycle * 0.8, rLeg: cycle * 0.8 };
            } else {
                const breath = Math.sin(this.animTime * 0.3) * 0.15;
                this.limbTargets = { lArm: breath, rArm: -breath, lLeg: 0, rLeg: 0 };
            }

            const lerpSpeed = 0.25;
            this.limbs.lArm = lerp(this.limbs.lArm, this.limbTargets.lArm, lerpSpeed);
            this.limbs.rArm = lerp(this.limbs.rArm, this.limbTargets.rArm, lerpSpeed);
            this.limbs.lLeg = lerp(this.limbs.lLeg, this.limbTargets.lLeg, lerpSpeed);
            this.limbs.rLeg = lerp(this.limbs.rLeg, this.limbTargets.rLeg, lerpSpeed);
        }

        draw(ctx) {
            const cx = this.x + this.width / 2;
            const headY = this.y + 22;
            const bodyTop = this.y + 40;
            const bodyBot = this.y + 85;

            ctx.save();
            ctx.translate(cx, bodyBot);
            ctx.scale(1 / this.bodyStretch, this.bodyStretch);
            ctx.translate(-cx, -bodyBot);

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;

            ctx.beginPath();
            ctx.arc(cx, headY, 18, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = this.color;
            const eyeOff = this.facingRight ? 6 : -6;
            ctx.beginPath();
            ctx.arc(cx + eyeOff, headY - 3, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx, bodyTop - 5);
            ctx.lineTo(cx, bodyBot);
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, bodyTop);
            ctx.rotate(this.limbs.lArm);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-35, 25);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, bodyTop);
            ctx.rotate(this.limbs.rArm);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(35, 25);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, bodyBot);
            ctx.rotate(this.limbs.lLeg);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-18, 35);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, bodyBot);
            ctx.rotate(this.limbs.rLeg);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(18, 35);
            ctx.stroke();
            ctx.restore();

            ctx.shadowBlur = 0;

            if (this.isAttacking) {
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 4;
                const dir = this.facingRight ? 1 : -1;
                ctx.beginPath();
                ctx.arc(cx + dir * 40, bodyTop + 15, 35, dir > 0 ? -0.5 : Math.PI - 0.5, dir > 0 ? 1 : Math.PI + 1);
                ctx.stroke();
            }

            if (this.specialCooldown > 0) {
                const prog = 1 - this.specialCooldown / this.specialMaxCooldown;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, this.y - 12, 12, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = this.color;
                ctx.beginPath();
                ctx.arc(cx, this.y - 12, 12, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        reset(x, y) {
            this.x = x; this.y = y; this.vx = 0; this.vy = 0;
            this.health = this.maxHealth; this.isDead = false;
            this.specialCooldown = 0; this.attackTimer = 0;
            this.facingRight = this.isP1;
            this.damageDealt = 0;
            this.limbs = { lArm: 0, rArm: 0, lLeg: 0, rLeg: 0 };
        }
    }

    // ==================== CHARACTERS ====================
    class Spicy extends Fighter {
        constructor(x, y, isP1) { super(x, y, '#FF4D4D', 'Spicy', isP1, { hp: 80, power: 15, speed: 6, specialCd: 90 }); }
        createSpecial() {
            spawnParticles(this.x + this.width / 2, this.y + 50, '#FF8800', 15);
            return { type: 'fireball', x: this.facingRight ? this.x + this.width : this.x - 30, y: this.y + 50, vx: this.facingRight ? 14 : -14, owner: this.isP1, damage: 18 };
        }
    }

    class Salty extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#FFFFFF', 'Salty', isP1, { hp: 150, power: 8, speed: 4, specialCd: 180 });
            this.shieldActive = false; this.shieldTimer = 0;
        }
        update(keys, arena, ctrl) { super.update(keys, arena, ctrl); if (this.shieldTimer > 0) this.shieldTimer--; else this.shieldActive = false; }
        createSpecial() { this.shieldActive = true; this.shieldTimer = 120; spawnParticles(this.x + this.width / 2, this.y + 60, '#FFFFFF', 20); return null; }
        draw(ctx) {
            if (this.shieldActive) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 55, 0, Math.PI * 2);
                ctx.stroke();
            }
            super.draw(ctx);
        }
    }

    class Sour extends Fighter {
        constructor(x, y, isP1) { super(x, y, '#CCFF00', 'Sour', isP1, { hp: 100, power: 10, speed: 5, specialCd: 150 }); }
        createSpecial() {
            spawnParticles(this.x + this.width / 2, this.y + this.height, '#CCFF00', 15);
            return { type: 'acid', x: this.x + this.width / 2 - 50, y: this.y + this.height, width: 100, owner: this.isP1, life: 300, damage: 4 };
        }
    }

    class Sweet extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#FF69B4', 'Sweet', isP1, { hp: 90, power: 8, speed: 8, specialCd: 240 });
            this.baseSpeed = 8; this.rushTimer = 0;
        }
        update(keys, arena, ctrl) {
            if (this.rushTimer > 0) { this.rushTimer--; this.speed = this.baseSpeed * 2; } else this.speed = this.baseSpeed;
            super.update(keys, arena, ctrl);
            if (this.rushTimer > 0 && Math.random() < 0.3) spawnParticles(this.x + this.width / 2, this.y + this.height, '#FF69B4', 2);
        }
        createSpecial() { this.rushTimer = 180; spawnParticles(this.x + this.width / 2, this.y + 60, '#FF69B4', 20); return null; }
    }

    class Umami extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#9D00FF', 'Umami', isP1, { hp: 120, power: 12, speed: 4, specialCd: 150 });
            this.hammerActive = false; this.hammerTimer = 0;
        }
        update(keys, arena, ctrl) { super.update(keys, arena, ctrl); if (this.hammerTimer > 0) this.hammerTimer--; else this.hammerActive = false; }
        createSpecial() {
            this.hammerActive = true; this.hammerTimer = 25;
            spawnParticles(this.x + this.width / 2, this.y + this.height, '#9D00FF', 25);
            return { type: 'hammer', x: this.x, y: this.y, facingRight: this.facingRight, owner: this.isP1 };
        }
    }

    const CHARS = { Spicy, Salty, Sour, Sweet, Umami };

    // ==================== AI CONTROLLER ====================
    class AIController {
        constructor(difficulty = 'easy') {
            this.difficulty = difficulty;
            this.reactionDelay = { easy: 30, medium: 15, hard: 5 }[difficulty];
            this.aggression = { easy: 0.3, medium: 0.5, hard: 0.8 }[difficulty];
            this.decisionTimer = 0;
            this.currentAction = null;
        }

        getInput(ai, player, ctrl) {
            const keys = {};
            this.decisionTimer--;

            if (this.decisionTimer <= 0) {
                this.decisionTimer = this.reactionDelay + Math.random() * 10;
                this.decide(ai, player, ctrl);
            }

            if (this.currentAction) {
                if (this.currentAction.left) keys[ctrl.left] = true;
                if (this.currentAction.right) keys[ctrl.right] = true;
                if (this.currentAction.jump) keys[ctrl.jump] = true;
                if (this.currentAction.attack) keys[ctrl.attack] = true;
                if (this.currentAction.special) keys[ctrl.special] = true;
            }

            return keys;
        }

        decide(ai, player, ctrl) {
            const dx = player.x - ai.x;
            const dist = Math.abs(dx);

            this.currentAction = {};

            if (dx > 0) this.currentAction.right = true;
            else this.currentAction.left = true;

            if (dist < 100) {
                if (Math.random() < this.aggression) this.currentAction.attack = true;
                if (ai.specialCooldown <= 0 && Math.random() < this.aggression * 0.5) this.currentAction.special = true;
            } else if (dist < 300) {
                if (Math.random() < 0.7) {
                    this.currentAction.left = dx < 0;
                    this.currentAction.right = dx > 0;
                }
                if (player.isAttacking && Math.random() < this.aggression) this.currentAction.jump = true;
            } else {
                this.currentAction.left = dx < 0;
                this.currentAction.right = dx > 0;
            }

            if (ai.x < 200) { this.currentAction.right = true; this.currentAction.left = false; }
            if (ai.x > 824) { this.currentAction.left = true; this.currentAction.right = false; }
            if (Math.random() < 0.05 && ai.isGrounded) this.currentAction.jump = true;
        }
    }

    // ==================== GAME STATE ====================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 576;

    const arena = { platformX: 162, platformY: 440, platformWidth: 700, platformHeight: 40 };
    const projectiles = [];
    const hazards = [];

    let player1 = null, player2 = null;
    let gameState = 'menu', timeRemaining = 60, lastTime = 0;
    let countdownValue = 3, countdownTimer = 0;
    let winner = null, hitstopTimer = 0, screenShake = 0;
    let gameMode = 'local';
    let aiController = null;
    let isPaused = false;
    let controlHintTimer = 0;
    let gameLoopId = null;
    let gameRunning = false;

    const keys = {};

    // Only capture game keys when game is active
    window.addEventListener('keydown', e => {
        // Check if we're focused on an input
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return; // Don't capture, let input handle it
        }

        keys[e.key] = true;

        // ESC for pause menu
        if (e.key === 'Escape' && gameRunning && (gameState === 'playing' || gameState === 'countdown')) {
            togglePause();
            e.preventDefault();
            return;
        }

        // Only prevent default for game keys when game is active
        if (gameRunning && (gameState === 'playing' || gameState === 'countdown' || gameState === 'paused')) {
            const gameKeys = [
                controls.p1.left, controls.p1.right, controls.p1.jump, controls.p1.attack, controls.p1.special,
                controls.p2.left, controls.p2.right, controls.p2.jump, controls.p2.attack, controls.p2.special
            ];
            // Normalize for comparison (some keys might be space or symbols)
            if (gameKeys.includes(e.key) || gameKeys.includes(e.key.toLowerCase())) e.preventDefault();
        }
    });

    window.addEventListener('keyup', e => { keys[e.key] = false; });

    // ==================== PAUSE MENU ====================
    function togglePause() {
        if (gameState === 'playing' || gameState === 'countdown') {
            isPaused = true;
            gameState = 'paused';
            showPauseMenu(true);
        } else if (gameState === 'paused') {
            isPaused = false;
            gameState = 'playing';
            showPauseMenu(false);
        }
    }

    function showPauseMenu(show) {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.style.display = show ? 'flex' : 'none';
    }

    window.resumeGame = function () {
        isPaused = false;
        gameState = 'playing';
        showPauseMenu(false);
    };

    window.restartGame = function () {
        isPaused = false;
        showPauseMenu(false);
        const p1 = window.p1Selection || 'Spicy';
        const p2 = window.p2Selection || 'Salty';
        const mode = window.gameMode || 'local';
        const diff = window.aiDifficulty || 'easy';
        document.getElementById('displayText').style.display = 'none';
        startGame(p1, p2, mode, diff);
    };

    window.exitToMenu = function () {
        gameRunning = false;
        isPaused = false;
        gameState = 'menu';
        showPauseMenu(false);
        document.getElementById('screens').style.display = 'block';
        document.getElementById('game-ui').classList.add('hidden');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('main-menu').classList.add('active');
    };

    // ==================== GAME FUNCTIONS ====================
    function startGame(p1Char, p2Char, mode, difficulty) {
        const P1 = CHARS[p1Char] || Spicy;
        const P2 = CHARS[p2Char] || Salty;

        player1 = new P1(240, 250, true);
        player2 = new P2(734, 250, false);

        gameMode = mode || 'local';
        if (gameMode === 'ai') {
            aiController = new AIController(difficulty || 'easy');
        }

        projectiles.length = 0; hazards.length = 0; particles.length = 0;
        timeRemaining = 60; gameState = 'countdown';
        countdownValue = 3; countdownTimer = 0; winner = null;
        controlHintTimer = 300; // Show controls for ~5 seconds
        gameRunning = true;
        isPaused = false;
        updateHUD();
    }

    function updateHUD() {
        const h1 = document.getElementById('player1Health');
        const h2 = document.getElementById('player2Health');
        const t = document.getElementById('timer');
        if (h1 && player1) h1.style.width = (player1.health / player1.maxHealth * 100) + '%';
        if (h2 && player2) h2.style.width = (player2.health / player2.maxHealth * 100) + '%';
        if (t) t.textContent = Math.ceil(timeRemaining);
    }

    function checkCollision(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    function gameLoop(ts) {
        if (!gameRunning) return;

        const dt = ts - lastTime; lastTime = ts;

        if (hitstopTimer > 0) { hitstopTimer -= dt; requestAnimationFrame(gameLoop); return; }

        // Don't update game logic when paused
        if (gameState === 'paused') {
            render();
            requestAnimationFrame(gameLoop);
            return;
        }

        if (gameState === 'countdown') {
            countdownTimer += dt;
            if (countdownTimer >= 1000) {
                countdownTimer = 0; countdownValue--;
                if (countdownValue <= 0) { gameState = 'playing'; audioManager.announce(); }
            }
        } else if (gameState === 'playing') {
            timeRemaining -= dt / 1000;
            if (timeRemaining <= 0) { timeRemaining = 0; endGame(); }

            // Fade control hints
            if (controlHintTimer > 0) controlHintTimer--;

            // Get P2 input (human or AI)
            let p2Input = keys;
            if (gameMode === 'ai' && aiController) {
                p2Input = aiController.getInput(player2, player1, controls.p2);
            }

            // Attack inputs
            if (keys[controls.p1.attack] && player1.attack()) keys[controls.p1.attack] = false;
            if (p2Input[controls.p2.attack] && player2.attack()) { if (gameMode !== 'ai') keys[controls.p2.attack] = false; }
            if (keys[controls.p1.special]) {
                const s = player1.useSpecial();
                if (s) { if (s.type === 'fireball') projectiles.push(s); else if (s.type === 'acid') hazards.push(s); }
                keys[controls.p1.special] = false;
            }
            if (p2Input[controls.p2.special]) {
                const s = player2.useSpecial();
                if (s) { if (s.type === 'fireball') projectiles.push(s); else if (s.type === 'acid') hazards.push(s); }
                if (gameMode !== 'ai') keys[controls.p2.special] = false;
            }

            player1.update(keys, arena, controls.p1);
            player2.update(p2Input, arena, controls.p2);

            // Combat
            if (player1.isAttacking) {
                const box = player1.getAttackBox();
                if (checkCollision(box, { x: player2.x, y: player2.y, width: player2.width, height: player2.height })) {
                    player1.isAttacking = false;
                    player2.takeDamage(player1.power, (player1.facingRight ? 1 : -1) * 10, -6, player1);
                    hitstopTimer = 60; screenShake = 8;
                }
            }
            if (player2.isAttacking) {
                const box = player2.getAttackBox();
                if (checkCollision(box, { x: player1.x, y: player1.y, width: player1.width, height: player1.height })) {
                    player2.isAttacking = false;
                    player1.takeDamage(player2.power, (player2.facingRight ? 1 : -1) * 10, -6, player2);
                    hitstopTimer = 60; screenShake = 8;
                }
            }

            // Hammer special
            if (player2.hammerActive) {
                const hbox = { x: player2.x + (player2.facingRight ? 30 : -80), y: player2.y + 40, width: 80, height: 80 };
                if (checkCollision(hbox, { x: player1.x, y: player1.y, width: player1.width, height: player1.height })) {
                    player1.takeDamage(20, (player2.facingRight ? 1 : -1) * 18, -12, player2);
                    player2.hammerActive = false; hitstopTimer = 100; screenShake = 15;
                }
            }
            if (player1.hammerActive) {
                const hbox = { x: player1.x + (player1.facingRight ? 30 : -80), y: player1.y + 40, width: 80, height: 80 };
                if (checkCollision(hbox, { x: player2.x, y: player2.y, width: player2.width, height: player2.height })) {
                    player2.takeDamage(20, (player1.facingRight ? 1 : -1) * 18, -12, player1);
                    player1.hammerActive = false; hitstopTimer = 100; screenShake = 15;
                }
            }

            // Projectiles
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i]; p.x += p.vx;
                if (p.x < -50 || p.x > canvas.width + 50) { projectiles.splice(i, 1); continue; }
                const target = p.owner ? player2 : player1;
                const attacker = p.owner ? player1 : player2;
                if (checkCollision({ x: p.x, y: p.y, width: 30, height: 25 }, { x: target.x, y: target.y, width: target.width, height: target.height })) {
                    target.takeDamage(p.damage, (p.vx > 0 ? 1 : -1) * 12, -4, attacker);
                    projectiles.splice(i, 1); hitstopTimer = 50;
                }
            }

            // Hazards
            for (let i = hazards.length - 1; i >= 0; i--) {
                const h = hazards[i]; h.life--;
                if (h.life <= 0) { hazards.splice(i, 1); continue; }
                const target = h.owner ? player2 : player1;
                const attacker = h.owner ? player1 : player2;
                if (target.y + target.height >= h.y && target.x + target.width > h.x && target.x < h.x + h.width) {
                    if (h.life % 40 === 0) target.takeDamage(h.damage, 0, -3, attacker);
                }
            }

            // Ring out
            if (player1.y > canvas.height + 60 || player1.x < -120 || player1.x > canvas.width + 120) player1.isDead = true;
            if (player2.y > canvas.height + 60 || player2.x < -120 || player2.x > canvas.width + 120) player2.isDead = true;

            if (player1.isDead || player2.isDead) endGame();
            updateHUD();
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1); }
        if (screenShake > 0) screenShake *= 0.9;

        render();
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameState = 'gameover';
        if (player1.isDead && !player2.isDead) winner = player2;
        else if (player2.isDead && !player1.isDead) winner = player1;
        else winner = player1.health >= player2.health ? player1 : player2;

        // Save stats to Supabase
        if (window.recordGameResult && player1) {
            const p1Won = winner === player1;
            window.recordGameResult(p1Won, player1.damageDealt);
        }

        const disp = document.getElementById('displayText');
        if (disp) { disp.style.display = 'block'; disp.textContent = winner ? `${winner.name.toUpperCase()} WINS!` : 'TIE!'; }

        // Update game stats display
        const rt = document.getElementById('round-time');
        const td = document.getElementById('total-damage');
        if (rt) rt.textContent = Math.ceil(60 - timeRemaining) + 's';
        if (td) td.textContent = Math.round(player1.damageDealt + player2.damageDealt);

        setTimeout(() => {
            gameRunning = false;
            const wt = document.getElementById('winner-text');
            if (wt) wt.textContent = winner ? `${winner.name.toUpperCase()} WINS!` : 'TIE!';
            document.getElementById('screens').style.display = 'block';
            document.getElementById('game-ui').classList.add('hidden');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('game-over').classList.add('active');
        }, 2500);
    }

    function render() {
        ctx.save();
        if (screenShake > 0.5) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#2d1b4e');
        grad.addColorStop(0.5, '#4a2c5a');
        grad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Platform
        ctx.fillStyle = '#8B5A2B';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 15;
        ctx.fillRect(arena.platformX, arena.platformY, arena.platformWidth, arena.platformHeight);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(arena.platformX, arena.platformY, arena.platformWidth, 8);

        // Hazards
        hazards.forEach(h => {
            ctx.fillStyle = `rgba(180, 255, 0, ${Math.min(1, h.life / 80) * 0.7})`;
            ctx.beginPath();
            ctx.ellipse(h.x + h.width / 2, h.y + 8, h.width / 2, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Projectiles
        projectiles.forEach(p => {
            const grd = ctx.createRadialGradient(p.x + 15, p.y + 12, 0, p.x + 15, p.y + 12, 22);
            grd.addColorStop(0, '#FFFF00');
            grd.addColorStop(0.4, '#FF8800');
            grd.addColorStop(1, '#FF4400');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.ellipse(p.x + 15, p.y + 12, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Fighters
        if (player1) player1.draw(ctx);
        if (player2) player2.draw(ctx);

        // Particles
        particles.forEach(p => p.draw(ctx));

        // Countdown
        if (gameState === 'countdown') {
            ctx.font = 'bold 140px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffcc00';
            ctx.shadowColor = '#5c3d1e';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
            ctx.fillText(countdownValue > 0 ? countdownValue : 'FIGHT!', canvas.width / 2, canvas.height / 2 + 30);
            ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        }

        // Control hints (fade out)
        if (controlHintTimer > 0 && (gameState === 'playing' || gameState === 'countdown')) {
            const alpha = Math.min(1, controlHintTimer / 60);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.font = '16px Outfit, sans-serif';
            ctx.textAlign = 'left';

            // P1 controls
            ctx.fillText(`P1: ${controls.p1.left.toUpperCase()}/${controls.p1.right.toUpperCase()} Move | ${controls.p1.jump.toUpperCase()} Jump | SPACE Attack | ${controls.p1.special.toUpperCase()} Special`, 20, canvas.height - 40);

            // P2 controls (only in local mode)
            if (gameMode === 'local') {
                ctx.textAlign = 'right';
                ctx.fillText(`P2: ←/→ Move | ↑ Jump | . Attack | / Special`, canvas.width - 20, canvas.height - 40);
            }

            ctx.globalAlpha = 1;
        }

        // Pause overlay
        if (gameState === 'paused') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 60px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText('PAUSED', canvas.width / 2, 150);
        }

        ctx.restore();
    }

    // ==================== GLOBAL API ====================
    window.initGame = function () {
        const p1 = window.p1Selection || 'Spicy';
        const p2 = window.p2Selection || 'Salty';
        const mode = window.gameMode || 'local';
        const diff = window.aiDifficulty || 'easy';
        startGame(p1, p2, mode, diff);
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    };

    window.resetGame = function () {
        const p1 = window.p1Selection || 'Spicy';
        const p2 = window.p2Selection || 'Salty';
        const mode = window.gameMode || 'local';
        const diff = window.aiDifficulty || 'easy';
        document.getElementById('displayText').style.display = 'none';
        document.getElementById('screens').style.display = 'none';
        document.getElementById('game-ui').classList.remove('hidden');
        startGame(p1, p2, mode, diff);
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    };

})();
