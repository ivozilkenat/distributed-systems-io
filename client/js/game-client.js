const socket = io();

const canv = document.getElementById("gameCanvas");
const ctx = canv.getContext("2d");

let platypus = document.createElement("img");
let map = document.createElement("img");
platypus.src = "assets/platypus.png";
map.src = "assets/map.png";

const UPDATE_INTERAVL_MS = 50;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.lastUpdateTime = Date.now();
        this.hp = 100; // Assuming HP is a property of the player
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
        const updateInterval = UPDATE_INTERAVL_MS; // Expected update interval in milliseconds
        const t = Math.min(1, timeSinceUpdate / updateInterval);
        this.x = this.x + (this.targetX - this.x) * t
        this.y = this.y + (this.targetY - this.y) * t
    }

    draw_image(translation) {
        ctx.save();
        let [x, y] = translation(this.x, this.y);
        ctx.translate(x, y);
        ctx.scale(0.1, 0.1);
        ctx.drawImage(platypus, -platypus.width / 2, -platypus.height / 2);
        ctx.restore();
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
        return [ctx.canvas.width / 2, ctx.canvas.height / 2];
    }

    relative_to_player_translation(player) {
        return (x, y) => {
            return [x - player.x + ctx.canvas.width / 2, y - player.y + ctx.canvas.height / 2]
        }
    }

}

class Game {
    constructor() {
        this.player = new Player(0, 0);
        this.enemies = {};
    }

    loop() { // Is this smart?
        requestAnimationFrame(this.loop.bind(this));
        this.draw();
    }

    draw_hud() {
        ctx.font = "20px serif";
        ctx.fillStyle = "white";
        ctx.fillText("X: " + this.player.x + ", Y:" + this.player.y, 10, 30);
        ctx.fillText("HP: " + this.player.hp, 200, 30); // Assuming HP is a property of selfPlayer
        ctx.fillText("Enemies: " + Object.keys(this.enemies).length, 400, 30);
    }

    draw_background() {
        ctx.save();  // Save the current context state

        // Calculate the image position
        let x = ctx.canvas.width / 2 - this.player.x;
        let y = ctx.canvas.height / 2 - this.player.y;

        // Draw the image
        ctx.drawImage(map, x, y);
        ctx.restore(); // Restore the context to previous state
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

    draw_clear() {
        ctx.save();
        // Set the background color to image border color
        ctx.fillStyle = '#BADA31';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    draw() {
        this.draw_clear();
        this.draw_background();
        this.draw_border();
        this.player.update_draw();

        // Draw each other player
        Object.values(this.enemies).forEach(enemy => {
            enemy.update_draw(enemy.relative_to_player_translation(this.player));
        });

        this.draw_hud();
    }
}

// map.onload = function () {
//     draw([[150, 150]], [250, 250], 100);  // Initial draw call with dummy values
// }

game = new Game();

// Keyboard control setup using keydrown library
kd.D.down(function () {
    socket.emit("player_move", [2, 0]);
});
kd.A.down(function () {
    socket.emit("player_move", [-2, 0]);
});
kd.W.down(function () {
    socket.emit("player_move", [0, -2]);
});
kd.S.down(function () {
    socket.emit("player_move", [0, 2]);
});

kd.run(function () {
    kd.tick();
});

socket.on("update_players", (data) => {
    // Directly update self player from newpos
    game.player.updatePosition(data["newpos"][0], data["newpos"][1]);
    game.player.hp = data["newHP"];

    // Handle other enemies using their IDs
    const newPlayers = {};
    Object.keys(data["enemies"]).forEach(id => {
        if (game.enemies[id]) {
            game.enemies[id].updatePosition(data["enemies"][id][0], data["enemies"][id][1]);
        } else {
            game.enemies[id] = new Player(data["enemies"][id][0], data["enemies"][id][1]);
        }
        newPlayers[id] = game.enemies[id];
    });

    // Replace the old enemies dictionary with the new one
    game.enemies = newPlayers;
});

function joinGame() {
    game.enemies = {};
    socket.connect();
}

function leaveGame() {
    socket.disconnect();
    game.enemies = {};

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function goFullscreen() {
    canv.requestFullscreen();
}

game.loop();