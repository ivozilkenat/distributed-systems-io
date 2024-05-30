import { io } from 'socket.io-client';
import * as PIXI from 'pixi.js';

async function main() {
    function getServerUrl(): string {
        const params = new URLSearchParams(window.location.search);
        return params.get('serverUrl') || 'http://0.0.0.0:3001';
    }

    const serverUrl = getServerUrl();
    const socket = io(serverUrl);
    const GAME_SIZE = [2500, 1000];
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });

    document.getElementById('game')?.appendChild(app.canvas);

    await PIXI.Assets.load('/dist/platypus.png');
    await PIXI.Assets.load('/dist/map.png');
    await PIXI.Assets.load('/dist/leaveButton.png');
    await PIXI.Assets.load('/dist/joinButton.png');

    const UPDATE_INTERVAL_MS: number = 50;
    const MAXHP: number = 100;

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
            map.on('click', (evt) => {
                socket.emit('player_click', Math.atan2(evt.data.global.y - GAME_SIZE[1] / 2, evt.data.global.x - GAME_SIZE[0] / 2));
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

    class Player {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        lastUpdateTime: number;
        hp: number;
        sprite: PIXI.Sprite;
        healthBar: PIXI.Container;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.targetX = x;
            this.targetY = y;
            this.lastUpdateTime = Date.now();
            this.hp = MAXHP;
            this.sprite = this.initSprite();
            this.healthBar = this.initHealthbar();
        }

        initHealthbar(): PIXI.Container {
            const hpBar: PIXI.Container = new PIXI.Container();
            hpBar.addChild(this.createBar(1, 0x000001));
            hpBar.addChild(this.createBar(1, 0xFF0000));
            hpBar.pivot.set(0.5, 0.5);
            app.stage.addChild(hpBar);
            return hpBar;
        }

        updateHealthbar(): void {
            this.healthBar.x = this.sprite.x - 62;
            this.healthBar.y = this.sprite.y + 20;
            this.redrawBar(this.healthBar.getChildAt(1) as PIXI.Graphics, this.hp / MAXHP, 0xFF0000);
        }

        redrawBar(bar: PIXI.Graphics, fill: number, color: number): void {
            bar.clear();
            bar.beginFill(color);
            bar.drawPolygon([
                12, 10,
                12 + (100 * fill), 10,
                8 + (100 * fill), 20,
                8, 20
            ]);
            bar.endFill();
        }

        createBar(fill: number, color: number): PIXI.Graphics {
            const bar: PIXI.Graphics = new PIXI.Graphics();
            this.redrawBar(bar, fill, color);
            return bar;
        }

        initSprite(): PIXI.Sprite {
            const sprite: PIXI.Sprite = PIXI.Sprite.from('/dist/platypus.png');
            sprite.anchor.set(0.5, 0.5);
            sprite.scale.set(0.1, 0.1);
            app.stage.addChild(sprite);
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
            [this.sprite.x, this.sprite.y] = translation(this.x, this.y);
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
            app.stage.removeChild(this.sprite);
        }

        readdToCanvas(): void {
            app.stage.addChild(this.sprite);
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

    socket.on('update_players', (data: { newpos: [number, number]; newHP: number; enemies: Record<string, [number, number]> }) => {
        game.player.updatePosition(data.newpos[0], data.newpos[1]);
        game.player.hp = data.newHP;

        const newPlayers: Record<string, Player> = {};

        game.clearEnemies();

        Object.keys(data.enemies).forEach(id => {
            if (game.enemies[id]) {
                game.enemies[id].updatePosition(data.enemies[id][0], data.enemies[id][1]);
            } else {
                game.enemies[id] = new Player(data.enemies[id][0], data.enemies[id][1]);
            }
            newPlayers[id] = game.enemies[id];
        });

        game.enemies = newPlayers;
    });

    function joinGame(): void {
        game.enemies = {};
        socket.connect();
        app.stage.addChild(game.map, game.player.sprite);
    }

    function leaveGame(): void {
        socket.disconnect();
        game.clearEnemies();
        app.stage.removeChild(game.map, game.player.sprite);
        game.enemies = {};
    }

    const leaveButton: PIXI.Sprite = PIXI.Sprite.from('/dist/leaveButton.png');
    const joinButton: PIXI.Sprite = PIXI.Sprite.from('/dist/joinButton.png');

    leaveButton.on('click', leaveGame);
    leaveButton.eventMode = 'static';
    joinButton.on('click', joinGame);
    joinButton.eventMode = 'static';

    [leaveButton.x, leaveButton.y] = [0, 400];
    [joinButton.x, joinButton.y]
    game.loop();
}


main();


