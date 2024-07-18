import * as PIXI from 'pixi.js';
import { Player } from './player.ts';
import { Entity } from './entity.ts';
import { popupMessageQueue } from './vfx.ts';
import { Socket } from 'socket.io-client';
import { List } from '@pixi/ui';

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
    items: Record<string, Entity>;
    currentAim: number[];

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
        this.items = {};
        this.currentAim = [0, 0];
    }

    get gameSize(): number[] {
        return [this.app.canvas.width, this.app.canvas.height];
    }

    initMap(): PIXI.Sprite {
        const map: PIXI.Sprite = PIXI.Sprite.from('/dist/map.png');
        this.app.stage.addChild(map);
        map.interactive = true;
        map.on('click', (evt: any) => {
            this.currentAim = [evt.data.global.x, evt.data.global.y]
            this.try_shoot();
        });
        map.on('mousemove', (evt: any) => {
            this.currentAim = [evt.data.global.x, evt.data.global.y];
        });
        map.on('mousedown', (evt: any) => {
            this.currentAim = [evt.data.global.x, evt.data.global.y];
            this.keys['space'] = true;
        });
        map.on('mouseup', () => {
            this.keys['space'] = false;
        });
        return map;
    }

    try_shoot(): void {
        if (this.player.canShoot) {
            const pos = this.currentAim;
            let angle = Math.atan2(pos[1] - this.gameSize[1] / 2, pos[0] - this.gameSize[0] / 2);
            this.socket.emit("player_click", angle);
        }
    }

    loop(): void {
        this.app.ticker.add(() => {
            if (this.keys['right']) this.socket.emit('player_move', [1, 0]);
            if (this.keys['left']) this.socket.emit('player_move', [-1, 0]);
            if (this.keys['up']) this.socket.emit('player_move', [0, -1]);
            if (this.keys['down']) this.socket.emit('player_move', [0, 1]);
            if (this.keys['space']) {
                // TODO fix this if you can
                // const mousePosition = this.app.renderer.plugins.interaction.mouse.global; // @ts-ignore
                this.try_shoot();
                // console.log("pew pew");
            };
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
        Object.values(this.items).forEach((item: Entity) => {
            item.readdToCanvas();
            item.updateDraw(item.relativeToPlayerTranslation(this.player));
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

    clearItems(): void {
        Object.values(this.items).forEach((projectile: Entity) => {
            projectile.removeFromCanvas();
        });
    }
    joinGame(): void {
        this.enemies = {};
        this.socket.connect();
    }

    leaveGame(): void {
        this.socket.disconnect();
        this.clearEnemies();
        this.clearProjectiles();
        this.clearItems();
        this.app.stage.removeChild(this.map, this.player.container);
        this.enemies = {};
    }

    displayEvents(events: any, playerId: string): void {
        for (let event of events) {
            let event_type = event["event_type"];
            let event_data = event["event_data"];;
            if (event_type === "kills") {
                this.processKillMessage(event_data["killer"], event_data["victim"], playerId);
            } else if (event_type === "killstreak") {
                this.processKillStreakMessage(event_data["player"], event_data["kills"], playerId);
            } else if (event_type === "item") {
                this.processItemMessage(event_data["msg"], playerId);
            } else if (event_type === "disconnect") {
                this.processDisconnectMessage(event_data["player"]);
            }
        }
    }

    processDisconnectMessage(player: string): void {
        if (player) {
            return;
        }
        // this.vfxHandler.addMessage(this.enemies[player].name + " disconnected", "white", 2000, 2);
        // this.enemies[player].removeFromCanvas();
        // delete this.enemies[player];
    }

    processItemMessage(data: any, playerId: string): void {
        if (data["player"] === playerId) {
            this.vfxHandler.addMessage(data["msg"], "green", 2000, 0);
    }}

    processKillStreakMessage(player: string, kills: number, playerId: string): void {
        if (player === playerId) {
            this.vfxHandler.addMessage("You are on a " + kills + " killstreak!", "purple", 2000, 0);
        } else {
            this.vfxHandler.addMessage(this.enemies[player].name + " is on a " + kills + " killstreak!", "white", 2000, 1);
    }}

    processKillMessage(killer: string, victim: string, playerId: string): void {
        if (killer === victim) {
            if (killer === playerId) {
                this.vfxHandler.addMessage("You killed yourself! Idiot", "red", 1500, 0);
            }
            else {
                this.vfxHandler.addMessage(this.enemies[killer].name + " offed themselves", "white", 1500, 2);
            }
        } else if (killer === playerId) {
            this.vfxHandler.addMessage("You sent " + this.enemies[victim].name + " to the shadow realm!", "purple", 1500, 0);
        } else if (victim === playerId) {
            this.vfxHandler.addMessage(this.enemies[killer].name + " sent you to the shadow realm!", "red", 1500, 0);
        } else {
            this.vfxHandler.addMessage(this.enemies[killer].name + " sent " + this.enemies[victim].name + " to the shadow realm!", "white", 1500, 2);
    }}

    kicked(reason: string): void {
        this.vfxHandler.addMessage("kicked due to: " + reason, "red", 2000, 0);
        this.leaveGame();
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
        let itemData = data.gameState["items"]
        let events = data.events;
        this.player.updatePosition(playerData[playerId]["pos"][0], playerData[playerId]["pos"][1]);
        this.player.hp = playerData[playerId]["hp"];
        this.player.changeName(playerData[playerId]["name"]);
        this.player.updateHealthBar();
        this.player.canShoot = data.canShoot;

        const newPlayers: Record<string, Player> = {};
        const newProjectiles: Record<string, Entity> = {};

        this.clearEnemies();
        this.clearProjectiles();
        this.clearItems();

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
            this.enemies[id].changeName(playerData[id]["name"]);
            newPlayers[id] = this.enemies[id];
        });

        Object.keys(projectileData).forEach(id => {
            if (this.projectiles[id]) {
                this.projectiles[id].updatePosition(projectileData[id]["pos"][0], projectileData[id]["pos"][1]);
            } else {

                this.projectiles[id] = new Entity(projectileData[id]["pos"][0], projectileData[id]["pos"][1], this.app, '/dist/bullet.png', projectileData[id]["angle"]);
            }
            newProjectiles[id] = this.projectiles[id];
        });

        const addedItems: Record<string, Entity> = {};

        this.items = addedItems;
        Object.keys(itemData).forEach(id => {
            if (this.items[id]) {
                this.items[id].updatePosition(itemData[id]["pos"][0], itemData[id]["pos"][1]);
            } else {
                // Assuming you have an Item class to handle different item types
                let itemImage = '/dist/pistol.png'
                switch (itemData[id]["type"]) {
                    case "weapon":
                        itemImage = '/dist/pistol.png'
                        break;
                    case "damage":
                        itemImage = '/dist/health.png'
                        break;
                    case "speed":
                        itemImage = '/dist/speed.png'
                        break;
                }
                this.items[id] = new Entity(itemData[id]["pos"][0], itemData[id]["pos"][1], this.app, itemImage);
            }
            addedItems[id] = this.items[id];
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

        view.visible = true;
        view.x = 50;
        view.y = 50;
        this.leaderboardGraphic = view;
        this.app.stage.addChild(view);
    }


}
