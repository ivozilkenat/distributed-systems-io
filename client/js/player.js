
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.lastUpdateTime = Date.now();
        this.hp = 100; // Assuming HP is a property of the player
        this.sprite = this.initSprite();
    }

    initSprite(){
        let sprite = PIXI.Sprite.from('/assets/platypus.png');
        sprite.anchor.set(0.5,0.5)
        sprite.scale.set(0.1,0.1);
        app.stage.addChild(sprite);
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
        const updateInterval = UPDATE_INTERAVL_MS; // Expected update interval in milliseconds
        const t = Math.min(1, timeSinceUpdate / updateInterval);
        this.x = this.x + (this.targetX - this.x) * t
        this.y = this.y + (this.targetY - this.y) * t
    }

    draw_image(translation) {
        [this.sprite.x, this.sprite.y] = translation(this.x,this.y);
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
        app.stage.removeChild(this.sprite);
    }
    readdToCanvas(){
        app.stage.addChild(this.sprite);
    }
}

class Game {
    constructor() {
        this.map = this.initMap();
        this.player = new Player(0, 0);
        this.enemies = {};
    }

    initMap(){
        let map = PIXI.Sprite.from('/assets/map.png');
        app.stage.addChild(map);
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
