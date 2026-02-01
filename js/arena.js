// check this out
// THE THUNDERDOME (environment stuff)
// ============================================

class Platform {
    constructor({ x, y, width, height, color = '#8B4513' }) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        // make it look like wood i guess
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // squiggly lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
        }

        // shiny top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x, this.y, this.width, 3);

        // shady bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
    }

    // are u on the block?
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }
}

class Arena {
    constructor(canvasWidth, canvasHeight, type = 'cutting_board') {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.type = type;
        this.platforms = [];
        this.deathZoneY = canvasHeight + 100; // abyss

        // sizzle stats
        this.sizzleTimer = 0;
        this.sizzleActive = false;
        this.sizzleDamage = 10;
        this.sizzleDuration = 60; // 1 second
        this.sizzleCooldown = 900; // 15 seconds

        this.setupArena();
    }

    setupArena() {
        this.platforms = [];

        switch (this.type) {
            case 'cutting_board':
                // big plank of wood
                const mainWidth = 700;
                const mainHeight = 40;
                this.platforms.push(new Platform({
                    x: (this.canvasWidth - mainWidth) / 2,
                    y: this.canvasHeight - 150,
                    width: mainWidth,
                    height: mainHeight,
                    color: '#8B4513'
                }));
                break;

            case 'frying_pan':
                // its round-ish
                const panWidth = 600;
                const panHeight = 30;
                this.platforms.push(new Platform({
                    x: (this.canvasWidth - panWidth) / 2,
                    y: this.canvasHeight - 150,
                    width: panWidth,
                    height: panHeight,
                    color: '#2C2C2C'
                }));
                break;
        }
    }

    update() {
        if (this.type === 'frying_pan') {
            this.sizzleTimer++;

            if (this.sizzleTimer >= this.sizzleCooldown) {
                this.sizzleActive = true;
            }

            if (this.sizzleActive && this.sizzleTimer >= this.sizzleCooldown + this.sizzleDuration) {
                this.sizzleActive = false;
                this.sizzleTimer = 0;
            }
        }
    }

    draw(ctx) {
        // paint the walls
        this.drawBackground(ctx);

        // Draw platforms
        this.platforms.forEach(p => {
            if (this.type === 'frying_pan' && this.sizzleActive) {
                // SPICY HOT
                ctx.save();
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 30;
                p.color = '#FF4444';
                p.draw(ctx);
                p.color = '#2C2C2C';
                ctx.restore();
            } else {
                p.draw(ctx);
            }
        });

        // tell em its gonna be hot
        if (this.type === 'frying_pan') {
            this.drawSizzleWarning(ctx);
        }
    }

    drawBackground(ctx) {
        // fade to dark
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // blobs
        // Counter surface
        ctx.fillStyle = '#2d2d44';
        ctx.fillRect(0, this.canvasHeight - 100, this.canvasWidth, 100);

        // Counter edge highlight
        ctx.fillStyle = '#3d3d5c';
        ctx.fillRect(0, this.canvasHeight - 100, this.canvasWidth, 5);

        // Some ambient kitchen items in background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        // Pot
        ctx.beginPath();
        ctx.ellipse(100, this.canvasHeight - 200, 40, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pan
        ctx.beginPath();
        ctx.ellipse(this.canvasWidth - 150, this.canvasHeight - 180, 50, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSizzleWarning(ctx) {
        if (this.sizzleTimer > this.sizzleCooldown - 120 && !this.sizzleActive) {
            // FLASH AA-AAAA
            const flash = Math.sin(Date.now() / 100) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.font = 'bold 24px Orbitron';
                ctx.textAlign = 'center';
                ctx.fillText('⚠ SIZZLE INCOMING ⚠', this.canvasWidth / 2, 100);
            }
        }

        if (this.sizzleActive) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 36px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('🔥 SIZZLE! 🔥', this.canvasWidth / 2, 100);
        }
    }

    // bonk floor check
    checkPlatformCollision(fighter) {
        for (const platform of this.platforms) {
            // gravity + floor = standing
            if (fighter.vy >= 0) {
                const fighterBottom = fighter.y + fighter.height;
                const nextBottom = fighterBottom + fighter.vy;

                if (fighterBottom <= platform.y && nextBottom >= platform.y) {
                    if (fighter.x + fighter.width > platform.x && fighter.x < platform.x + platform.width) {
                        return {
                            collided: true,
                            y: platform.y - fighter.height
                        };
                    }
                }
            }
        }
        return { collided: false };
    }

    // still standing?
    isOnPlatform(fighter) {
        const fighterBottom = fighter.y + fighter.height;
        for (const platform of this.platforms) {
            if (Math.abs(fighterBottom - platform.y) < 5) {
                if (fighter.x + fighter.width > platform.x && fighter.x < platform.x + platform.width) {
                    return true;
                }
            }
        }
        return false;
    }

    // bye bye
    isRingOut(fighter) {
        return fighter.y > this.deathZoneY ||
            fighter.x + fighter.width < -50 ||
            fighter.x > this.canvasWidth + 50;
    }

    // where do they start
    getSpawnPositions() {
        const platform = this.platforms[0];
        return {
            player1: {
                x: platform.x + 80,
                y: platform.y - 150
            },
            player2: {
                x: platform.x + platform.width - 130,
                y: platform.y - 150
            }
        };
    }

    // is it hot in here?
    shouldSizzleDamage() {
        return this.type === 'frying_pan' && this.sizzleActive;
    }
}

export { Platform, Arena };
export default Arena;
