// ============================================
// PROJECTILE SYSTEM - Fireballs, etc.
// ============================================

class Projectile {
    constructor({ x, y, vx, vy, width, height, color, damage, owner, type = 'fireball' }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = width;
        this.height = height;
        this.color = color;
        this.damage = damage;
        this.owner = owner; // 'player1' or 'player2'
        this.type = type;
        this.life = 180; // 3 seconds at 60fps
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        switch (this.type) {
            case 'fireball':
                // Draw fireball with glow
                const gradient = ctx.createRadialGradient(
                    this.x + this.width / 2, this.y + this.height / 2, 0,
                    this.x + this.width / 2, this.y + this.height / 2, this.width
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.3, '#FFFF00');
                gradient.addColorStop(0.6, '#FF8C00');
                gradient.addColorStop(1, '#FF4D4D');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.width / 2,
                    this.height / 2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Glow effect
                ctx.shadowColor = '#FF4D4D';
                ctx.shadowBlur = 20;
                ctx.fill();
                break;

            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    // Check collision with a fighter
    collidesWith(fighter) {
        return (
            this.x < fighter.x + fighter.width &&
            this.x + this.width > fighter.x &&
            this.y < fighter.y + fighter.height &&
            this.y + this.height > fighter.y
        );
    }
}

class HazardZone {
    constructor({ x, y, width, height, color, damage, duration, owner, type = 'acid' }) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.damage = damage; // Damage per second
        this.owner = owner;
        this.type = type;
        this.life = duration;
        this.maxLife = duration;
        this.active = true;
        this.damageTimer = 0;
    }

    update() {
        this.life--;
        this.damageTimer++;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 30); // Fade out in last half second

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;

        switch (this.type) {
            case 'acid':
                // Bubbling acid pool
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.width / 2,
                    this.height / 4,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Bubbles
                ctx.fillStyle = '#EEFF00';
                for (let i = 0; i < 3; i++) {
                    const bubbleX = this.x + 20 + (i * 30) + Math.sin(Date.now() / 200 + i) * 5;
                    const bubbleY = this.y - 5 + Math.sin(Date.now() / 300 + i * 2) * 3;
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, 4 + Math.sin(Date.now() / 100 + i) * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }

    // Check if fighter is standing in the zone
    containsFighter(fighter) {
        const fighterFootY = fighter.y + fighter.height;
        const fighterCenterX = fighter.x + fighter.width / 2;

        return (
            fighterCenterX > this.x &&
            fighterCenterX < this.x + this.width &&
            fighterFootY > this.y &&
            fighterFootY < this.y + this.height + 20
        );
    }

    // Should apply damage this frame? (damage over time)
    shouldDamage() {
        // Damage every 30 frames (0.5 seconds at 60fps)
        if (this.damageTimer >= 30) {
            this.damageTimer = 0;
            return true;
        }
        return false;
    }
}

class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.hazardZones = [];
    }

    update() {
        // Update projectiles
        this.projectiles = this.projectiles.filter(p => {
            p.update();
            return p.active;
        });

        // Update hazard zones
        this.hazardZones = this.hazardZones.filter(h => {
            h.update();
            return h.active;
        });
    }

    draw(ctx) {
        // Draw hazard zones first (below fighters)
        this.hazardZones.forEach(h => h.draw(ctx));

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    addHazardZone(zone) {
        this.hazardZones.push(zone);
    }

    // Create a fireball
    createFireball(x, y, direction, owner) {
        return new Projectile({
            x,
            y,
            vx: direction * 12,
            vy: 0,
            width: 30,
            height: 20,
            color: '#FF4D4D',
            damage: 15,
            owner,
            type: 'fireball'
        });
    }

    // Create an acid pool
    createAcidPool(x, y, owner) {
        return new HazardZone({
            x: x - 40,
            y: y,
            width: 80,
            height: 20,
            color: '#CCFF00',
            damage: 5, // Per tick
            duration: 240, // 4 seconds at 60fps
            owner,
            type: 'acid'
        });
    }

    clear() {
        this.projectiles = [];
        this.hazardZones = [];
    }
}

const projectileSystem = new ProjectileSystem();
export { Projectile, HazardZone, projectileSystem };    
