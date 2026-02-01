// ============================================
// SOUR - Disruptor Character
// Special: Acid Pool (damage over time)
// ============================================

import Fighter from '../fighter.js';
import particleSystem from '../particles.js';
import audioManager from '../audio.js';
import projectileSystem from '../projectiles.js';

class Sour extends Fighter {
    constructor({ x, y, isPlayer1 = true }) {
        super({
            x,
            y,
            name: 'Sour',
            color: '#CCFF00',
            isPlayer1,
            maxHealth: 100,
            power: 10,
            speed: 5,
            defense: 1
        });

        this.specialMaxCooldown = 150; // 2.5 seconds
        this.particleTimer = 0;
    }

    useSpecial() {
        if (this.specialCooldown > 0) return;

        super.useSpecial();
        audioManager.playSpecial('acid');

        // Create acid pool at current position
        const poolX = this.x + this.width / 2;
        const poolY = this.y + this.height;

        const acidPool = projectileSystem.createAcidPool(
            poolX,
            poolY,
            this.isPlayer1 ? 'player1' : 'player2'
        );
        projectileSystem.addHazardZone(acidPool);

        // Acid splash particles
        particleSystem.spawnAcidParticles(poolX, poolY, 15);
    }

    updateParticles() {
        this.particleTimer++;

        // Dripping acid particles when moving
        if (Math.abs(this.vx) > 2 && this.particleTimer % 8 === 0) {
            particleSystem.spawnAcidParticles(
                this.x + this.width / 2,
                this.y + this.height,
                1
            );
        }

        // Acid aura when using special
        if (this.isUsingSpecial) {
            particleSystem.spawnAcidParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                5
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

export default Sour;
