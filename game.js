// yo check this out
// FLAVOURMAN BATTLE - the full thing, no modules cuz modules represent order and we are chaos
// ============================================

(function () {
    'use strict';

    // beatbox goes here (audio manager)
    const audioManager = {
        audioContext: null,
        sfxVolume: 0.5,
        initialized: false,

        init() {
            if (this.initialized) return;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) { console.warn('Audio not supported'); }
        },

        generateTone(frequency, duration, type = 'square') {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        },

        playHit() { this.init(); this.generateTone(200, 0.1); },
        playJump() { this.init(); this.generateTone(300, 0.1, 'sine'); },
        playSpecial(type) { this.init(); this.generateTone(400, 0.2, 'sawtooth'); },
        playUI() { this.init(); this.generateTone(500, 0.05); },
        playAnnouncement() { this.init();[400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.generateTone(f, 0.15), i * 80)); }
    };

    // sparkly stuff (particles)
    class Particle {
        constructor(x, y, vx, vy, color, size, life) {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy;
            this.color = color; this.size = size; this.life = life; this.maxLife = life;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vy += 0.1; this.life--;
        }
        draw(ctx) {
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    const particles = [];
    function spawnParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 3, color, 5 + Math.random() * 5, 30));
        }
    }

    // the main dude blueprint
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
        }

        update(keys, arena) {
            if (this.isDead) return;
            if (this.attackTimer > 0) this.attackTimer--;
            if (this.specialCooldown > 0) this.specialCooldown--;
            if (this.hitstun > 0) { this.hitstun--; return; }

            // zoom zoom
            const left = this.isP1 ? keys['a'] : keys['ArrowLeft'];
            const right = this.isP1 ? keys['d'] : keys['ArrowRight'];
            const jump = this.isP1 ? keys['w'] : keys['ArrowUp'];

            if (left) { this.vx = -this.speed; this.facingRight = false; }
            else if (right) { this.vx = this.speed; this.facingRight = true; }

            if (jump && this.isGrounded) {
                this.vy = -15;
                this.isGrounded = false;
                audioManager.playJump();
            }

            // isaac newton logic
            this.vy += 0.6;
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= this.isGrounded ? 0.8 : 0.95;

            // dont fall through the floor pls
            const platY = arena.platformY;
            const platLeft = arena.platformX;
            const platRight = arena.platformX + arena.platformWidth;

            if (this.vy >= 0 && this.y + this.height >= platY && this.y + this.height <= platY + 20) {
                if (this.x + this.width > platLeft && this.x < platRight) {
                    this.y = platY - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            } else if (this.y + this.height < platY) {
                this.isGrounded = false;
            }
        }

        attack() {
            if (this.attackTimer > 0) return false;
            this.isAttacking = true;
            this.attackTimer = 25;
            setTimeout(() => this.isAttacking = false, 100);
            return true;
        }

        useSpecial() {
            if (this.specialCooldown > 0) return null;
            this.specialCooldown = this.specialMaxCooldown;
            audioManager.playSpecial(this.name);
            return this.createSpecial();
        }

        createSpecial() { return null; } // change this later or else

        takeDamage(amount, kbX, kbY) {
            const mult = 1 + (1 - this.health / this.maxHealth);
            this.health -= amount;
            this.vx = kbX * mult;
            this.vy = kbY * mult;
            this.hitstun = 15;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color);
            audioManager.playHit();
            if (this.health <= 0) { this.health = 0; this.isDead = true; }
        }

        getAttackBox() {
            const dir = this.facingRight ? 1 : -1;
            return {
                x: this.facingRight ? this.x + this.width : this.x - 70,
                y: this.y + 30,
                width: 70,
                height: 50
            };
        }

        draw(ctx) {
            const cx = this.x + this.width / 2;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;

            // big brain
            ctx.beginPath();
            ctx.arc(cx, this.y + 20, 15, 0, Math.PI * 2);
            ctx.stroke();

            // gym gains
            ctx.beginPath();
            ctx.moveTo(cx, this.y + 35);
            ctx.lineTo(cx, this.y + 80);
            ctx.stroke();

            // noodles
            const armAngle = this.isAttacking ? (this.facingRight ? 0.5 : -0.5) : 0;
            ctx.beginPath();
            ctx.moveTo(cx, this.y + 45);
            ctx.lineTo(cx - 30, this.y + 60 + armAngle * 20);
            ctx.moveTo(cx, this.y + 45);
            ctx.lineTo(cx + 30, this.y + 60 - armAngle * 20);
            ctx.stroke();

            // never skip leg day
            ctx.beginPath();
            ctx.moveTo(cx, this.y + 80);
            ctx.lineTo(cx - 15, this.y + 115);
            ctx.moveTo(cx, this.y + 80);
            ctx.lineTo(cx + 15, this.y + 115);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // pow pow visual
            if (this.isAttacking) {
                const box = this.getAttackBox();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
            }

            // chill pill indicator
            if (this.specialCooldown > 0) {
                const prog = 1 - this.specialCooldown / this.specialMaxCooldown;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, this.y - 15, 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = this.color;
                ctx.beginPath();
                ctx.arc(cx, this.y - 15, 10, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
                ctx.stroke();
            }
        }

        reset(x, y) {
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.health = this.maxHealth;
            this.isDead = false;
            this.specialCooldown = 0;
            this.attackTimer = 0;
            this.facingRight = this.isP1;
        }
    }

    // the squad
    class Spicy extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#FF4D4D', 'Spicy', isP1, { hp: 80, power: 15, speed: 6, specialCd: 90 });
        }
        createSpecial() {
            return {
                type: 'fireball', x: this.facingRight ? this.x + this.width : this.x - 30,
                y: this.y + 50, vx: this.facingRight ? 12 : -12, owner: this.isP1, damage: 15
            };
        }
    }

    class Salty extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#FFFFFF', 'Salty', isP1, { hp: 150, power: 8, speed: 4, specialCd: 180 });
            this.shieldActive = false;
            this.shieldTimer = 0;
        }
        update(keys, arena) {
            super.update(keys, arena);
            if (this.shieldTimer > 0) this.shieldTimer--;
            else this.shieldActive = false;
        }
        createSpecial() {
            this.shieldActive = true;
            this.shieldTimer = 120;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#FFFFFF', 15);
            return null;
        }
        draw(ctx) {
            if (this.shieldActive) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 50, 0, Math.PI * 2);
                ctx.stroke();
            }
            super.draw(ctx);
        }
    }

    class Sour extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#CCFF00', 'Sour', isP1, { hp: 100, power: 10, speed: 5, specialCd: 150 });
        }
        createSpecial() {
            return {
                type: 'acid', x: this.x + this.width / 2 - 40, y: this.y + this.height,
                width: 80, owner: this.isP1, life: 240, damage: 5
            };
        }
    }

    class Sweet extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#FF69B4', 'Sweet', isP1, { hp: 90, power: 8, speed: 8, specialCd: 240 });
            this.baseSpeed = 8;
            this.rushTimer = 0;
        }
        update(keys, arena) {
            if (this.rushTimer > 0) { this.rushTimer--; this.speed = this.baseSpeed * 2; }
            else this.speed = this.baseSpeed;
            super.update(keys, arena);
        }
        createSpecial() {
            this.rushTimer = 180;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#FF69B4', 15);
            return null;
        }
    }

    class Umami extends Fighter {
        constructor(x, y, isP1) {
            super(x, y, '#9D00FF', 'Umami', isP1, { hp: 120, power: 12, speed: 4, specialCd: 150 });
            this.hammerActive = false;
            this.hammerTimer = 0;
        }
        update(keys, arena) {
            super.update(keys, arena);
            if (this.hammerTimer > 0) this.hammerTimer--;
            else this.hammerActive = false;
        }
        createSpecial() {
            this.hammerActive = true;
            this.hammerTimer = 20;
            spawnParticles(this.x + this.width / 2, this.y + this.height, '#9D00FF', 20);
            return { type: 'hammer', x: this.x, y: this.y, facingRight: this.facingRight, owner: this.isP1 };
        }
    }

    const CHARS = { Spicy, Salty, Sour, Sweet, Umami };

    // yeeting stuff
    const projectiles = [];
    const hazards = [];

    // matrix state
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 576;

    const arena = {
        platformX: 162,
        platformY: 426,
        platformWidth: 700,
        platformHeight: 40
    };

    let player1 = null;
    let player2 = null;
    let gameState = 'menu';
    let timeRemaining = 60;
    let lastTime = 0;
    let countdownValue = 3;
    let countdownTimer = 0;
    let winner = null;
    let hitstopTimer = 0;
    let screenShake = 0;

    const keys = {};

    // button mashing
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
        if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '.', 'f', '/'].includes(e.key)) {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });

    // the logic sauce
    function startGame(p1Char, p2Char) {
        const P1Class = CHARS[p1Char] || Spicy;
        const P2Class = CHARS[p2Char] || Salty;

        player1 = new P1Class(240, 200, true);
        player2 = new P2Class(734, 200, false);

        projectiles.length = 0;
        hazards.length = 0;
        particles.length = 0;

        timeRemaining = 60;
        gameState = 'countdown';
        countdownValue = 3;
        countdownTimer = 0;
        winner = null;

        updateHUD();
    }

    function updateHUD() {
        const p1Health = document.getElementById('player1Health');
        const p2Health = document.getElementById('player2Health');
        const timer = document.getElementById('timer');

        if (p1Health && player1) p1Health.style.width = (player1.health / player1.maxHealth * 100) + '%';
        if (p2Health && player2) p2Health.style.width = (player2.health / player2.maxHealth * 100) + '%';
        if (timer) timer.textContent = Math.ceil(timeRemaining);
    }

    function checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width && box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
    }

    function gameLoop(timestamp) {
        const dt = timestamp - lastTime;
        lastTime = timestamp;

        // pause for dramatic effect
        if (hitstopTimer > 0) {
            hitstopTimer -= dt;
            requestAnimationFrame(gameLoop);
            return;
        }

        // state machine? more like state vibing
        if (gameState === 'countdown') {
            countdownTimer += dt;
            if (countdownTimer >= 1000) {
                countdownTimer = 0;
                countdownValue--;
                if (countdownValue <= 0) {
                    gameState = 'playing';
                    audioManager.playAnnouncement();
                }
            }
        } else if (gameState === 'playing') {
            timeRemaining -= dt / 1000;
            if (timeRemaining <= 0) {
                timeRemaining = 0;
                endGame();
            }

            // did they punch?
            const p1Attack = keys[' '];
            const p2Attack = keys['.'];
            const p1Special = keys['f'];
            const p2Special = keys['/'];

            if (p1Attack && player1.attack()) keys[' '] = false;
            if (p2Attack && player2.attack()) keys['.'] = false;

            if (p1Special) {
                const proj = player1.useSpecial();
                if (proj) {
                    if (proj.type === 'fireball') projectiles.push(proj);
                    else if (proj.type === 'acid') hazards.push(proj);
                }
                keys['f'] = false;
            }
            if (p2Special) {
                const proj = player2.useSpecial();
                if (proj) {
                    if (proj.type === 'fireball') projectiles.push(proj);
                    else if (proj.type === 'acid') hazards.push(proj);
                }
                keys['/'] = false;
            }

            // update the boyz
            player1.update(keys, arena);
            player2.update(keys, arena);

            // ouchies logic
            if (player1.isAttacking) {
                const box = player1.getAttackBox();
                if (checkCollision(box, { x: player2.x, y: player2.y, width: player2.width, height: player2.height })) {
                    player1.isAttacking = false;
                    const dir = player1.facingRight ? 1 : -1;
                    player2.takeDamage(player1.power, dir * 8, -5);
                    hitstopTimer = 50;
                    screenShake = 5;
                }
            }
            if (player2.isAttacking) {
                const box = player2.getAttackBox();
                if (checkCollision(box, { x: player1.x, y: player1.y, width: player1.width, height: player1.height })) {
                    player2.isAttacking = false;
                    const dir = player2.facingRight ? 1 : -1;
                    player1.takeDamage(player2.power, dir * 8, -5);
                    hitstopTimer = 50;
                    screenShake = 5;
                }
            }

            // fly my pretties
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i];
                p.x += p.vx;
                if (p.x < -50 || p.x > canvas.width + 50) { projectiles.splice(i, 1); continue; }

                const target = p.owner ? player2 : player1;
                if (checkCollision({ x: p.x, y: p.y, width: 30, height: 20 },
                    { x: target.x, y: target.y, width: target.width, height: target.height })) {
                    const dir = p.vx > 0 ? 1 : -1;
                    target.takeDamage(p.damage, dir * 10, -3);
                    projectiles.splice(i, 1);
                    hitstopTimer = 50;
                }
            }

            // spicy floor updates
            for (let i = hazards.length - 1; i >= 0; i--) {
                const h = hazards[i];
                h.life--;
                if (h.life <= 0) { hazards.splice(i, 1); continue; }

                const target = h.owner ? player2 : player1;
                if (target.y + target.height >= h.y && target.x + target.width > h.x && target.x < h.x + h.width) {
                    if (h.life % 30 === 0) target.takeDamage(h.damage, 0, -2);
                }
            }

            // yeeted off stage
            if (player1.y > canvas.height + 50 || player1.x < -100 || player1.x > canvas.width + 100) {
                player1.isDead = true;
            }
            if (player2.y > canvas.height + 50 || player2.x < -100 || player2.x > canvas.width + 100) {
                player2.isDead = true;
            }

            // gg ez
            if (player1.isDead || player2.isDead) endGame();

            updateHUD();
        }

        // confetti time
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        if (screenShake > 0) screenShake -= 0.5;

        // make it look pretty
        render();
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameState = 'gameover';
        if (player1.isDead && !player2.isDead) winner = player2;
        else if (player2.isDead && !player1.isDead) winner = player1;
        else if (player1.health > player2.health) winner = player1;
        else if (player2.health > player1.health) winner = player2;
        else winner = null;

        const displayText = document.getElementById('displayText');
        if (displayText) {
            displayText.style.display = 'flex';
            displayText.textContent = winner ? `${winner.name.toUpperCase()} WINS!` : 'TIE!';
        }

        setTimeout(() => {
            const winnerText = document.getElementById('winner-text');
            if (winnerText) winnerText.textContent = winner ? `${winner.name.toUpperCase()} WINS!` : 'TIE GAME!';
            document.getElementById('screens').style.display = 'block';
            document.getElementById('game-ui').classList.add('hidden');
            showScreen('game-over');
        }, 2000);
    }

    function render() {
        ctx.save();
        if (screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        }

        // set the mood
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // floor is lava (jk its just floor)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(arena.platformX, arena.platformY, arena.platformWidth, arena.platformHeight);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(arena.platformX, arena.platformY, arena.platformWidth, 3);

        // danger zones
        hazards.forEach(h => {
            ctx.fillStyle = `rgba(204, 255, 0, ${Math.min(1, h.life / 60) * 0.6})`;
            ctx.beginPath();
            ctx.ellipse(h.x + h.width / 2, h.y + 5, h.width / 2, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // bullets go brrr
        projectiles.forEach(p => {
            const grd = ctx.createRadialGradient(p.x + 15, p.y + 10, 0, p.x + 15, p.y + 10, 20);
            grd.addColorStop(0, '#FFFF00');
            grd.addColorStop(0.5, '#FF8C00');
            grd.addColorStop(1, '#FF4D4D');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.ellipse(p.x + 15, p.y + 10, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // draw the gladiators
        if (player1) player1.draw(ctx);
        if (player2) player2.draw(ctx);

        // magic dust
        particles.forEach(p => p.draw(ctx));

        // 3.. 2.. 1.. LETS GO
        if (gameState === 'countdown') {
            ctx.font = 'bold 120px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 30;
            ctx.fillText(countdownValue > 0 ? countdownValue : 'FIGHT!', canvas.width / 2, canvas.height / 2);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    // stuff accessible from anywhere lol
    window.initGame = function () {
        const p1 = window.p1Selection || 'Spicy';
        const p2 = window.p2Selection || 'Salty';
        startGame(p1, p2);
        requestAnimationFrame(gameLoop);
    };

    window.resetGame = function () {
        const p1 = window.p1Selection || 'Spicy';
        const p2 = window.p2Selection || 'Salty';
        document.getElementById('displayText').style.display = 'none';
        startGame(p1, p2);
    };

})();
