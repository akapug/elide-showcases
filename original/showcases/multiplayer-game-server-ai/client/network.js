// WebSocket network manager
class NetworkManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.tankId = null;
        this.onGameStateUpdate = null;
        this.onInit = null;
        this.pingInterval = null;
        this.lastPingTime = 0;
        this.ping = 0;
    }

    connect(port = 3001) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://localhost:${port}`);

            this.ws.onopen = () => {
                console.log('✅ Connected to game server');
                this.connected = true;
                this.startPing();
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = () => {
                console.log('❌ Disconnected from server');
                this.connected = false;
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'init':
                this.playerId = message.playerId;
                this.tankId = message.tankId;
                if (this.onInit) {
                    this.onInit(message);
                }
                break;

            case 'gameState':
                if (this.onGameStateUpdate) {
                    this.onGameStateUpdate(message.state);
                }
                break;

            case 'pong':
                this.ping = Date.now() - this.lastPingTime;
                break;
        }
    }

    sendInput(move, turretAngle) {
        if (!this.connected) return;

        this.ws.send(JSON.stringify({
            type: 'input',
            move,
            turretAngle
        }));
    }

    sendFire() {
        if (!this.connected) return;

        this.ws.send(JSON.stringify({
            type: 'fire'
        }));
    }

    sendRespawn() {
        if (!this.connected) return;

        this.ws.send(JSON.stringify({
            type: 'respawn'
        }));
    }

    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.lastPingTime = Date.now();
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 1000);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
