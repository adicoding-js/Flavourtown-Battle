// ============================================
// GAME STATE MANAGER - Core Game Logic
// ============================================

import Arena from './arena.js';
import inputHandler from './input.js';
import particleSystem from './particles.js';
import audioManager from './audio.js';
import projectileSystem from './projectiles.js';
import uiManager from './ui.js';

// Import character classes
import Spicy from './characters/Spicy.js';
import Salty from './characters/Salty.js';
import Sour from './characters/Sour.js';
import Sweet from './characters/Sweet.js';
import Umami from './characters/Umami.js';

const CHARACTER_CLASSES = {
    'Spicy': Spicy,
    'Salty': Salty,
    'Sour': Sour,
    'Sweet': Sweet,
    'Umami': Umami
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 1024;
        this.canvas.height = 576;

        // Game state
        this.state = 'menu'; // menu, countdown, playing, hitstop, paused, gameover
        this.player1 = null;
        this.player2 = null;
        this.arena = null;

        // Timer
        this.roundTime = 60; // seconds
        this.timeRemaining = this.roundTime;
        this.lastTimestamp = 0;

        // Hitstop (freeze frame on hit)
        this.hitstopTimer = 0;
        this.hitstopDuration = 50; // ms

        // Screen shake
        this.screenShakeTimer = 0;
        this.screenShakeIntensity = 0;

        // Countdown
        this.countdownTimer = 0;
        this.countdownValue = 3;

        // Character selections
        this.p1Selection = 'Spicy';
        this.p2Selection = 'Salty';

        // Winner
        this.winner = null;

        // Initialize UI
        uiManager.init();
    }

    // Set character selections
    setCharacterSelections(p1Char, p2Char) {
        this.p1Selection = p1Char;
        this.p2Selection = p2Char;
    }

    // Start new game
    startGame() {
        // Create arena
        this.arena = new Arena(this.canvas.width, this.canvas.height, 'cutting_board');

        // Get spawn positions
        const spawns = this.arena.getSpawnPositions();

        // Create fighters based on selection
        const P1Class = CHARACTER_CLASSES[this.p1Selection] || Spicy;
        const P2Class = CHARACTER_CLASSES[this.p2Selection] || Salty;

        this.player1 = new P1Class({
            x: spawns.player1.x,
            y: spawns.player1.y,
            isPlayer1: true
        });

        this.player2 = new P2Class({
            x: spawns.player2.x,
            y: spawns.player2.y,
            isPlayer1: false
        });

        // Set player info in UI
        uiManager.setPlayerInfo(this.player1, this.player2);

        // Reset game state
        this.timeRemaining = this.roundTime;
        this.winner = null;
        this.state = 'countdown';
        this.countdownTimer = 0;
        this.countdownValue = 3;

        // Clear projectiles
        projectileSystem.clear();
        particleSystem.clear();

        // Hide winner text
        uiManager.hideWinner();

        // Show game UI
        uiManager.showGameUI();

        // Initialize audio
        audioManager.init();

        console.log('Game started!', this.p1Selection, 'vs', this.p2Selection);
    }

    // Main update loop
    update(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        switch (this.state) {
            case 'countdown':
                this.updateCountdown(deltaTime);
                break;
            case 'playing':
                this.updatePlaying(deltaTime);
                break;
            case 'hitstop':
                this.updateHitstop(deltaTime);
                break;
            case 'gameover':
                // Just update particles for visual effect
                particleSystem.update();
                break;
        }

        // Update screen shake
        if (this.screenShakeTimer > 0) {
            this.screenShakeTimer -= deltaTime;
        }
    }

    updateCountdown(deltaTime) {
        this.countdownTimer += deltaTime;

        if (this.countdownTimer >= 1000) {
            this.countdownTimer = 0;
            this.countdownValue--;

            if (this.countdownValue <= 0) {
                this.state = 'playing';
                uiManager.showAnnouncement('FIGHT!', 1000);
                audioManager.playAnnouncement('fight');
            }
        }
    }

    updatePlaying(deltaTime) {
        // Update timer
        this.timeRemaining -= deltaTime / 1000;
        uiManager.updateTimer(this.timeRemaining);

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endRoundByTimeout();
            return;
        }

        // Update arena
        this.arena.update();

        // Update fighters
        this.player1.update(this.arena, inputHandler, 'player1');
        this.player2.update(this.arena, inputHandler, 'player2');

        // Check for ring-outs
        if (this.arena.isRingOut(this.player1)) {
            this.player1.die();
            this.endRound(this.player2);
            return;
        }
        if (this.arena.isRingOut(this.player2)) {
            this.player2.die();
            this.endRound(this.player1);
            return;
        }

        // Check combat collisions
        this.checkCombat();

        // Update projectiles and check collisions
        this.updateProjectiles();

        // Check hazard zones
        this.checkHazardZones();

        // Check sizzle damage (frying pan arena)
        if (this.arena.shouldSizzleDamage()) {
            if (this.arena.isOnPlatform(this.player1)) {
                this.player1.takeDamage(2, 0, -5);
            }
            if (this.arena.isOnPlatform(this.player2)) {
                this.player2.takeDamage(2, 0, -5);
            }
        }

        // Update particles
        particleSystem.update();

        // Update health UI
        uiManager.updateHealth(this.player1, this.player2);

        // Check for deaths
        if (this.player1.isDead) {
            this.endRound(this.player2);
        } else if (this.player2.isDead) {
            this.endRound(this.player1);
        }
    }

    updateHitstop(deltaTime) {
        this.hitstopTimer -= deltaTime;
        if (this.hitstopTimer <= 0) {
            this.state = 'playing';
        }
    }

    checkCombat() {
        // Player 1 attacks Player 2
        if (this.player1.checkAttackCollision(this.player2)) {
            const direction = this.player1.facingRight ? 1 : -1;
            this.player2.takeDamage(
                this.player1.power,
                direction * 8,
                -5,
                this.player1
            );
            this.triggerHitstop();
            this.triggerScreenShake(5);
        }

        // Player 2 attacks Player 1
        if (this.player2.checkAttackCollision(this.player1)) {
            const direction = this.player2.facingRight ? 1 : -1;
            this.player1.takeDamage(
                this.player2.power,
                direction * 8,
                -5,
                this.player2
            );
            this.triggerHitstop();
            this.triggerScreenShake(5);
        }
    }

    updateProjectiles() {
        projectileSystem.update();

        // Check projectile collisions
        projectileSystem.projectiles.forEach(projectile => {
            // Skip if projectile is inactive
            if (!projectile.active) return;

            // Check collision with fighters
            const targetPlayer = projectile.owner === 'player1' ? this.player2 : this.player1;
            const ownerPlayer = projectile.owner === 'player1' ? this.player1 : this.player2;

            if (projectile.collidesWith(targetPlayer)) {
                // Check for reflection (Salty's shield)
                if (targetPlayer.canReflectProjectile && targetPlayer.canReflectProjectile()) {
                    // Reflect projectile
                    projectile.vx *= -1;
                    projectile.owner = projectile.owner === 'player1' ? 'player2' : 'player1';
                    particleSystem.spawnSaltParticles(
                        targetPlayer.x + targetPlayer.width / 2,
                        targetPlayer.y + targetPlayer.height / 2,
                        10
                    );
                    audioManager.playSpecial('shield');
                } else {
                    // Deal damage
                    const direction = projectile.vx > 0 ? 1 : -1;
                    targetPlayer.takeDamage(
                        projectile.damage,
                        direction * 10,
                        -3,
                        ownerPlayer
                    );
                    projectile.active = false;
                    this.triggerHitstop();
                    this.triggerScreenShake(8);
                }
            }
        });
    }

    checkHazardZones() {
        projectileSystem.hazardZones.forEach(zone => {
            if (!zone.active) return;

            // Check if fighters are in the zone
            const ownerPlayer = zone.owner === 'player1' ? this.player1 : this.player2;
            const targetPlayer = zone.owner === 'player1' ? this.player2 : this.player1;

            if (zone.containsFighter(targetPlayer) && zone.shouldDamage()) {
                targetPlayer.takeDamage(zone.damage, 0, -2, ownerPlayer);
            }
        });
    }

    triggerHitstop() {
        this.state = 'hitstop';
        this.hitstopTimer = this.hitstopDuration;
    }

    triggerScreenShake(intensity) {
        this.screenShakeIntensity = intensity;
        this.screenShakeTimer = 200;
    }

    endRound(winner) {
        this.state = 'gameover';
        this.winner = winner;

        uiManager.showWinner(winner.name);
        audioManager.playAnnouncement('win');

        // Show game over screen after delay
        setTimeout(() => {
            document.getElementById('winner-text').textContent = `${winner.name.toUpperCase()} WINS!`;
            uiManager.showScreen('game-over');
            uiManager.showScreens();
        }, 2000);
    }

    endRoundByTimeout() {
        this.state = 'gameover';

        if (this.player1.health > this.player2.health) {
            this.winner = this.player1;
            uiManager.showWinner(this.player1.name);
        } else if (this.player2.health > this.player1.health) {
            this.winner = this.player2;
            uiManager.showWinner(this.player2.name);
        } else {
            this.winner = null;
            uiManager.showWinner('', true);
        }

        audioManager.playAnnouncement(this.winner ? 'win' : 'ko');

        setTimeout(() => {
            if (this.winner) {
                document.getElementById('winner-text').textContent = `${this.winner.name.toUpperCase()} WINS!`;
            } else {
                document.getElementById('winner-text').textContent = 'TIE GAME!';
            }
            uiManager.showScreen('game-over');
            uiManager.showScreens();
        }, 2000);
    }

    // Main render loop
    render() {
        const ctx = this.ctx;

        // Apply screen shake
        ctx.save();
        if (this.screenShakeTimer > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
            ctx.translate(shakeX, shakeY);
        }

        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.arena) {
            // Draw arena background and platforms
            this.arena.draw(ctx);
        }

        // Draw projectiles and hazard zones
        projectileSystem.draw(ctx);

        // Draw fighters
        if (this.player1) this.player1.draw(ctx);
        if (this.player2) this.player2.draw(ctx);

        // Draw particles
        particleSystem.draw(ctx);

        // Draw countdown
        if (this.state === 'countdown') {
            this.drawCountdown(ctx);
        }

        // Draw announcements
        uiManager.drawAnnouncement(ctx, this.canvas.width, this.canvas.height);

        ctx.restore();
    }

    drawCountdown(ctx) {
        const text = this.countdownValue > 0 ? this.countdownValue.toString() : 'FIGHT!';

        ctx.save();
        ctx.font = 'bold 120px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 30;
        ctx.fillStyle = 'white';
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        ctx.restore();
    }

    // Reset game for rematch
    reset() {
        this.startGame();
    }
}

export default Game;
