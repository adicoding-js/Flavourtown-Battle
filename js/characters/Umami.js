// ============================================
// UMAMI - Brawler Character
// Special: Meat Hammer (massive knockback slam)
// ============================================

import Fighter from '../fighter.js';
import particleSystem from '../particles.js';
import audioManager from '../audio.js';

class Umami extends Fighter {
    constructor({ x, y, isPlayer1 = true }) {
        super({
            x,
            y,
            name: 'Umami',
            color: '#9D00FF',
            isPlayer1,
            maxHealth: 120,
            power: 12,
            speed: 4,
            defense: 2
        });

        this.specialMaxCooldown = 150; // 2.5 seconds
        this.hammerActive = false;
        this.hammerDuration = 20;
        this.hammerTimer = 0;
        this.particleTimer = 0;

        // Larger attack box for this brawler
        this.attackBox.width = 80;
        this.attackBox.height = 50;
    }

    update(arena, input, playerKey) {
        super.update(arena, input, playerKey);

        // Update hammer attack
        if (this.hammerActive) {
            this.hammerTimer--;
            if (this.hammerTimer <= 0) {
                this.hammerActive = false;
            }
        }
    }

    useSpecial() {
        if (this.specialCooldown > 0) return;

        super.useSpecial();
        audioManager.playSpecial('hammer');

        // Activate meat hammer
        this.hammerActive = true;
        this.hammerTimer = this.hammerDuration;
        this.hammerHasHit = false;

        // Ground pound effect
        particleSystem.spawnSmokeParticles(
            this.x + this.width / 2,
            this.y + this.height,
            15
        );

        // Screen shake would be triggered in game.js
    }

    // Override to add hammer knockback
    checkAttackCollision(other) {
        // Check regular attack
        const regularHit = super.checkAttackCollision(other);

        // Check hammer attack
        if (this.hammerActive && !this.hammerHasHit) {
            const hammerBox = {
                x: this.facingRight ? this.x + 20 : this.x - 60,
                y: this.y + 30,
                width: 90,
                height: 100
            };

            const hit = (
                hammerBox.x < other.x + other.width &&
                hammerBox.x + hammerBox.width > other.x &&
                hammerBox.y < other.y + other.height &&
                hammerBox.y + hammerBox.height > other.y
            );

            if (hit && !other.isDead) {
                this.hammerHasHit = true;

                // Apply massive knockback
                const direction = this.facingRight ? 1 : -1;
                other.takeDamage(
                    this.power * 1.5,
                    direction * 20, // Huge horizontal knockback
                    -12, // Upward knockback
                    this
                );

                // Extra particles
                particleSystem.spawnSmokeParticles(
                    other.x + other.width / 2,
                    other.y + other.height / 2,
                    20
                );

                return true;
            }
        }

        return regularHit;
    }

    updateParticles() {
        this.particleTimer++;

        // Purple smoke trail when attacking
        if ((this.isAttacking || this.hammerActive) && this.particleTimer % 3 === 0) {
            particleSystem.spawnSmokeParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                2
            );
        }

        // Ambient particles
        if (this.particleTimer % 20 === 0) {
            particleSystem.spawnSmokeParticles(
                this.x + this.width / 2,
                this.y + this.height,
                1
            );
        }
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw hammer attack visual
        if (this.hammerActive) {
            this.drawHammerAttack(ctx);
        }

        // Draw cooldown indicator
        if (this.specialCooldown > 0) {
            this.drawCooldownIndicator(ctx);
        }
    }

    drawHammerAttack(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();

        // Impact wave
        const progress = 1 - (this.hammerTimer / this.hammerDuration);
        const radius = 30 + progress * 60;
        const alpha = 1 - progress;

        ctx.strokeStyle = `rgba(157, 0, 255, ${alpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 30, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Ground crack lines
        ctx.strokeStyle = `rgba(157, 0, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX, this.y + this.height);
            ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                this.y + this.height + Math.sin(angle) * 20
            );
            ctx.stroke();
        }

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

export default Umami;
