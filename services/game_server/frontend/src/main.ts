import { io } from 'socket.io-client';
import * as PIXI from 'pixi.js';

async function main() {
    function getServerUrl(): string {
        //super hacky but may be a TEMPORARY fix
        let domain: string = window.location.host.split(":")[0];
        if (domain == 'localhost'){
            return domain + ':3001'
        }
        else {
            return domain + ':80'
        }
    }

    const serverUrl = getServerUrl();
    const socket = io(serverUrl);
    const GAME_SIZE = [800, 800];
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });

    document.getElementById('game')?.appendChild(app.canvas);

    await PIXI.Assets.load('/dist/platypus.png');
    await PIXI.Assets.load('/dist/map.png');
    await PIXI.Assets.load('/dist/leaveButton.png');
    await PIXI.Assets.load('/dist/joinButton.png');

    const UPDATE_INTERVAL_MS: number = 50;
    const MAXHP: number = 100; //TODO make this dynamic

    class Game {
        map: PIXI.Sprite;
        player: Player;
        enemies: Record<string, Player>;

        constructor() {
            this.map = this.initMap();
            this.player = new Player(0, 0);
            this.enemies = {};
        }

        initMap(): PIXI.Sprite {
            const map: PIXI.Sprite = PIXI.Sprite.from('/dist/map.png');
            app.stage.addChild(map);
            map.interactive = true;
            map.on('click', (evt: any) => {
                if(this.player.canShoot) {
                    let angle = Math.atan2(evt.data.global.y - GAME_SIZE[1] / 2, evt.data.global.x - GAME_SIZE[0] / 2);
                    socket.emit("player_click", angle);
                }
            });
            return map;
        }

        loop(): void {
            app.ticker.add(() => {
                if (keys['right']) socket.emit('player_move', [1, 0]);
                if (keys['left']) socket.emit('player_move', [-1, 0]);
                if (keys['up']) socket.emit('player_move', [0, -1]);
                if (keys['down']) socket.emit('player_move', [0, 1]);
                this.draw();
            });
        }

        draw(): void {
            this.drawBackground();
            Object.values(this.enemies).forEach((enemy: Player) => {
                enemy.readdToCanvas();
                enemy.updateDraw(enemy.relativeToPlayerTranslation(this.player));
            });
            this.player.updateDraw();
        }

        drawBackground(): void {
            const x: number = GAME_SIZE[0] / 2 - this.player.x;
            const y: number = GAME_SIZE[1] / 2 - this.player.y;
            [this.map.x, this.map.y] = [x, y];
        }

        clearEnemies(): void {
            Object.values(this.enemies).forEach((enemy: Player) => {
                enemy.removeFromCanvas();
            });
        }
    }

    let barContext = new PIXI.GraphicsContext()
    .poly([
        12, 10, 
        12 + (100), 10,
        8 + (100), 20, 
        8, 20
    ])
    .fill('white')

    class Player {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        lastUpdateTime: number;
        hp: number;
        container: PIXI.Container;
        healthBar: PIXI.Container;
        canShoot: boolean = false;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.targetX = x;
            this.targetY = y;
            this.lastUpdateTime = Date.now();
            this.hp = MAXHP;
            this.container = this.initContainer();
            this.healthBar = this.initHealthbar();
            this.updateHealthbar();
        }

        initHealthbar(): PIXI.Container {
            let hpBar: PIXI.Container = new PIXI.Container();
            hpBar.addChild(new PIXI.Graphics(barContext));
            hpBar.addChild(new PIXI.Graphics());
            hpBar.pivot.set(0.5, 0.5);
            this.container.addChild(hpBar);
            hpBar.x = -62;
            hpBar.y = 20;
            return hpBar;
        }

        updateHealthbar(): void {
            this.redrawBar(this.healthBar.getChildAt(1), this.hp / MAXHP, "red");
        }

        redrawBar(bar: PIXI.Graphics, fill: number, color: string) {
            bar.clear();
            bar.drawPolygon([
                12, 10, 
                12 + (100 * fill), 10,
                8 + (100 * fill), 20, 
                8, 20
            ]);
            bar.fill(color);
        }

        initContainer(): PIXI.Container{
            let container: PIXI.Container = new PIXI.Container();
            container.addChild(this.initSprite());
            app.stage.addChild(container);
            return container;
        }

        initSprite(): PIXI.Sprite {
            const sprite: PIXI.Sprite = PIXI.Sprite.from('/dist/platypus.png');
            sprite.anchor.set(0.5, 0.5);
            sprite.scale.set(0.1, 0.1); //TODO remove magic numbers
            return sprite;
        }

        updatePosition(newX: number, newY: number): void {
            this.x = this.targetX;
            this.y = this.targetY;
            this.targetX = newX;
            this.targetY = newY;
            this.lastUpdateTime = Date.now();
        }

        interpolatePosition(): void {
            const now: number = Date.now();
            const timeSinceUpdate: number = now - this.lastUpdateTime;
            const t: number = Math.min(1, timeSinceUpdate / UPDATE_INTERVAL_MS);
            this.x = this.x + (this.targetX - this.x) * t;
            this.y = this.y + (this.targetY - this.y) * t;
        }

        drawImage(translation: (x: number, y: number) => [number, number]): void {
            [this.container.x, this.container.y] = translation(this.x, this.y);
        }

        updateDraw(translation: (x: number, y: number) => [number, number] = this.canvasCenterTranslation): void {
            this.interpolatePosition();
            this.drawImage(translation);
        }

        canvasCenterTranslation(): [number, number] {
            return [GAME_SIZE[0] / 2, GAME_SIZE[1] / 2];
        }

        relativeToPlayerTranslation(player: Player): (x: number, y: number) => [number, number] {
            return (x: number, y: number): [number, number] => [x - player.x + GAME_SIZE[0] / 2, y - player.y + GAME_SIZE[1] / 2];
        }

        removeFromCanvas(): void {
            app.stage.removeChild(this.container);
        }

        readdToCanvas(): void {
            app.stage.addChild(this.container);
        }
    }

    const keyMap: Record<string, string> = {
        Space: 'space',
        KeyW: 'up',
        ArrowUp: 'up',
        KeyA: 'left',
        ArrowLeft: 'left',
        KeyS: 'down',
        ArrowDown: 'down',
        KeyD: 'right',
        ArrowRight: 'right',
    };

    const keys: Record<string, boolean> = {
        up: false,
        down: false,
        right: false,
        left: false,
    };

    window.addEventListener('keydown', (evt: KeyboardEvent) => {
        if (!keyMap[evt.code]) return;
        keys[keyMap[evt.code]] = true;
    });

    window.addEventListener('keyup', (evt: KeyboardEvent) => {
        if (!keyMap[evt.code]) return;
        keys[keyMap[evt.code]] = false;
    });

    const game = new Game();

    socket.on('update_players', (data: { newpos: [number, number]; newHP: number; enemies: Record<string, [number, number]>, enemyHealth: Record<string, number> , canShoot: boolean}) => {
        game.player.updatePosition(data.newpos[0], data.newpos[1]);
        game.player.hp = data.newHP;
        game.player.updateHealthbar();
        game.player.canShoot = data.canShoot;

        const newPlayers: Record<string, Player> = {};

        game.clearEnemies();

        Object.keys(data.enemies).forEach(id => {
            if (game.enemies[id]) {
                game.enemies[id].updatePosition(data.enemies[id][0], data.enemies[id][1]);
                if (game.enemies[id].hp != data.enemyHealth[id]) {
                    game.enemies[id].hp = data.enemyHealth[id];
                    game.enemies[id].updateHealthbar();
                }
            } else {
                game.enemies[id] = new Player(data.enemies[id][0], data.enemies[id][1]);
                game.enemies[id].hp = data.enemyHealth[id];
                game.enemies[id].updateHealthbar();
            }
            newPlayers[id] = game.enemies[id];
        });

        game.enemies = newPlayers;
    });

    function joinGame(): void {
        game.enemies = {};
        socket.connect();
        app.stage.addChild(game.map, game.player.container);
    }

    function leaveGame(): void {
        socket.disconnect();
        game.clearEnemies();
        app.stage.removeChild(game.map, game.player.container);
        game.enemies = {};
    }

    const leaveButton: PIXI.Sprite = PIXI.Sprite.from('/dist/leaveButton.png');
    const joinButton: PIXI.Sprite = PIXI.Sprite.from('/dist/joinButton.png');

    leaveButton.on("click",leaveGame);
    leaveButton.eventMode = "static";
    leaveButton.anchor.set(0.5,0.5);
    joinButton.on("click",joinGame);
    joinButton.eventMode = "static";
    joinButton.anchor.set(0.5,0.5);

    [joinButton.x, joinButton.y] = [GAME_SIZE[0] / 2, GAME_SIZE[1] / 2 + 150];
    [leaveButton.x, leaveButton.y] = [GAME_SIZE[0] / 2, GAME_SIZE[1] / 2 + 250];
    console.log("starting loop")
    game.loop();
}

console.log("Starting main")
main();


