const socket = io();

const canv = document.getElementById("gameCanvas");
const ctx = canv.getContext("2d");

let platypus = document.createElement("img");
let map = document.createElement("img");
platypus.src="assets/platypus.png";
map.src = "assets/map.png";
map.onload=function(){
    draw([[150,150]],[250,250]);
}

kd.D.down(function(){
    socket.emit("player_move", [2,0]);
});
kd.A.down(function(){
    socket.emit("player_move", [-2,0]);
});
kd.W.down(function(){
    socket.emit("player_move", [0,-2]);
});
kd.S.down(function(){
    socket.emit("player_move", [0,2]);
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
    draw_background(pos[0],pos[1]);
    for(let enemy of enemies){
        draw_player(enemy[0],enemy[1]);
    }
    draw_self();
    ctx.font = "20px serif";
    ctx.fillStyle = "white";
    ctx.fillText("X: "+pos[0]+", Y:"+pos[1], 10, 30);
}

socket.on("update_players", (data)=>{
    draw(data["players"], data["newpos"]);
});

function joinGame(){
    socket.connect();
}

function leaveGame(){
    socket.disconnect();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height)
}