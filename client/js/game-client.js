const socket = io();

// TODO: put app in Game constructor?
const app = new PIXI.Application();
const GAME_SIZE = [500,500]
await app.init({ width: GAME_SIZE[0], height: GAME_SIZE[1] });

document.getElementById("game").appendChild(app.canvas);

await PIXI.Assets.load('/assets/platypus.png');
await PIXI.Assets.load('/assets/map.png');
await PIXI.Assets.load('/assets/leaveButton.png');
await PIXI.Assets.load('/assets/joinButton.png');

const UPDATE_INTERAVL_MS = 50;

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

// // Keyboard control setup using keydrown library
// kd.D.down(function () {
//     socket.emit("player_move", [2, 0]);
// });
// kd.A.down(function () {
//     socket.emit("player_move", [-2, 0]);
// });
// kd.W.down(function () {
//     socket.emit("player_move", [0, -2]);
// });
// kd.S.down(function () {
//     socket.emit("player_move", [0, 2]);
// });

// kd.run(function () {
//     kd.tick();
// });

socket.on("update_players", (data) => {
    // Directly update self player from newpos
    game.player.updatePosition(data["newpos"][0], data["newpos"][1]);
    game.player.hp = data["newHP"];

    // // Handle other enemies using their IDs
    const newPlayers = {};

    // a bit hacky, but trust in the process
    game.clearEnemies();

    Object.keys(data["enemies"]).forEach(id => {
        if (game.enemies[id]) {
            game.enemies[id].updatePosition(data["enemies"][id][0], data["enemies"][id][1]);
        } else {
            game.enemies[id] = new Player(data["enemies"][id][0], data["enemies"][id][1]);
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
    app.stage.addChild(game.map, game.player.sprite);
}

function leaveGame() {
    socket.disconnect();
    //while(app.stage.children[0]) { app.stage.removeChild(app.stage.children[0]); }
    game.clearEnemies();
    app.stage.removeChild(game.map, game.player.sprite);
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