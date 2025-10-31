// Asset Configuration - Upload dari file lokal
const ASSET_CONFIG = {
    useImages: true, // Set ke false untuk menggunakan CSS shapes
    assets: {
        // Game Objects
        belut: './assets/belut.png',        
        padi: './assets/padi.png',          
        katak: './assets/katak.png',        
        
        // Hand Animation Assets
        handIdle: './assets/hand-idle.png',     // Tangan terbuka (default)
        handGrab: './assets/hand-grab.png',     // Tangan mengepal/menggenggam
        
        // Backgrounds
        gameBackground: './assets/game-bg.jpg',     
        pondBackground: './assets/pond-bg.jpg',     
        menuBackground: './assets/menu-bg.jpg',     
        
        // UI Elements
        gameTitle: './assets/game-title.png',       
        
        // Button Assets (opsional)
        buttonNormal: './assets/button-normal.png',
        buttonHover: './assets/button-hover.png'
    }
};

// Game Variables
let gameState = 'menu'; // menu, playing, gameOver
let score = 0;
let timeLeft = 60;
let gameTimer;
let spawnTimer;
let gameObjects = [];
let hand = document.getElementById('hand');
let pond = document.getElementById('pond');
let gameContainer = document.getElementById('gameContainer');
let menuScreen = document.getElementById('menuScreen');


// Hand animation system
let handState = 'idle'; // idle, grabbing
let handAssets = {
    idle: null,
    grab: null
};

// Background Music
let bgMusic = new Audio('./assets/soundgame.mp3'); // Pastikan file ada di /assets/
bgMusic.loop = true;
bgMusic.volume = 0.4;

// Mouse tracking
let mouseX = 0, mouseY = 0;
let isMouseInPond = false;

// Initialize audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Create audio feedback
function playSound(frequency, duration = 0.1) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.9, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Helper function to load and check images
function loadImage(src, callback) {
    const img = new Image();
    img.onload = () => callback(true);
    img.onerror = () => {
        console.log(`Failed to load image: ${src}`);
        callback(false);
    };
    img.src = src;
}

// Function to load and apply custom assets
function applyAssets() {
    // Apply menu background
    if (ASSET_CONFIG.useImages && ASSET_CONFIG.assets.menuBackground) {
        loadImage(ASSET_CONFIG.assets.menuBackground, (success) => {
            if (success) {
                const menuScreen = document.getElementById('menuScreen');
                menuScreen.style.backgroundImage = `url('${ASSET_CONFIG.assets.menuBackground}')`;
                console.log('Menu background loaded');
            }
        });
    }

    // Apply game title image
    if (ASSET_CONFIG.useImages && ASSET_CONFIG.assets.gameTitle) {
        loadImage(ASSET_CONFIG.assets.gameTitle, (success) => {
            if (success) {
                const gameTitle = document.querySelector('.game-title');
                gameTitle.style.backgroundImage = `url('${ASSET_CONFIG.assets.gameTitle}')`;
                gameTitle.classList.add('use-image');
                console.log('Game title image loaded');
            }
        });
    }

    // Apply game screen background
    if (ASSET_CONFIG.useImages && ASSET_CONFIG.assets.gameBackground) {
        loadImage(ASSET_CONFIG.assets.gameBackground, (success) => {
            if (success) {
                const gameContainer = document.getElementById('gameContainer');
                gameContainer.style.backgroundImage = `url('${ASSET_CONFIG.assets.gameBackground}')`;
                console.log('Game background loaded');
            }
        });
    }

    // Apply pond background
    if (ASSET_CONFIG.useImages && ASSET_CONFIG.assets.pondBackground) {
        loadImage(ASSET_CONFIG.assets.pondBackground, (success) => {
            if (success) {
                const pond = document.getElementById('pond');
                pond.style.backgroundImage = `url('${ASSET_CONFIG.assets.pondBackground}')`;
                console.log('Pond background loaded');
            }
        });
    }

    // Apply button assets (opsional)
    if (ASSET_CONFIG.useImages && ASSET_CONFIG.assets.buttonNormal) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            loadImage(ASSET_CONFIG.assets.buttonNormal, (success) => {
                if (success) {
                    btn.style.backgroundImage = `url('${ASSET_CONFIG.assets.buttonNormal}')`;
                    btn.classList.add('use-image');
                    
                    // Apply hover effect jika ada
                    if (ASSET_CONFIG.assets.buttonHover) {
                        btn.addEventListener('mouseenter', () => {
                            btn.style.backgroundImage = `url('${ASSET_CONFIG.assets.buttonHover}')`;
                        });
                        btn.addEventListener('mouseleave', () => {
                            btn.style.backgroundImage = `url('${ASSET_CONFIG.assets.buttonNormal}')`;
                        });
                    }
                }
            });
        });
    }

    // Apply fallback untuk game objects jika tidak pakai gambar
    if (!ASSET_CONFIG.useImages) {
        document.querySelectorAll('.belut').forEach(el => el.classList.add('use-css'));
        document.querySelectorAll('.padi').forEach(el => el.classList.add('use-css'));
        document.querySelectorAll('.katak').forEach(el => el.classList.add('use-css'));
        document.querySelectorAll('.hand').forEach(el => el.classList.add('use-css'));
    }
}

// Load hand assets untuk animasi
function loadHandAssets() {
    if (!ASSET_CONFIG.useImages) {
        hand.classList.add('use-css');
        return;
    }

    // Load idle hand image
    if (ASSET_CONFIG.assets.handIdle) {
        loadImage(ASSET_CONFIG.assets.handIdle, (success) => {
            if (success) {
                handAssets.idle = ASSET_CONFIG.assets.handIdle;
                setHandState('idle');
                console.log('Hand idle image loaded');
            } else {
                hand.classList.add('use-css');
            }
        });
    }

    // Load grabbing hand image  
    if (ASSET_CONFIG.assets.handGrab) {
        loadImage(ASSET_CONFIG.assets.handGrab, (success) => {
            if (success) {
                handAssets.grab = ASSET_CONFIG.assets.handGrab;
                console.log('Hand grab image loaded');
            } else {
                hand.classList.add('use-css');
            }
        });
    }

    // Fallback to CSS if no images
    if (!ASSET_CONFIG.assets.handIdle && !ASSET_CONFIG.assets.handGrab) {
        hand.classList.add('use-css');
    }
}

// Set hand animation state
function setHandState(state) {
    handState = state;
    
    if (ASSET_CONFIG.useImages && handAssets[state]) {
        hand.style.backgroundImage = `url('${handAssets[state]}')`;
        hand.classList.remove('grabbing');
        if (state === 'grab') {
            hand.classList.add('grabbing');
        }
    } else {
        // CSS animation fallback
        if (state === 'grab') {
            hand.classList.add('grabbing');
        } else {
            hand.classList.remove('grabbing');
        }
    }
}

// Game Object Classes
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.element = this.createElement();
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = (Math.random() - 0.5) * 4;
        this.life = 0;
        this.applyAsset();
        pond.appendChild(this.element);
    }

    createElement() {
        const element = document.createElement('div');
        element.className = this.type;
        element.style.left = this.x + 'px';
        element.style.top = this.y + 'px';
        return element;
    }

    applyAsset() {
        if (!ASSET_CONFIG.useImages) {
            this.element.classList.add('use-css');
            return;
        }

        const assetPath = ASSET_CONFIG.assets[this.type];
        if (assetPath) {
            loadImage(assetPath, (success) => {
                if (success) {
                    this.element.style.backgroundImage = `url('${assetPath}')`;
                    console.log(`Loaded ${this.type} image`);
                } else {
                    this.element.classList.add('use-css');
                    console.log(`Using CSS fallback for ${this.type}`);
                }
            });
        } else {
            this.element.classList.add('use-css');
        }
    }

    update() {
        this.life++;
        
        if (this.type === 'belut') {
            // Belut movement - zigzag and slippery
            this.dx += (Math.random() - 0.5) * 0.5;
            this.dy += (Math.random() - 0.5) * 0.5;
            
            // Limit speed
            this.dx = Math.max(-3, Math.min(3, this.dx));
            this.dy = Math.max(-3, Math.min(3, this.dy));
        }

        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x <= 0 || this.x >= 640) this.dx *= -0.8;
        if (this.y <= 0 || this.y >= 440) this.dy *= -0.8;

        this.x = Math.max(0, Math.min(640, this.x));
        this.y = Math.max(0, Math.min(440, this.y));

        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';

        // Remove after some time
        if (this.life > 600) { // 10 seconds at 60fps
            this.destroy();
            return false;
        }
        return true;
    }

    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    isColliding(x, y, radius = 30) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < radius;
    }
}

// Mouse tracking
document.addEventListener('mousemove', (e) => {
    if (gameState !== 'playing') return;
    
    const rect = pond.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    isMouseInPond = mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height;
    
    if (isMouseInPond) {
        const handWidth = 200;  // ukuran asli gambar
        const handHeight = 200;

        // posisi tangan biar tengahnya tepat di kursor
        hand.style.left = (mouseX - handWidth / 2) + 'px';
        hand.style.top = (mouseY - handHeight / 2) + 'px';
        hand.style.display = 'block';
    } else {
        hand.style.display = 'none';
    }
});

// Catch action dengan keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing' && isMouseInPond) {
        e.preventDefault();
        catchAction();
    }
});

// Create catch effect (visual feedback)
function createCatchEffect(x, y) {
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = (x - 15) + 'px';
    effect.style.top = (y - 15) + 'px';
    effect.style.width = '50px';
    effect.style.height = '50px';
    effect.style.border = '3px solid #ffff00';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.animation = 'catch-effect 0.3s ease-out forwards';
    effect.style.zIndex = '999';
    
    pond.appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 300);
}

// Enhanced catch action dengan animasi tangan
function catchAction() {
    // Trigger grab animation
    setHandState('grab');
    
    // Visual feedback
    createCatchEffect(mouseX, mouseY);

let caught = false;
for (let i = gameObjects.length - 1; i >= 0; i--) {
    const obj = gameObjects[i];
    if (obj.isColliding(mouseX, mouseY, 50)) { // <- radius diperbesar biar lebih mudah kena
        if (obj.type === 'belut') {
            score += 10;
            playSound(440, 0.8);
            createParticles(mouseX, mouseY, '#ffd700');
        } else if (obj.type === 'padi') {
            score += 5;
            playSound(660, 0.15);
            createParticles(mouseX, mouseY, '#90ee90');
        } else if (obj.type === 'katak') {
            score = Math.max(0, score - 5);
            playSound(220, 0.8);
            createParticles(mouseX, mouseY, '#ff6b6b');
        }
        
        obj.destroy();
        gameObjects.splice(i, 1);
        caught = true;
        break;
    }
}

    if (!caught) {
        playSound(150, 0.9); // Miss sound
    }

    // Return to idle state after animation
    setTimeout(() => {
        setHandState('idle');
    }, 200);

    updateScore();
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = color;
        particle.style.transform = `translate(${(Math.random() - 0.5) * 40}px, ${(Math.random() - 0.5) * 40}px)`;
        pond.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

function spawnGameObject() {
    const rand = Math.random();
    let type;
    
    if (rand < 0.6) type = 'belut';
    else if (rand < 0.8) type = 'padi';
    else type = 'katak';

    const x = Math.random() * 500;
    const y = Math.random() * 300;
    
    gameObjects.push(new GameObject(x, y, type));
}

function updateGame() {
    // Update all game objects
    gameObjects = gameObjects.filter(obj => obj.update());

    // Spawn new objects occasionally
    if (Math.random() < 0.02) {
        spawnGameObject();
    }

    if (gameState === 'playing') {
        requestAnimationFrame(updateGame);
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

function startGame() {
    initAudio();
    applyAssets();
    loadHandAssets();
    gameState = 'playing';
    // Mulai background music
    if (bgMusic.paused) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>{});
    }

    score = 0;
    timeLeft = 60;
    gameObjects = [];

    // Clear pond
    const existingObjects = pond.querySelectorAll('.belut, .padi, .katak');
    existingObjects.forEach(obj => obj.remove());

    // Show game screen
    menuScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    // Start timers
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimer();
    }, 1000);

    // Initial spawn
    for (let i = 0; i < 3; i++) {
        spawnGameObject();
    }

    updateScore();
    updateTimer();
    updateGame();

    
}


function endGame() {
    gameState = 'gameOver';
    clearInterval(gameTimer);

    document.getElementById('finalScore').textContent = score;
    
    // Check for new record
    const leaderboard = getLeaderboard();
    const isNewRecord = leaderboard.length === 0 || score > leaderboard[0].score;
    
    if (isNewRecord) {
        document.getElementById('newRecordMsg').classList.remove('hidden');
    }

    document.getElementById('gameOverModal').classList.remove('hidden');
}

function saveScore() {
    const playerName = document.getElementById('playerName').value.trim() || 'Anonymous';
    const leaderboard = getLeaderboard();
    
    leaderboard.push({ name: playerName, score: score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10); // Keep only top 10

    // Store in memory (no localStorage used)
    sessionLeaderboard = leaderboard;

    document.getElementById('gameOverModal').classList.add('hidden');
    showLeaderboard();
}

// Session-based leaderboard (fallback jika localStorage tidak tersedia)
let sessionLeaderboard = [];

function getLeaderboard() {
    try {
        // Try localStorage first
        if (typeof(Storage) !== "undefined") {
            const stored = localStorage.getItem('belutLeaderboard');
            return stored ? JSON.parse(stored) : sessionLeaderboard;
        }
    } catch (e) {
        console.log('localStorage not available, using session storage');
    }
    return sessionLeaderboard;
}

function restartGame() {
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('playerName').value = '';
    document.getElementById('newRecordMsg').classList.add('hidden');
    startGame();
}

function backToMenu() {
    document.getElementById('gameOverModal').classList.add('hidden');
    gameContainer.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    gameState = 'menu';

    // Reset dan play musik di menu
    bgMusic.currentTime = 0;
    if (bgMusic.paused) bgMusic.play();
    
    // Clear game objects
    gameObjects.forEach(obj => obj.destroy());
    gameObjects = [];
    
    document.getElementById('playerName').value = '';
    document.getElementById('newRecordMsg').classList.add('hidden');
}

function showTutorial() {
    document.getElementById('tutorialModal').classList.remove('hidden');
}

function closeTutorial() {
    document.getElementById('tutorialModal').classList.add('hidden');
}

function showLeaderboard() {
    const leaderboard = getLeaderboard();
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    if (leaderboard.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Belum ada skor tersimpan</td></tr>';
    } else {
        leaderboard.forEach((entry, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
            `;
        });
    }

    document.getElementById('leaderboardModal').classList.remove('hidden');
}

// Cek gameState, jika 'gameOver' otomatis kembali ke menu
function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.add('hidden');
    if (gameState === 'gameOver') {
        backToMenu(); // Kembali ke menu utama
    }
}

function showCredits() {
    document.getElementById('creditsModal').classList.remove('hidden');
}

function closeCredits() {
    document.getElementById('creditsModal').classList.add('hidden');
}

function toggleAssetMode() {
    ASSET_CONFIG.useImages = !ASSET_CONFIG.useImages;
    document.getElementById('assetMode').textContent = ASSET_CONFIG.useImages ? 'Image' : 'CSS';
    
    // Reload assets
    applyAssets();
    loadHandAssets();
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Tangkap Belut Nusantara - Game dimuat!');
    console.log('📁 Asset Configuration:', ASSET_CONFIG);
    
    // Agar musik tetap play meski autoplay diblok browser
document.addEventListener('click', () => {
    if (bgMusic.paused) bgMusic.play().catch(()=>{});
}, { once: true });

    // Load assets saat game dimuat
    applyAssets();
});