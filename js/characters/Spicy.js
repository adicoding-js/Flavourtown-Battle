// ============================================
// SPICY - Glass Cannon Character
// Special: Fireball projectile
// ============================================

import Fighter from '../fighter.js';
import particleSystem from '../particles.js';
import audioManager from '../audio.js';
import projectileSystem from '../projectiles.js';

class Spicy extends Fighter {
    constructor({ x, y, isPlayer1 = true }) {
        super({
            x,
            y,
            name: 'Spicy',
            color: '#FF4D4D',
            isPlayer1,
            maxHealth: 80,
            power: 15,
            speed: 6,
            defense: 0
        });

        this.specialMaxCooldown = 90; // 1.5 seconds
        this.particleTimer = 0;
    }

    useSpecial() {
        if (this.specialCooldown > 0) return;

        super.useSpecial();
        audioManager.playSpecial('fireball');

        // Create fireball projectile
        const direction = this.facingRight ? 1 : -1;
        const fireballX = this.facingRight ? this.x + this.width : this.x - 30;
        const fireballY = this.y + 50;

        const fireball = projectileSystem.createFireball(
            fireballX,
            fireballY,
            direction,
            this.isPlayer1 ? 'player1' : 'player2'
        );
        fireball.damage = this.power;
        projectileSystem.addProjectile(fireball);

        // Fire burst particles
        particleSystem.spawnFireParticles(fireballX, fireballY, 10);
    }

    updateParticles() {
        this.particleTimer++;

        // Ambient fire particles when moving fast
        if (Math.abs(this.vx) > 3 && this.particleTimer % 5 === 0) {
            particleSystem.spawnFireParticles(
                this.x + this.width / 2,
                this.y + this.height,
                2
            );
        }

        // Fire aura when using special
        if (this.isUsingSpecial) {
            particleSystem.spawnFireParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                3
            );
        }
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw cooldown indicator
        if (this.specialCooldown > 0) {
            this.drawCooldownIndicator(ctx);
        }
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

export default Spicy;
