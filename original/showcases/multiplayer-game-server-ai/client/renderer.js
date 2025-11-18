// Game renderer
class GameRenderer {
    constructor(canvas, minimapCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimapCanvas = minimapCanvas;
        this.minimapCtx = minimapCanvas.getContext('2d');

        this.camera = { x: 0, y: 0 };
        this.zoom = 1.0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render(gameState, playerTankId) {
        if (!gameState) return;

        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera to follow player
        const playerTank = gameState.tanks.find(t => t.id === playerTankId);
        if (playerTank) {
            this.camera.x = playerTank.position.x - this.canvas.width / 2;
            this.camera.y = playerTank.position.y - this.canvas.height / 2;
        }

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw grid
        this.drawGrid();

        // Draw power-ups
        if (gameState.powerUps) {
            gameState.powerUps.forEach(p => this.drawPowerUp(p));
        }

        // Draw projectiles
        if (gameState.projectiles) {
            gameState.projectiles.forEach(p => this.drawProjectile(p));
        }

        // Draw tanks
        if (gameState.tanks) {
            gameState.tanks.forEach(t => this.drawTank(t, t.id === playerTankId));
        }

        this.ctx.restore();

        // Draw minimap
        this.drawMinimap(gameState, playerTankId);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 100;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = this.camera.x + this.canvas.width;
        const endY = this.camera.y + this.canvas.height;

        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawTank(tank, isPlayer) {
        if (!tank.alive) return;

        const { x, y } = tank.position;

        this.ctx.save();
        this.ctx.translate(x, y);

        // Tank body
        this.ctx.rotate(tank.rotation);
        this.ctx.fillStyle = isPlayer ? '#00d4ff' : (tank.isAI ? '#ff6b6b' : '#00ff00');
        this.ctx.fillRect(-20, -15, 40, 30);

        // Tracks
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-20, -18, 40, 5);
        this.ctx.fillRect(-20, 13, 40, 5);

        this.ctx.restore();

        // Turret
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(tank.turretRotation);

        this.ctx.fillStyle = isPlayer ? '#0099cc' : (tank.isAI ? '#cc4444' : '#00cc00');
        this.ctx.fillRect(-5, -5, 30, 10);

        this.ctx.restore();

        // Health bar
        if (!isPlayer) {
            const healthPercent = tank.health / tank.maxHealth;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x - 20, y - 30, 40, 5);

            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            this.ctx.fillRect(x - 20, y - 30, 40 * healthPercent, 5);
        }

        // Shield indicator
        if (tank.shields > 0) {
            this.ctx.strokeStyle = '#00d4ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 25, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Name tag
        if (tank.isAI) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('AI', x, y - 35);
        }
    }

    drawProjectile(projectile) {
        if (!projectile.alive) return;

        const { x, y } = projectile.position;

        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Trail
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - Math.cos(projectile.rotation) * 20,
            y - Math.sin(projectile.rotation) * 20
        );
        this.ctx.stroke();
    }

    drawPowerUp(powerUp) {
        if (!powerUp.alive) return;

        const { x, y } = powerUp.position;
        const colors = {
            shield: '#00d4ff',
            speed: '#ffff00',
            rapidfire: '#ff6b6b',
            health: '#00ff00'
        };

        const icons = {
            shield: '🛡️',
            speed: '⚡',
            rapidfire: '🔥',
            health: '❤️'
        };

        // Glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = colors[powerUp.type] || '#ffffff';

        // Circle
        this.ctx.fillStyle = colors[powerUp.type] || '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;

        // Icon
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icons[powerUp.type] || '?', x, y);
    }

    drawMinimap(gameState, playerTankId) {
        const ctx = this.minimapCtx;
        const size = 200;
        const mapSize = 2000; // Assuming map is 2000x2000

        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, size, size);

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(0, 0, size, size);

        // Draw tanks
        if (gameState.tanks) {
            gameState.tanks.forEach(tank => {
                if (!tank.alive) return;

                const mx = (tank.position.x / mapSize) * size;
                const my = (tank.position.y / mapSize) * size;

                ctx.fillStyle = tank.id === playerTankId ? '#00d4ff' : (tank.isAI ? '#ff6b6b' : '#00ff00');
                ctx.beginPath();
                ctx.arc(mx, my, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
}
