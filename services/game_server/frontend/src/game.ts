import * as PIXI from 'pixi.js';
import { Player } from './player.ts';
import { Socket } from 'socket.io-client';

export async function createApp(): Promise<PIXI.Application> {
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });
    document.getElementById('game')?.appendChild(app.canvas);
    return app;
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
    socket: Socket;
    app: PIXI.Application;
    keys: Record<string, boolean>;
    gameSize: number[];
    graphicsContext: PIXI.Graphics;
    

    constructor(app: PIXI.Application, socket: Socket, keys: Record<string, boolean>, gameSize: number[]
    ) {
        let graphicsContext = createGraphicsContext();
        this.enemies = {};
        this.socket = socket;
        this.app = app;
        this.keys = keys;
        this.gameSize = gameSize;
        this.graphicsContext = graphicsContext;
        this.player = new Player(0, 0, app, graphicsContext, gameSize);
        this.map = this.initMap()
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
        newpos: [number, number],
        newHP: number,
        enemies: Record<string, [number, number]>,
        enemyHealth: Record<string, number>,
        canShoot: boolean
    }): void {
        this.player.updatePosition(data.newpos[0], data.newpos[1]);
        this.player.hp = data.newHP;
        this.player.updateHealthBar();
        this.player.canShoot = data.canShoot;

        const newPlayers: Record<string, Player> = {};

        this.clearEnemies();

        Object.keys(data.enemies).forEach(id => {
            if (this.enemies[id]) {
                this.enemies[id].updatePosition(data.enemies[id][0], data.enemies[id][1]);
                if (this.enemies[id].hp !== data.enemyHealth[id]) {
                    this.enemies[id].hp = data.enemyHealth[id];
                    this.enemies[id].updateHealthBar();
                }
            } else {
                this.enemies[id] = new Player(data.enemies[id][0], data.enemies[id][1], this.app, this.graphicsContext, this.gameSize);
                this.enemies[id].hp = data.enemyHealth[id];
                this.enemies[id].updateHealthBar();
            }
            newPlayers[id] = this.enemies[id];
        });

        this.enemies = newPlayers;
    }
}
