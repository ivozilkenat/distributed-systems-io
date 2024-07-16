import * as PIXI from 'pixi.js';
import { Player } from './player.ts';
import { Entity } from './entity.ts';
import { Socket } from 'socket.io-client';

export async function createApp(): Promise<PIXI.Application> {
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });
    window.addEventListener('resize', () => resizeCanvas(app), false);

    document.getElementById('game')?.appendChild(app.canvas);
    return app;
}

function resizeCanvas(app: PIXI.Application) {
    app.canvas.width = window.innerWidth;
    app.canvas.height = window.innerHeight;
  }

function createGraphicsContext(): PIXI.Graphics {
    let graphics = new PIXI.Graphics();
    return graphics.poly([
        12, 10, 
        12 + (100), 10,
        8 + (100), 20, 
        8, 20
    ]).fill('white')
}


export class Game {
    map: PIXI.Sprite;
    player: Player;
    enemies: Record<string, Player>;
    projectiles: Record<string, Entity>;
    socket: Socket;
    app: PIXI.Application;
    keys: Record<string, boolean>;
    graphicsContext: PIXI.Graphics;
    

    constructor(app: PIXI.Application, socket: Socket, keys: Record<string, boolean>
    ) {
        let graphicsContext = createGraphicsContext();
        this.enemies = {};
        this.projectiles = {};
        this.socket = socket;
        this.app = app;
        this.keys = keys;
        this.graphicsContext = graphicsContext;
        this.map = this.initMap()
        this.player = new Player(0, 0, app, graphicsContext);
    }

    get gameSize(): number[] {
        return [this.app.canvas.width, this.app.canvas.height];
    }

    initMap(): PIXI.Sprite {
        const map: PIXI.Sprite = PIXI.Sprite.from('/dist/map.png');
        this.app.stage.addChild(map);
        map.interactive = true;
        map.on('click', (evt: any) => {
            if(this.player.canShoot) {
                let angle = Math.atan2(evt.data.global.y - this.gameSize[1] / 2, evt.data.global.x - this.gameSize[0] / 2);
                this.socket.emit("player_click", angle);
            }
        });
        return map;
    }

    loop(): void {
        this.app.ticker.add(() => {
            if (this.keys['right']) this.socket.emit('player_move', [1, 0]);
            if (this.keys['left']) this.socket.emit('player_move', [-1, 0]);
            if (this.keys['up']) this.socket.emit('player_move', [0, -1]);
            if (this.keys['down']) this.socket.emit('player_move', [0, 1]);
            this.draw();
        });
    }

    draw(): void {
        this.drawBackground();
        Object.values(this.enemies).forEach((enemy: Player) => {
            enemy.readdToCanvas();
            enemy.updateDraw(enemy.relativeToPlayerTranslation(this.player));
        });
        Object.values(this.projectiles).forEach((projectile: Entity) => {
            projectile.readdToCanvas();
            projectile.updateDraw(projectile.relativeToPlayerTranslation(this.player));
        });
        const t =  (x: number, y: number) => this.player.relativeToPlayerTranslation(this.player)(x, y);
        this.player.updateDraw(t);
    }

    drawBackground(): void {
        const x: number = this.gameSize[0] / 2 - this.player.x;
        const y: number = this.gameSize[1] / 2 - this.player.y;
        [this.map.x, this.map.y] = [x, y];
    }

    clearEnemies(): void {
        Object.values(this.enemies).forEach((enemy: Player) => {
            enemy.removeFromCanvas();
        });
    }

    clearProjectiles(): void {
        Object.values(this.projectiles).forEach((projectile: Entity) => {
            projectile.removeFromCanvas();
        });
    }

    joinGame(): void {
        this.enemies = {};
        this.socket.connect();
        this.app.stage.addChild(this.map, this.player.container);
    }

     leaveGame(): void {
        this.socket.disconnect();
        this.clearEnemies();
        this.app.stage.removeChild(this.map, this.player.container);
        this.enemies = {};
    }

    updateGameFromServer(data: {
        gameState: any,
        canShoot: boolean,
        playerId: string,
    }): void {
        let playerId = data.playerId;
        let playerData = data.gameState["players"]
        let projectileData = data.gameState["projectiles"]
        this.player.updatePosition(playerData[playerId]["pos"][0], playerData[playerId]["pos"][1]);
        this.player.hp = playerData[playerId]["hp"];
        this.player.updateHealthBar();
        this.player.canShoot = data.canShoot;

        const newPlayers: Record<string, Player> = {};

        this.clearEnemies();
        this.clearProjectiles();

        Object.keys(playerData).forEach(id => {

            if (id === playerId) return;
            if (this.enemies[id]) {
                this.enemies[id].updatePosition(playerData[id]["pos"][0], playerData[id]["pos"][1]);
                if (this.enemies[id].hp !== playerData[id]["hp"]) {
                    this.enemies[id].hp = playerData[id]["hp"];
                    this.enemies[id].updateHealthBar();
                }
            } else {
                this.enemies[id] = new Player(playerData[id]["pos"][0], playerData[id]["pos"][1], this.app, this.graphicsContext);
                this.enemies[id].hp = playerData[id]["hp"];
                this.enemies[id].updateHealthBar();
            }
            newPlayers[id] = this.enemies[id];
        });

        Object.keys(projectileData).forEach(id => {
            if (this.projectiles[id]) {
                this.projectiles[id].updatePosition(projectileData[id]["pos"][0], projectileData[id]["pos"][1]);
            } else {
                this.projectiles[id] = new Entity(projectileData[id]["pos"][0], projectileData[id]["pos"][1], this.app, '/dist/bullet.png');
            }
        });

        this.enemies = newPlayers;
    }
}
