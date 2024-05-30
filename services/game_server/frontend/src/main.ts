import { io } from 'socket.io-client';
import * as PIXI from 'pixi.js';

async function main() {
  function getServerUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('serverUrl') || 'http://0.0.0.0:3001';
  }

  const serverUrl = getServerUrl();
  const socket = io(serverUrl);

  const app = new PIXI.Application();
  await app.init({ background: '#1099bb', resizeTo: window });

  document.getElementById('game')?.appendChild(app.canvas);

  await PIXI.Assets.load('/dist/platypus.png');
  await PIXI.Assets.load('/dist/map.png');
  await PIXI.Assets.load('/dist/leaveButton.png');
  await PIXI.Assets.load('/dist/joinButton.png');

  const UPDATE_INTERVAL_MS = 50;

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
      const map = PIXI.Sprite.from('/dist/map.png');
      app.stage.addChild(map);
      return map;
    }

    loop() {
      app.ticker.add(() => {
        if (keys['right']) socket.emit('player_move', [1, 0]);
        if (keys['left']) socket.emit('player_move', [-1, 0]);
        if (keys['up']) socket.emit('player_move', [0, -1]);
        if (keys['down']) socket.emit('player_move', [0, 1]);
        this.draw();
      });
    }

    draw() {
      this.drawBackground();
      Object.values(this.enemies).forEach(enemy => {
        enemy.readdToCanvas();
        enemy.updateDraw(enemy.relativeToPlayerTranslation(this.player));
      });
      this.player.updateDraw();
    }

    drawBackground() {
      const x = 500 / 2 - this.player.x;
      const y = 500 / 2 - this.player.y;
      [this.map.x, this.map.y] = [x, y];
    }

    clearEnemies() {
      Object.values(this.enemies).forEach(enemy => {
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

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.targetX = x;
      this.targetY = y;
      this.lastUpdateTime = Date.now();
      this.hp = 100;
      this.sprite = this.initSprite();
    }

    initSprite(): PIXI.Sprite {
      const sprite = PIXI.Sprite.from('/dist/platypus.png');
      sprite.anchor.set(0.5, 0.5);
      sprite.scale.set(0.1, 0.1);
      app.stage.addChild(sprite);
      return sprite;
    }

    updatePosition(newX: number, newY: number) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = newX;
      this.targetY = newY;
      this.lastUpdateTime = Date.now();
    }

    interpolatePosition() {
      const now = Date.now();
      const timeSinceUpdate = now - this.lastUpdateTime;
      const t = Math.min(1, timeSinceUpdate / UPDATE_INTERVAL_MS);
      this.x = this.x + (this.targetX - this.x) * t;
      this.y = this.y + (this.targetY - this.y) * t;
    }

    drawImage(translation: (x: number, y: number) => [number, number]) {
      [this.sprite.x, this.sprite.y] = translation(this.x, this.y);
    }

    updateDraw(translation = this.canvasCenterTranslation) {
      this.interpolatePosition();
      this.drawImage(translation);
    }

    canvasCenterTranslation(_x: number, _y: number): [number, number] {
      return [500 / 2, 500 / 2];
    }

    relativeToPlayerTranslation(player: Player) {
      return (x: number, y: number): [number, number] => [x - player.x + 500 / 2, y - player.y + 500 / 2];
    }

    removeFromCanvas() {
      app.stage.removeChild(this.sprite);
    }

    readdToCanvas() {
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

  window.addEventListener('keydown', (evt) => {
    if (!keyMap[evt.code]) return;
    keys[keyMap[evt.code]] = true;
  });

  window.addEventListener('keyup', (evt) => {
    if (!keyMap[evt.code]) return;
    keys[keyMap[evt.code]] = false;
  });

  const game = new Game();

  socket.on('update_players', (data) => {
    game.player.updatePosition(data['newpos'][0], data['newpos'][1]);
    game.player.hp = data['newHP'];

    const newPlayers: Record<string, Player> = {};

    game.clearEnemies();

    Object.keys(data['enemies']).forEach(id => {
      if (game.enemies[id]) {
        game.enemies[id].updatePosition(data['enemies'][id][0], data['enemies'][id][1]);
      } else {
        game.enemies[id] = new Player(data['enemies'][id][0], data['enemies'][id][1]);
      }
      newPlayers[id] = game.enemies[id];
    });

    game.enemies = newPlayers;
  });

  function joinGame() {
    game.enemies = {};
    socket.connect();
    app.stage.addChild(game.map, game.player.sprite);
  }

  function leaveGame() {
    socket.disconnect();
    game.clearEnemies();
    app.stage.removeChild(game.map, game.player.sprite);
    game.enemies = {};
  }

  const leaveButton = PIXI.Sprite.from('/dist/leaveButton.png');
  const joinButton = PIXI.Sprite.from('/dist/joinButton.png');

  leaveButton.on('click', leaveGame);
  leaveButton.interactive = true;
  joinButton.on('click', joinGame);
  joinButton.interactive = true;

  [leaveButton.x, leaveButton.y] = [0, 400];
  [joinButton.x, joinButton.y] = [200, 400];

  app.stage.addChild(leaveButton);
  app.stage.addChild(joinButton);

  game.loop();
}

main();
