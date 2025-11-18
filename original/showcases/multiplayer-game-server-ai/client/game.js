// Main game client
class GameClient {
    constructor() {
        this.network = new NetworkManager();
        this.renderer = null;
        this.gameState = null;
        this.playerTankId = null;
        this.mode = 'menu'; // menu, game

        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            mouseX: 0,
            mouseY: 0
        };

        this.fps = 60;
        this.fpsCounter = 0;
        this.fpsLastTime = Date.now();

        this.init();
    }

    init() {
        // Get DOM elements
        this.menuScreen = document.getElementById('menu');
        this.gameScreen = document.getElementById('game');
        this.canvas = document.getElementById('game-canvas');
        this.minimapCanvas = document.getElementById('minimap');

        // Initialize renderer
        this.renderer = new GameRenderer(this.canvas, this.minimapCanvas);

        // Setup network callbacks
        this.network.onInit = (data) => this.handleInit(data);
        this.network.onGameStateUpdate = (state) => this.handleGameStateUpdate(state);

        // Setup event listeners
        this.setupEventListeners();

        // Try to connect
        this.connectToServer();
    }

    async connectToServer() {
        try {
            await this.network.connect();
            document.getElementById('server-status').textContent = 'Connected ✓';
            document.getElementById('server-status').style.color = '#00ff00';
        } catch (error) {
            document.getElementById('server-status').textContent = 'Offline ✗';
            document.getElementById('server-status').style.color = '#ff0000';
        }
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('btn-play').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('btn-spectate').addEventListener('click', () => {
            this.startSpectate();
        });

        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    startGame() {
        this.menuScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.mode = 'game';
        this.startGameLoop();
    }

    startSpectate() {
        this.menuScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.mode = 'spectate';
        this.startGameLoop();
    }

    handleInit(data) {
        console.log('Initialized:', data);
        this.playerTankId = data.tankId;
        this.gameState = data.gameState;
    }

    handleGameStateUpdate(state) {
        this.gameState = state;

        // Update HUD
        this.updateHUD();

        // Update stats
        const botCount = state.tanks.filter(t => t.isAI).length;
        const playerCount = state.tanks.filter(t => !t.isAI).length;
        document.getElementById('bot-count').textContent = botCount;
        document.getElementById('player-count').textContent = playerCount;
    }

    updateHUD() {
        if (!this.gameState || !this.playerTankId) return;

        const tank = this.gameState.tanks.find(t => t.id === this.playerTankId);
        if (!tank) return;

        // Health
        const healthPercent = (tank.health / tank.maxHealth) * 100;
        document.getElementById('health-fill').style.width = healthPercent + '%';
        document.getElementById('health-text').textContent = `${Math.round(tank.health)}/${tank.maxHealth}`;

        // Shield
        document.getElementById('shield-text').textContent = Math.round(tank.shields);

        // Score
        document.getElementById('score-text').textContent = tank.score;

        // K/D
        document.getElementById('kd-text').textContent = `${tank.kills}/${tank.deaths}`;

        // Ping
        document.getElementById('ping-display').textContent = this.network.ping + 'ms';
    }

    handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'w': this.input.up = true; break;
            case 's': this.input.down = true; break;
            case 'a': this.input.left = true; break;
            case 'd': this.input.right = true; break;
            case ' ': this.network.sendFire(); break;
            case 'escape':
                this.gameScreen.classList.remove('active');
                this.menuScreen.classList.add('active');
                this.mode = 'menu';
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w': this.input.up = false; break;
            case 's': this.input.down = false; break;
            case 'a': this.input.left = false; break;
            case 'd': this.input.right = false; break;
        }
    }

    handleMouseMove(e) {
        this.input.mouseX = e.clientX;
        this.input.mouseY = e.clientY;
    }

    handleMouseDown(e) {
        if (e.button === 0) {
            this.input.fire = true;
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            this.input.fire = false;
        }
    }

    processInput() {
        if (this.mode !== 'game') return;
        if (!this.gameState || !this.playerTankId) return;

        const tank = this.gameState.tanks.find(t => t.id === this.playerTankId);
        if (!tank || !tank.alive) return;

        // Calculate movement
        let dx = 0, dy = 0;
        if (this.input.up) dy -= 1;
        if (this.input.down) dy += 1;
        if (this.input.left) dx -= 1;
        if (this.input.right) dx += 1;

        // Normalize
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        // Calculate turret angle (aim at mouse)
        const tankScreenX = tank.position.x - this.renderer.camera.x;
        const tankScreenY = tank.position.y - this.renderer.camera.y;
        const dx_mouse = this.input.mouseX - tankScreenX;
        const dy_mouse = this.input.mouseY - tankScreenY;
        const turretAngle = Math.atan2(dy_mouse, dx_mouse);

        // Send input to server
        if (dx !== 0 || dy !== 0) {
            this.network.sendInput({ dx, dy }, turretAngle);
        } else {
            this.network.sendInput(null, turretAngle);
        }

        // Fire
        if (this.input.fire) {
            this.network.sendFire();
        }
    }

    startGameLoop() {
        const loop = () => {
            if (this.mode === 'menu') return;

            // Process input
            this.processInput();

            // Render
            this.renderer.render(this.gameState, this.playerTankId);

            // Calculate FPS
            this.fpsCounter++;
            if (Date.now() - this.fpsLastTime >= 1000) {
                this.fps = this.fpsCounter;
                document.getElementById('fps-display').textContent = this.fps;
                this.fpsCounter = 0;
                this.fpsLastTime = Date.now();
            }

            requestAnimationFrame(loop);
        };
        loop();
    }
}

// Start game
const game = new GameClient();
