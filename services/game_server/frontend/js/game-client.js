function getServerUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('serverUrl') || 'http://localhost:3001';
}

const serverUrl = getServerUrl(); 
const socket = io.connect(serverUrl);

// TODO: put app in Game constructor?
const app = new PIXI.Application();
const GAME_SIZE = [2500,1000]
await app.init({ width: GAME_SIZE[0], height: GAME_SIZE[1] });

document.getElementById("game").appendChild(app.canvas);

await PIXI.Assets.load('/assets/platypus.png');
await PIXI.Assets.load('/assets/map.png');
await PIXI.Assets.load('/assets/leaveButton.png');
await PIXI.Assets.load('/assets/joinButton.png');

const UPDATE_INTERVAL_MS = 50;
const MAXHP = 100; //TODO make this dynamic


let barContext = new PIXI.GraphicsContext()
    .poly([
        12, 10, 
        12 + (100), 10,
        8 + (100), 20, 
        8, 20
    ])
    .fill('white')

export class Game {
    constructor() {
        this.map = this.initMap();
        this.player = new Player(0, 0);
        this.enemies = {};
    }

    initMap(){
        let map = PIXI.Sprite.from('/assets/map.png');
        app.stage.addChild(map);
        map.interactive = true;
        map.on('click', (evt) => {
            if(this.player.canShoot) {
                socket.emit("player_click", Math.atan2(evt.data.global.y - GAME_SIZE[1] / 2, evt.data.global.x - GAME_SIZE[0] / 2));
            }
        });
        return map
    }

    loop() { // Is this smart? // Done with tick now, maybe come back to this later?
        let game = this;
        app.ticker.add((tick) => {
            if(keys["right"])socket.emit("player_move",[1,0]);
            if(keys["left"])socket.emit("player_move",[-1,0]);
            if(keys["up"])socket.emit("player_move",[0,-1]);
            if(keys["down"])socket.emit("player_move",[0,1]);
            game.draw();
        });
    }

    draw_hud() {
        ctx.font = "20px serif";
        ctx.fillStyle = "white";
        ctx.fillText("X: " + this.player.x + ", Y:" + this.player.y, 10, 30);
        ctx.fillText("HP: " + this.player.hp, 200, 30); // Assuming HP is a property of selfPlayer
        ctx.fillText("Enemies: " + Object.keys(this.enemies).length, 400, 30);
    }

    draw_background() {
        let x = GAME_SIZE[0] / 2 - this.player.x;
        let y = GAME_SIZE[1] / 2 - this.player.y;
        [this.map.x, this.map.y] = [x,y];
    }

    draw_border() {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        let x = ctx.canvas.width / 2 - this.player.x;
        let y = ctx.canvas.height / 2 - this.player.y;
        ctx.strokeRect(x, y, map.width, map.height);
        ctx.restore();
    }

    draw() {
        this.draw_background();
        // this.draw_border();

        // Draw each other player

        Object.values(this.enemies).forEach(enemy => {
            enemy.readdToCanvas();
            enemy.update_draw(enemy.relative_to_player_translation(this.player));
        });

        this.player.update_draw();
        // this.draw_hud();
    }

    clearEnemies(){
        // a bit hacky, but trust in the process
        Object.values(game.enemies).forEach(enemy => {
            enemy.removeFromCanvas()
        });
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.lastUpdateTime = Date.now();
        this.hp = 100; // Assuming HP is a property of the player
        this.container = this.initContainer();
        this.healthBar = this.initHealthbar();
        this.updateHealthbar();
        this.canShoot = false;
    }

    // ui drawing
    initHealthbar() {
        let hpBar = new PIXI.Container();
        hpBar.addChild(new PIXI.Graphics(barContext));
        hpBar.addChild(new PIXI.Graphics());
        hpBar.pivot.set(0.5, 0.5);
        this.container.addChild(hpBar);
        hpBar.x = -62;
        hpBar.y = 20;
        return hpBar;
    }

    updateHealthbar() {
        this.redrawBar(this.healthBar.getChildAt(1), this.hp / MAXHP, "red");
    }

    redrawBar(bar, fill, color) {
        bar.clear();
        bar.drawPolygon([
            12, 10, 
            12 + (100 * fill), 10,
            8 + (100 * fill), 20, 
            8, 20
        ]);
        bar.fill(color);
    }
    
    initContainer(){
        let container = new PIXI.Container();
        container.addChild(this.initSprite());
        app.stage.addChild(container);
        return container;
    }
    
    initSprite(){
        let sprite = PIXI.Sprite.from('/assets/platypus.png');
        sprite.anchor.set(0.5,0.5)
        sprite.scale.set(0.1,0.1); // TODO remove magic numbers
        return sprite;
    }

    updatePosition(newX, newY) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = newX;
        this.targetY = newY;
        this.lastUpdateTime = Date.now();
    }

    interpolatePosition() {
        const now = Date.now();
        const timeSinceUpdate = now - this.lastUpdateTime;
        const updateInterval = UPDATE_INTERVAL_MS; // Expected update interval in milliseconds
        const t = Math.min(1, timeSinceUpdate / updateInterval);
        this.x = this.x + (this.targetX - this.x) * t
        this.y = this.y + (this.targetY - this.y) * t
    }

    draw_image(translation) {
        [this.container.x, this.container.y] = translation(this.x,this.y);
    }

    draw_debug() {
        ctx.save();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }


    update_draw(translation = this.canvase_center_translation) {
        this.interpolatePosition();
        this.draw_image(translation);
        // this.draw_debug();
    }

    // Default translation to make player appear in the center of the canvas
    canvase_center_translation(x, y) {
        // TODO: global variables for width/height
        return [GAME_SIZE[0]/2, GAME_SIZE[1]/2];
        //return [ctx.canvas.width / 2, ctx.canvas.height / 2];
    }

    relative_to_player_translation(player) {
        return (x, y) => {
            return [x - player.x + GAME_SIZE[0] / 2, y - player.y + GAME_SIZE[1] / 2]
        }
    }

    // a bit hacky but solves layer and removing disconnected players problem easily - change later (https://api.pixijs.io/@pixi/layers/Layer.html)
    removeFromCanvas(){
        app.stage.removeChild(this.container);
    }
    readdToCanvas(){
        app.stage.addChild(this.container);
    }
}


const keyMap = {
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

let keys = {
    "up":false,
    "down":false,
    "right":false,
    "left":false
}

window.addEventListener('keydown', (evt) => {
    if(!keyMap[evt.code])return;
    keys[keyMap[evt.code]] = true;
});
window.addEventListener('keyup', (evt) => {
    if(!keyMap[evt.code])return;
    keys[keyMap[evt.code]] = false;
});

app.ticker.add((tick) => {
    if(keys["right"])socket.emit("player_move",[1,0]);
    if(keys["left"])socket.emit("player_move",[-1,0]);
    if(keys["up"])socket.emit("player_move",[0,-1]);
    if(keys["down"])socket.emit("player_move",[0,1]);
});



// // map.onload = function () {
// //     draw([[150, 150]], [250, 250], 100);  // Initial draw call with dummy values
// // }

let game = new Game();

socket.on("update_players", (data) => {
    // Directly update self player from newpos
    game.player.updatePosition(data["newpos"][0], data["newpos"][1]);
    
    if (game.player.hp != data["newHP"]) {
        game.player.hp = data["newHP"];
        //update UI
        console.log("changing player health")
        game.player.updateHealthbar();
    }
    game.player.canShoot = data["canShoot"];
    

    // // Handle other enemies using their IDs
    const newPlayers = {};

    // a bit hacky, but trust in the process
    game.clearEnemies();

    Object.keys(data["enemies"]).forEach(id => {
        if (game.enemies[id]) {
            game.enemies[id].updatePosition(data["enemies"][id][0], data["enemies"][id][1]);
            game.enemies[id].hp = data["enemyHealth"][id]
            game.enemies[id].updateHealthbar();
        } else {
            game.enemies[id] = new Player(data["enemies"][id][0], data["enemies"][id][1]);
            game.enemies[id].hp = data["enemyHealth"][id];
            console.log("changing new enemy health")
            game.enemies[id].updateHealthbar();
        }
        newPlayers[id] = game.enemies[id];
        
    });

    // // Replace the old enemies dictionary with the new one
    game.enemies = newPlayers;
});




// Currently proof of concept
function joinGame() {
    game.enemies = {};
    socket.connect();
    app.stage.addChild(game.map, game.player.container);
}

function leaveGame() {
    socket.disconnect();
    //while(app.stage.children[0]) { app.stage.removeChild(app.stage.children[0]); }
    game.clearEnemies();
    app.stage.removeChild(game.map, game.player.container);
    game.enemies = {};
}
const leaveButton = PIXI.Sprite.from('/assets/leaveButton.png');
const joinButton = PIXI.Sprite.from('/assets/joinButton.png');

leaveButton.on("click",leaveGame);
leaveButton.eventMode = "static";
joinButton.on("click",joinGame);
joinButton.eventMode = "static";

[leaveButton.x, leaveButton.y] = [0,400];
[joinButton.x, joinButton.y] = [200,400];

app.stage.addChild(leaveButton);
app.stage.addChild(joinButton);
// function goFullscreen() {
//     canv.requestFullscreen();
// }

game.loop();