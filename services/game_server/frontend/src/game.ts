import * as PIXI from 'pixi.js';
import { Player } from './player.ts';
import { Socket } from 'socket.io-client';
import { CheckBox, List } from '@pixi/ui';

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




export class Game {
    map: PIXI.Sprite;
    player: Player;
    enemies: Record<string, Player>;
    socket: Socket;
    app: PIXI.Application;
    keys: Record<string, boolean>;
    leaderboard: [string, number][];
    leaderboardGraphic: List | undefined;
    playerToLeaderboardText: PIXI.Text[];


    constructor(app: PIXI.Application, socket: Socket, keys: Record<string, boolean>
    ) {
        this.enemies = {};
        this.socket = socket;
        this.app = app;
        this.keys = keys;
        this.map = this.initMap()
        this.player = new Player(0, 0, app);
        this.leaderboard = [];
        this.playerToLeaderboardText = [];
        this.setupLeaderboard();
    }

    get gameSize(): number[] {
        return [this.app.canvas.width, this.app.canvas.height];
    }

    initMap(): PIXI.Sprite {
        const map: PIXI.Sprite = PIXI.Sprite.from('/dist/map.png');
        this.app.stage.addChild(map);
        map.interactive = true;
        map.on('click', (evt: any) => {
            if (this.player.canShoot) {
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
            this.leaderboardGraphic!.visible = this.keys['tab'];
            this.draw();
        });
    }

    draw(): void {
        this.drawBackground();
        Object.values(this.enemies).forEach((enemy: Player) => {
            enemy.readdToCanvas();
            enemy.updateDraw(enemy.relativeToPlayerTranslation(this.player));
        });
        const t = (x: number, y: number) => this.player.relativeToPlayerTranslation(this.player)(x, y);
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
        let hpBar: PIXI.Container = new PIXI.Container();
        hpBar.addChild(new PIXI.Graphics());
        hpBar.addChild(new PIXI.Graphics());
        hpBar.pivot.set(1, 1);
        this.app.stage.addChild(hpBar);
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
                this.enemies[id] = new Player(data.enemies[id][0], data.enemies[id][1], this.app);
                this.enemies[id].hp = data.enemyHealth[id];
                this.enemies[id].updateHealthBar();
            }
            newPlayers[id] = this.enemies[id];
        });

        this.enemies = newPlayers;
    }

    updateLeaderboard(leaderboard: [string, number][]): void {
        this.leaderboard = leaderboard;
        this.leaderboard.forEach((entry, index) => {
            if (this.leaderboardGraphic?.children.length == 10) {
                return;
            }
            this.playerToLeaderboardText[index].text = `${entry[0]}: ${entry[1]}`;
        })
    }


    setupLeaderboard(): void {
        const view = new List({ type: 'vertical', elementsMargin: 10 });


        for (var i of [...Array(9).keys()]) {
            this.playerToLeaderboardText[i] = new PIXI.Text(``);
            view.addChild(this.playerToLeaderboardText[i]);
        }


        let graphics = new PIXI.Graphics();
        const e = graphics.rect(0, 0, 500, 500).fill(0xFF00FF);
        view.visible = true;
        view.x = 50;
        view.y = 50;
        this.leaderboardGraphic = view;
        this.app.stage.addChild(view);
    }

}
