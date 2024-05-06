const socket = io();
const c = document.getElementById("gameCanvas");
const ctx = c.getContext("2d");

let platypus = document.createElement("img");
let map = document.createElement("img");
platypus.src="assets/platypus.png";
map.src = "assets/map.png";
map.onload=function(){
    draw_enemies([]);
}

kd.D.down(function(){
    socket.emit("player_move", [1,0])
});
kd.A.down(function(){
    socket.emit("player_move", [-1,0])
});
kd.W.down(function(){
    socket.emit("player_move", [0,-1])
});
kd.S.down(function(){
    socket.emit("player_move", [0,1])
});

kd.run(function () {
    kd.tick();
});
function draw_self(){
    draw_player(250,250);
}

function draw_background(x,y){
    ctx.save();
    ctx.drawImage(map, -x, -y)
    ctx.restore();
}

function draw_player(x,y){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(0.1,0.1);
    ctx.drawImage(platypus, -platypus.width/2, -platypus.height/2)
    ctx.restore();
}
function draw(enemies, pos){
    //ctx.fillStyle = "black";
    //ctx.fillRect(0, 0, 500, 500);
    draw_background(pos[0],pos[1]);
    for(let enemy of enemies){
        draw_player(enemy[0],enemy[1]);
    }
    draw_self();
    ctx.font = "20px serif";
    ctx.fillStyle = "white";
    ctx.fillText("X: "+pos[0]+", Y:"+pos[1], 10, 30);
}

socket.on("update_players", (players, newpos)=>{
    draw(players, newpos);
});
//draw_enemies([]);
//socket.emit("player_move", [Math.random()*500, Math.random()*500]);