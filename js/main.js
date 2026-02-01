// ============================================
// MAIN - Entry Point & Game Loop
// ============================================

import Game from './game.js';
import audioManager from './audio.js';

// Get canvas
const canvas = document.getElementById('gameCanvas');

// Create game instance
const game = new Game(canvas);

// Character selection state
let p1Selection = 'Spicy';
let p2Selection = 'Salty';
let selectingFor = 'player1'; // Which player is currently selecting

// Animation loop
let animationId;

function gameLoop(timestamp) {
    game.update(timestamp);
    game.render();
    animationId = requestAnimationFrame(gameLoop);
}

// Initialize the game (called when starting from menu)
window.initGame = function () {
    console.log('Initializing game...');

    // Read selections from window globals (set by HTML script)
    const p1Char = window.p1Selection || 'Spicy';
    const p2Char = window.p2Selection || 'Salty';

    game.setCharacterSelections(p1Char, p2Char);
    game.startGame();

    // Start game loop if not already running
    if (!animationId) {
        animationId = requestAnimationFrame(gameLoop);
    }
};

// Reset game for rematch
window.resetGame = function () {
    game.reset();
};

// Character selection handling
window.selectChar = function (flavor) {
    // For single-selection mode, select for both players for now
    // In a proper implementation, we'd have separate selection for each player
    p1Selection = flavor;

    console.log('Selected:', flavor);
    audioManager.playUI('select');

    // Show player 2 selection (simplified - just start game for now)
    startGameUI();
};

// Start game UI (transition from character select to game)
window.startGameUI = function () {
    // Hide all screens
    document.getElementById('screens').style.display = 'none';
    // Show Game UI
    document.getElementById('game-ui').classList.remove('hidden');
    // Initialize game
    if (window.initGame) window.initGame();
};

// Screen navigation
window.showScreen = function (screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        audioManager.playUI('select');
    }
};

// Add hover sounds to buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effect to all buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            audioManager.init();
            audioManager.playUI('hover');
        });
    });

    // Add click effect to character cards
    document.querySelectorAll('.char-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            audioManager.init();
            audioManager.playUI('hover');
        });
    });
});

// Export for debugging
window.game = game;
