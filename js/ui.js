// ============================================
// UI MANAGER - HUD, Announcements, Menus
// ============================================

class UIManager {
    constructor() {
        this.elements = {
            player1Health: null,
            player2Health: null,
            timer: null,
            displayText: null,
            gameUI: null,
            screens: null
        };

        this.announcement = null;
        this.announcementTimer = 0;
    }

    init() {
        this.elements.player1Health = document.getElementById('player1Health');
        this.elements.player2Health = document.getElementById('player2Health');
        this.elements.timer = document.getElementById('timer');
        this.elements.displayText = document.getElementById('displayText');
        this.elements.gameUI = document.getElementById('game-ui');
        this.elements.screens = document.getElementById('screens');

        // Get player portraits
        this.elements.p1Portrait = document.querySelector('.player-hud.p1 .portrait');
        this.elements.p2Portrait = document.querySelector('.player-hud.p2 .portrait');
        this.elements.p1Name = document.querySelector('.player-hud.p1 .name');
        this.elements.p2Name = document.querySelector('.player-hud.p2 .name');
        this.elements.p1HealthFill = document.querySelector('.player-hud.p1 .health-bar-fill');
        this.elements.p2HealthFill = document.querySelector('.player-hud.p2 .health-bar-fill');
    }

    // Update health bars
    updateHealth(player1, player2) {
        if (this.elements.player1Health) {
            const p1Percent = Math.max(0, (player1.health / player1.maxHealth) * 100);
            this.elements.player1Health.style.width = p1Percent + '%';
        }
        if (this.elements.player2Health) {
            const p2Percent = Math.max(0, (player2.health / player2.maxHealth) * 100);
            this.elements.player2Health.style.width = p2Percent + '%';
        }
    }

    // Update timer display
    updateTimer(seconds) {
        if (this.elements.timer) {
            this.elements.timer.textContent = Math.ceil(seconds);

            // Urgent styling when low
            if (seconds <= 10) {
                this.elements.timer.style.color = '#FF4D4D';
                this.elements.timer.style.textShadow = '0 0 20px #FF4D4D';
            } else {
                this.elements.timer.style.color = 'white';
                this.elements.timer.style.textShadow = '0 0 20px #00FFFF';
            }
        }
    }

    // Set player info based on character selection
    setPlayerInfo(player1, player2) {
        if (this.elements.p1Portrait) {
            this.elements.p1Portrait.style.background = player1.color;
        }
        if (this.elements.p2Portrait) {
            this.elements.p2Portrait.style.background = player2.color;
        }
        if (this.elements.p1Name) {
            this.elements.p1Name.textContent = player1.name.toUpperCase();
        }
        if (this.elements.p2Name) {
            this.elements.p2Name.textContent = player2.name.toUpperCase();
        }
        if (this.elements.p1HealthFill) {
            this.elements.p1HealthFill.style.background = `linear-gradient(90deg, ${player1.color}, ${this.lightenColor(player1.color)})`;
            this.elements.p1HealthFill.style.boxShadow = `0 0 10px ${player1.color}`;
        }
        if (this.elements.p2HealthFill) {
            this.elements.p2HealthFill.style.background = `linear-gradient(90deg, ${player2.color}, ${this.lightenColor(player2.color)})`;
            this.elements.p2HealthFill.style.boxShadow = `0 0 10px ${player2.color}`;
        }
    }

    lightenColor(color) {
        // Simple lighten - just return same color for now
        return color;
    }

    // Show announcement text
    showAnnouncement(text, duration = 2000) {
        this.announcement = text;
        this.announcementTimer = duration;
    }

    // Draw announcement on canvas
    drawAnnouncement(ctx, canvasWidth, canvasHeight) {
        if (this.announcementTimer > 0) {
            this.announcementTimer -= 16.67; // Roughly one frame at 60fps

            const alpha = Math.min(1, this.announcementTimer / 500);
            const scale = 1 + (1 - alpha) * 0.2;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.scale(scale, scale);

            // Text shadow
            ctx.font = 'bold 80px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Outer glow
            ctx.shadowColor = '#FF4D4D';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(this.announcement, 0, 0);

            // Inner text
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#FF4D4D';
            ctx.lineWidth = 4;
            ctx.strokeText(this.announcement, 0, 0);

            ctx.restore();
        }
    }

    // Show winner announcement
    showWinner(winnerName, isTie = false) {
        if (this.elements.displayText) {
            if (isTie) {
                this.elements.displayText.textContent = 'TIE GAME!';
                this.elements.displayText.style.color = '#00FFFF';
            } else {
                this.elements.displayText.textContent = `${winnerName.toUpperCase()} WINS!`;
            }
            this.elements.displayText.style.display = 'flex';
        }
    }

    // Hide winner text
    hideWinner() {
        if (this.elements.displayText) {
            this.elements.displayText.style.display = 'none';
        }
    }

    // Show game UI
    showGameUI() {
        if (this.elements.gameUI) {
            this.elements.gameUI.classList.remove('hidden');
        }
        if (this.elements.screens) {
            this.elements.screens.style.display = 'none';
        }
    }

    // Hide game UI and show screens
    showScreens() {
        if (this.elements.gameUI) {
            this.elements.gameUI.classList.add('hidden');
        }
        if (this.elements.screens) {
            this.elements.screens.style.display = 'block';
        }
    }

    // Show specific screen
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    }
}

const uiManager = new UIManager();
export default uiManager;
