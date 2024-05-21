
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