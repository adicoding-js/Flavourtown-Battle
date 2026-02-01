// ============================================
// PARTICLE SYSTEM - Visual Effects
// ============================================

class Particle {
    constructor({ x, y, vx, vy, color, size, life, gravity = 0.1, friction = 0.99, shape = 'square' }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.friction = friction;
        this.shape = shape;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.rotationSpeed;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'heart':
                this.drawHeart(ctx);
                break;
            case 'star':
                this.drawStar(ctx);
                break;
            default: // square
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }

    drawHeart(ctx) {
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, s / 4);
        ctx.bezierCurveTo(-s / 2, -s / 4, -s, s / 4, 0, s);
        ctx.bezierCurveTo(s, s / 4, s / 2, -s / 4, 0, s / 4);
        ctx.fill();
    }

    drawStar(ctx) {
        const s = this.size;
        const spikes = 5;
        const outerRadius = s;
        const innerRadius = s / 2;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    // Spawn hit particles (confetti burst)
    spawnHitParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push(new Particle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: this.varyColor(color),
                size: 4 + Math.random() * 6,
                life: 30 + Math.random() * 20,
                gravity: 0.15
            }));
        }
    }

    // Spawn fire particles (for Spicy)
    spawnFireParticles(x, y, count = 5) {
        const colors = ['#FF4D4D', '#FF8C00', '#FFD700', '#FF6B35'];
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 20,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 5 + Math.random() * 8,
                life: 20 + Math.random() * 15,
                gravity: -0.05,
                shape: 'circle'
            }));
        }
    }

    // Spawn salt crystals (for Salty)
    spawnSaltParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: ['#FFFFFF', '#E8E8E8', '#D0D0D0'][Math.floor(Math.random() * 3)],
                size: 3 + Math.random() * 4,
                life: 40 + Math.random() * 20,
                gravity: 0.05,
                shape: 'square'
            }));
        }
    }

    // Spawn acid bubbles (for Sour)
    spawnAcidParticles(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 30,
                y,
                vx: (Math.random() - 0.5) * 1,
                vy: -0.5 - Math.random() * 2,
                color: ['#CCFF00', '#99FF00', '#66FF00'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 6,
                life: 30 + Math.random() * 20,
                gravity: -0.02,
                shape: 'circle'
            }));
        }
    }

    // Spawn hearts (for Sweet)
    spawnHeartParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 2,
                color: ['#FF69B4', '#FF1493', '#FFB6C1'][Math.floor(Math.random() * 3)],
                size: 8 + Math.random() * 6,
                life: 40 + Math.random() * 20,
                gravity: -0.03,
                shape: 'heart'
            }));
        }
    }

    // Spawn purple smoke (for Umami)
    spawnSmokeParticles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle({
                x: x + (Math.random() - 0.5) * 30,
                y,
                vx: (Math.random() - 0.5) * 3,
                vy: -0.5 - Math.random() * 1.5,
                color: ['#9D00FF', '#7B00CC', '#5900A6', '#4B0082'][Math.floor(Math.random() * 4)],
                size: 10 + Math.random() * 15,
                life: 40 + Math.random() * 30,
                gravity: -0.01,
                friction: 0.97,
                shape: 'circle'
            }));
        }
    }

    // Spawn trail particles
    spawnTrailParticle(x, y, color) {
        this.particles.push(new Particle({
            x,
            y,
            vx: 0,
            vy: 0,
            color,
            size: 6,
            life: 10,
            gravity: 0,
            shape: 'circle'
        }));
    }

    // Vary color slightly for variety
    varyColor(baseColor) {
        // Simple color variation - just return different shades
        const colors = [baseColor, this.lightenColor(baseColor), this.darkenColor(baseColor)];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    lightenColor(color) {
        return color; // Simplified - just return same color
    }

    darkenColor(color) {
        return color; // Simplified - just return same color
    }

    clear() {
        this.particles = [];
    }
}

const particleSystem = new ParticleSystem();
export default particleSystem;
