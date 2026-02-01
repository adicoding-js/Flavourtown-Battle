// ============================================
// SWEET - Speedster Character
// Special: Sugar Rush (double speed for 3 seconds)
// ============================================

import Fighter from '../fighter.js';
import particleSystem from '../particles.js';
import audioManager from '../audio.js';

class Sweet extends Fighter {
    constructor({ x, y, isPlayer1 = true }) {
        super({
            x,
            y,
            name: 'Sweet',
            color: '#FF69B4',
            isPlayer1,
            maxHealth: 90,
            power: 8,
            speed: 8,
            defense: 1
        });

        this.specialMaxCooldown = 240; // 4 seconds
        this.sugarRushActive = false;
        this.sugarRushDuration = 180; // 3 seconds
        this.sugarRushTimer = 0;
        this.baseSpeed = 8;
        this.particleTimer = 0;
    }

    update(arena, input, playerKey) {
        super.update(arena, input, playerKey);

        // Update sugar rush timer
        if (this.sugarRushActive) {
            this.sugarRushTimer--;

            // Spawn trail particles while boosted
            if (this.sugarRushTimer % 3 === 0) {
                particleSystem.spawnTrailParticle(
                    this.x + this.width / 2,
                    this.y + this.height - 10,
                    this.color
                );
            }

            if (this.sugarRushTimer <= 0) {
                this.sugarRushActive = false;
                this.speed = this.baseSpeed;
            }
        }
    }

    useSpecial() {
        if (this.specialCooldown > 0) return;

        super.useSpecial();
        audioManager.playSpecial('speed');

        // Activate sugar rush
        this.sugarRushActive = true;
        this.sugarRushTimer = this.sugarRushDuration;
        this.speed = this.baseSpeed * 2;

        // Heart burst particles
        particleSystem.spawnHeartParticles(
            this.x + this.width / 2,
            this.y + this.height / 2,
            12
        );
    }

    updateParticles() {
        this.particleTimer++;

        // Heart particles when moving fast
        if (this.sugarRushActive && this.particleTimer % 4 === 0) {
            particleSystem.spawnHeartParticles(
                this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                this.y + this.height / 2 + (Math.random() - 0.5) * 30,
                1
            );
        }

        // Occasional sparkles when idle
        if (!this.sugarRushActive && this.particleTimer % 30 === 0) {
            particleSystem.spawnHeartParticles(
                this.x + this.width / 2,
                this.y + 20,
                1
            );
        }
    }

    draw(ctx) {
        // Draw speed lines when sugar rush is active
        if (this.sugarRushActive) {
            this.drawSpeedLines(ctx);
        }

        super.draw(ctx);

        // Draw cooldown indicator
        if (this.specialCooldown > 0) {
            this.drawCooldownIndicator(ctx);
        }

        // Draw sugar rush timer
        if (this.sugarRushActive) {
            this.drawSugarRushTimer(ctx);
        }
    }

    drawSpeedLines(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.5)';
        ctx.lineWidth = 2;

        const direction = this.facingRight ? -1 : 1;
        for (let i = 0; i < 5; i++) {
            const y = this.y + 20 + i * 25;
            const x = this.x + this.width / 2 + direction * 30;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + direction * (30 + Math.random() * 20), y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawSugarRushTimer(ctx) {
        const progress = this.sugarRushTimer / this.sugarRushDuration;
        const x = this.x + this.width / 2;
        const y = this.y - 35;
        const width = 40;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - width / 2, y, width, 8);

        // Progress
        ctx.fillStyle = this.color;
        ctx.fillRect(x - width / 2, y, width * progress, 8);

        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - width / 2, y, width, 8);

        ctx.restore();
    }

    drawCooldownIndicator(ctx) {
        const progress = 1 - (this.specialCooldown / this.specialMaxCooldown);
        const x = this.x + this.width / 2;
        const y = this.y - 20;
        const radius = 10;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export default Sweet;
