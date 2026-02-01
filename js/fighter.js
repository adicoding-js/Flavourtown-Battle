// check this out
// BASE FIGHTER - boilerplate for the fighters
// ============================================

import particleSystem from './particles.js';
import audioManager from './audio.js';

class Fighter {
    constructor({
        x, y,
        name = 'Fighter',
        color = '#FF4D4D',
        isPlayer1 = true,
        // rpg numbers
        maxHealth = 100,
        power = 10,
        speed = 5,
        defense = 1
    }) {
        // where u at
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 120;

        // speed info
        this.vx = 0;
        this.vy = 0;

        // rpg numbers
        this.name = name;
        this.color = color;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.power = power;
        this.speed = speed;
        this.defense = defense;

        // what is happening rn
        this.isPlayer1 = isPlayer1;
        this.facingRight = isPlayer1;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.isBlocking = false;
        this.isUsingSpecial = false;

        // flop mode
        this.isRagdoll = false;
        this.ragdollTimer = 0;
        this.ragdollRotation = 0;

        // hitbox numbers
        this.attackBox = {
            x: 0,
            y: 0,
            width: 70,
            height: 40,
            offset: { x: 40, y: 40 }
        };
        this.attackTimer = 0;
        this.attackCooldown = 20; // Frames
        this.attackDuration = 8;
        this.hasHitThisAttack = false;

        // no spamming allowed
        this.specialCooldown = 0;
        this.specialMaxCooldown = 120; // 2 seconds

        // look alive
        this.animationFrame = 0;
        this.animationTimer = 0;

        // cant move lol
        this.hitstunTimer = 0;

        // blink red
        this.damageFlashTimer = 0;

        // newton was here
        this.gravity = 0.6;
        this.jumpForce = -15;
        this.friction = 0.85;
        this.airFriction = 0.95;

        // noodle placement
        this.limbAngles = {
            leftArm: 0,
            rightArm: 0,
            leftLeg: 0,
            rightLeg: 0
        };
    }

    update(arena, input, playerKey) {
        if (this.isDead) return;

        // tick tock
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.hitstunTimer > 0) this.hitstunTimer--;
        if (this.damageFlashTimer > 0) this.damageFlashTimer--;

        // wake up
        if (this.isRagdoll) {
            this.ragdollTimer--;
            this.ragdollRotation += this.vx * 0.05;
            if (this.ragdollTimer <= 0 && this.isGrounded) {
                this.isRagdoll = false;
                this.ragdollRotation = 0;
            }
        }

        // u are stunned bro
        if (this.hitstunTimer <= 0 && !this.isRagdoll) {
            this.handleInput(input, playerKey);
        }

        // gravity is a suggestion (jk its law)
        this.applyPhysics(arena);

        // Update attack box position
        this.updateAttackBox(); // move the hurt box

        // timing is key
        if (this.isAttacking && this.attackTimer <= this.attackCooldown - this.attackDuration) {
            this.isAttacking = false;
        }

        // wiggle wiggle
        this.updateAnimation();

        // glitter
        this.updateParticles();
    }

    handleInput(input, playerKey) {
        // wasd keys go brr
        if (input.isPressed(playerKey, 'left')) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (input.isPressed(playerKey, 'right')) {
            this.vx = this.speed;
            this.facingRight = true;
        }

        // hop
        if (input.isJustPressed(playerKey, 'jump') && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            audioManager.playJump();
        }

        // pow
        if (input.isJustPressed(playerKey, 'attack') && this.attackTimer <= 0) {
            this.attack();
        }

        // ult
        if (input.isJustPressed(playerKey, 'special') && this.specialCooldown <= 0) {
            this.useSpecial();
        }
    }

    applyPhysics(arena) {
        // down we go
        this.vy += this.gravity;

        // move it move it
        this.x += this.vx;
        this.y += this.vy;

        // slippery floor
        if (this.isGrounded) {
            this.vx *= this.friction;
        } else {
            this.vx *= this.airFriction;
        }

        // stop jittering
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // dont fall thru
        const collision = arena.checkPlatformCollision(this);
        if (collision.collided) {
            this.y = collision.y;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = arena.isOnPlatform(this);
            if (!this.isGrounded && this.vy >= 0) {
                // coyote time? nah
                this.isGrounded = false;
            }
        }

        // edge of the world
        if (this.x < -200) this.x = -200;
        if (this.x > arena.canvasWidth + 150) this.x = arena.canvasWidth + 150;
    }

    updateAttackBox() {
        if (this.facingRight) {
            this.attackBox.x = this.x + this.attackBox.offset.x;
        } else {
            this.attackBox.x = this.x - this.attackBox.width + (this.width - this.attackBox.offset.x);
        }
        this.attackBox.y = this.y + this.attackBox.offset.y;
    }

    attack() {
        this.isAttacking = true;
        this.attackTimer = this.attackCooldown;
        this.hasHitThisAttack = false;
    }

    useSpecial() {
        // do something cool here
        this.specialCooldown = this.specialMaxCooldown;
        this.isUsingSpecial = true;
        setTimeout(() => this.isUsingSpecial = false, 200);
    }

    takeDamage(amount, knockbackX = 0, knockbackY = 0, attacker = null) {
        // tank it
        const actualDamage = Math.max(1, amount - this.defense);
        this.health -= actualDamage;

        // fly further if ur hurt
        const knockbackMultiplier = 1 + (1 - this.health / this.maxHealth);
        this.vx = knockbackX * knockbackMultiplier;
        this.vy = knockbackY * knockbackMultiplier;

        // Hitstun
        this.hitstunTimer = 15;
        this.damageFlashTimer = 10;

        // YEET
        if (Math.abs(knockbackX) > 12 || Math.abs(knockbackY) > 10) {
            this.isRagdoll = true;
            this.ragdollTimer = 30;
        }

        // blood? nah sparks
        particleSystem.spawnHitParticles(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.color
        );

        audioManager.playHit();

        // u ded?
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.isRagdoll = true;
        audioManager.playKnockout();
    }

    // did i hit em?
    checkAttackCollision(other) {
        if (!this.isAttacking || this.hasHitThisAttack) return false;
        if (other.isDead) return false;

        const hit = (
            this.attackBox.x < other.x + other.width &&
            this.attackBox.x + this.attackBox.width > other.x &&
            this.attackBox.y < other.y + other.height &&
            this.attackBox.y + this.attackBox.height > other.y
        );

        if (hit) {
            this.hasHitThisAttack = true;
            return true;
        }
        return false;
    }

    updateAnimation() {
        this.animationTimer++;
        if (this.animationTimer >= 5) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }

        // dance moves
        if (!this.isGrounded) {
            // air pose
            this.limbAngles.leftArm = -0.5;
            this.limbAngles.rightArm = 0.5;
            this.limbAngles.leftLeg = 0.3;
            this.limbAngles.rightLeg = -0.3;
        } else if (Math.abs(this.vx) > 0.5) {
            // naruto run
            const runCycle = Math.sin(this.animationTimer * 0.5) * 0.8;
            this.limbAngles.leftArm = runCycle;
            this.limbAngles.rightArm = -runCycle;
            this.limbAngles.leftLeg = -runCycle;
            this.limbAngles.rightLeg = runCycle;
        } else if (this.isAttacking) {
            // punch pose
            this.limbAngles.leftArm = this.facingRight ? 0 : -2;
            this.limbAngles.rightArm = this.facingRight ? 2 : 0;
            this.limbAngles.leftLeg = 0.2;
            this.limbAngles.rightLeg = -0.2;
        } else {
            // chillin
            const breathe = Math.sin(Date.now() / 500) * 0.1;
            this.limbAngles.leftArm = breathe;
            this.limbAngles.rightArm = -breathe;
            this.limbAngles.leftLeg = 0;
            this.limbAngles.rightLeg = 0;
        }
    }

    updateParticles() {
        // make it unique
    }

    draw(ctx) {
        ctx.save();

        // blink red
        if (this.damageFlashTimer > 0 && this.damageFlashTimer % 4 < 2) {
            ctx.globalAlpha = 0.5;
        }

        // spin to win
        if (this.isRagdoll) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.ragdollRotation);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }

        // draw the masterpiece
        this.drawStickman(ctx);

        // dev hax
        // if (this.isAttacking) {
        //     ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        //     ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        // }

        ctx.restore();
    }

    drawStickman(ctx) {
        const centerX = this.x + this.width / 2;
        const headY = this.y + 20;
        const bodyTopY = this.y + 40;
        const bodyBottomY = this.y + 85;
        const feetY = this.y + this.height;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // shiny
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // noggin
        ctx.beginPath();
        ctx.arc(centerX, headY, 15, 0, Math.PI * 2);
        ctx.stroke();

        // looky here
        ctx.fillStyle = this.color;
        const eyeOffset = this.facingRight ? 5 : -5;
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset, headY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // torso
        ctx.beginPath();
        ctx.moveTo(centerX, bodyTopY);
        ctx.lineTo(centerX, bodyBottomY);
        ctx.stroke();

        // guns
        const armLength = 35;
        const shoulderY = bodyTopY + 5;

        // lefty
        ctx.save();
        ctx.translate(centerX, shoulderY);
        ctx.rotate(this.limbAngles.leftArm + (this.facingRight ? 0 : 0.2));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-armLength, 20);
        ctx.stroke();
        ctx.restore();

        // righty
        ctx.save();
        ctx.translate(centerX, shoulderY);
        ctx.rotate(this.limbAngles.rightArm + (this.facingRight ? -0.2 : 0));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, 20);
        ctx.stroke();
        ctx.restore();

        // stems
        const legLength = 35;

        // leg L
        ctx.save();
        ctx.translate(centerX, bodyBottomY);
        ctx.rotate(this.limbAngles.leftLeg);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-15, legLength);
        ctx.stroke();
        ctx.restore();

        // leg R
        ctx.save();
        ctx.translate(centerX, bodyBottomY);
        ctx.rotate(this.limbAngles.rightLeg);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, legLength);
        ctx.stroke();
        ctx.restore();

        // swish
        if (this.isAttacking) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            const attackX = this.facingRight ? centerX + 40 : centerX - 40;
            ctx.beginPath();
            ctx.arc(attackX, bodyTopY + 20, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        // charge up
        if (this.isUsingSpecial) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, this.y + this.height / 2, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.shadowBlur = 0;
    }

    // middle
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    // run it back
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.health = this.maxHealth;
        this.isDead = false;
        this.isRagdoll = false;
        this.ragdollTimer = 0;
        this.ragdollRotation = 0;
        this.attackTimer = 0;
        this.specialCooldown = 0;
        this.hitstunTimer = 0;
        this.damageFlashTimer = 0;
        this.facingRight = this.isPlayer1;
    }
}

export default Fighter;
