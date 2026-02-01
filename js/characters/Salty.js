// ============================================
// SALTY - Tank Character
// Special: Salt Shield (reflects projectiles)
// ============================================

import Fighter from '../fighter.js';
import particleSystem from '../particles.js';
import audioManager from '../audio.js';

class Salty extends Fighter {
    constructor({ x, y, isPlayer1 = true }) {
        super({
            x,
            y,
            name: 'Salty',
            color: '#FFFFFF',
            isPlayer1,
            maxHealth: 150,
            power: 8,
            speed: 4,
            defense: 3
        });

        this.specialMaxCooldown = 180; // 3 seconds
        this.shieldActive = false;
        this.shieldDuration = 120; // 2 seconds
        this.shieldTimer = 0;
        this.particleTimer = 0;
    }

    update(arena, input, playerKey) {
        super.update(arena, input, playerKey);

        // Update shield timer
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }
    }

    useSpecial() {
        if (this.specialCooldown > 0) return;

        super.useSpecial();
        audioManager.playSpecial('shield');

        // Activate shield
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration;

        // Salt crystal burst
        particleSystem.spawnSaltParticles(
            this.x + this.width / 2,
            this.y + this.height / 2,
            15
        );
    }

    // Override takeDamage to reduce damage while shielding
    takeDamage(amount, knockbackX = 0, knockbackY = 0, attacker = null) {
        if (this.shieldActive) {
            // Reduce damage significantly while shielded
            amount = Math.floor(amount * 0.2);
            knockbackX *= 0.3;
            knockbackY *= 0.3;

            // Salt particles on block
            particleSystem.spawnSaltParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                8
            );
        }

        super.takeDamage(amount, knockbackX, knockbackY, attacker);
    }

    // Check if shield reflects a projectile
    canReflectProjectile() {
        return this.shieldActive;
    }

    updateParticles() {
        this.particleTimer++;

        // Salt aura while shield is active
        if (this.shieldActive && this.particleTimer % 10 === 0) {
            particleSystem.spawnSaltParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                2
            );
        }
    }

    draw(ctx) {
        // Draw shield first (behind character)
        if (this.shieldActive) {
            this.drawShield(ctx);
        }

        super.draw(ctx);

        // Draw cooldown indicator
        if (this.specialCooldown > 0) {
            this.drawCooldownIndicator(ctx);
        }
    }

    drawShield(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = 60;

        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
        const alpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;

        ctx.save();

        // Shield glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.fill();

        // Shield border
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.3})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner crystalline pattern
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Date.now() / 1000;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * radius * 0.8,
                centerY + Math.sin(angle) * radius * 0.8
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

export default Salty;
