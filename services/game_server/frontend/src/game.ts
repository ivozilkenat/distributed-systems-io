import * as PIXI from 'pixi.js';
import { Player } from './player.ts';
import { Entity } from './entity.ts';
import { popupMessageQueue } from './vfx.ts';
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
    projectiles: Record<string, Entity>;
    socket: Socket;
    app: PIXI.Application;
    keys: Record<string, boolean>;
    leaderboard: [string, number][];
    leaderboardGraphic: List | undefined;
    playerToLeaderboardText: PIXI.Text[];
    vfxHandler: popupMessageQueue;


    constructor(app: PIXI.Application, socket: Socket, keys: Record<string, boolean>
    ) {
        this.enemies = {};
        this.projectiles = {};
        this.socket = socket;
        this.app = app;
        this.keys = keys;
        this.map = this.initMap()
        this.player = new Player(0, 0, app);
        this.leaderboard = [];
        this.playerToLeaderboardText = [];
        this.setupLeaderboard();
        this.vfxHandler = new popupMessageQueue(app);
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
        Object.values(this.projectiles).forEach((projectile: Entity) => {
            projectile.readdToCanvas();
            projectile.updateDraw(projectile.relativeToPlayerTranslation(this.player));
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

    clearProjectiles(): void {
        Object.values(this.projectiles).forEach((projectile: Entity) => {
            projectile.removeFromCanvas();
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

    displayEvents(events: any, playerId: string): void {
        for (let event of events) {
            let event_type = event["event_type"];
            let event_data = event["event_data"];;
            if (event_type === "kills") {
                if (event_data["killer"] === playerId && event_data["victim"] === playerId) {
                    this.vfxHandler.addMessage("You killed yourself! Idiot", "red", 2000, 0);
                } else if (event_data["killer"] === playerId) {
                    this.vfxHandler.addMessage("You sent " + this.enemies[event_data["victim"]].name + " to the shadow realm!", "purple", 2000, 0);
                } else if (event_data["victim"] === playerId) {
                    this.vfxHandler.addMessage(this.enemies[event_data["killer"]].name + " sent you to the shadow realm!", "red", 2000, 0);
                } else if (event_data["victim"] === event_data["killer"]) {
                    this.vfxHandler.addMessage(this.enemies[event_data["killer"]].name + " offed themselves", "white", 2000, 2);
                } else {
                    this.vfxHandler.addMessage(this.enemies[event_data["killer"]].name + " sent " + this.enemies[event_data["victim"]].name + " to the shadow realm!", "white", 2000, 2);
                }
            } else if (event_type === "killstreak") {
                if (event_data["player"] === playerId) {
                    this.vfxHandler.addMessage("You are on a " + event_data["kills"] + " killstreak!", "purple", 2000, 0);
                } else {
                    this.vfxHandler.addMessage(this.enemies[event_data["player"]].name + " is on a " + event_data["kills"] + " killstreak!", "white", 2000, 1);
                }
            }
        }
    }

    updateGameFromServer(data: {
        gameState: any,
        canShoot: boolean,
        playerId: string,
        events: any
    }): void {
        let playerId = data.playerId;
        let playerData = data.gameState["players"]
        let projectileData = data.gameState["projectiles"]
        let events = data.events;
        this.player.updatePosition(playerData[playerId]["pos"][0], playerData[playerId]["pos"][1]);
        this.player.hp = playerData[playerId]["hp"];
        this.player.name = playerData[playerId]["name"];
        this.player.updateHealthBar();
        this.player.canShoot = data.canShoot;

        const newPlayers: Record<string, Player> = {};
        const newProjectiles: Record<string, Entity> = {};

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
                this.enemies[id] = new Player(playerData[id]["pos"][0], playerData[id]["pos"][1], this.app);
                this.enemies[id].hp = playerData[id]["hp"];
                this.enemies[id].updateHealthBar();
            }
            this.enemies[id].name = playerData[id]["name"];
            newPlayers[id] = this.enemies[id];
        });

        Object.keys(projectileData).forEach(id => {
            if (this.projectiles[id]) {
                this.projectiles[id].updatePosition(projectileData[id]["pos"][0], projectileData[id]["pos"][1]);
            } else {
                this.projectiles[id] = new Entity(projectileData[id]["pos"][0], projectileData[id]["pos"][1], this.app, '/dist/bullet.png');
            }
            newProjectiles[id] = this.projectiles[id];
        });

        this.enemies = newPlayers;
        this.projectiles = newProjectiles;

        this.displayEvents(events, playerId);
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
