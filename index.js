const express = require('express');
const { createServer } = require('node:http');
const { join } = require("node:path")
const { Server } = require("socket.io")

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/index.html');
});

players = {}

function random(n){
    return Math.floor(Math.random()*n);
}

function update_players(){
    for(key_player in players){
        let player = players[key_player];
        let opponents = []
        for(key_opponent in players){
            if(key_player != key_opponent){
                let opponent = players[key_opponent]
                if(Math.abs(player.x - opponent.x) <= 250 && Math.abs(player.y - opponent.y) <= 250){
                    opponents.push([250 + (opponent.x-player.x), 250 + (opponent.y-player.y)])
                }
            }
        }
        player.socket.emit("update_players",opponents, [player.x, player.y]);
    }
}

io.on("connection", (socket) => {
    players[socket.id] = {"socket":socket, "x":random(100), "y":random(100)};
    socket.on("disconnect", () => {
        delete players[socket.id];
        update_players();
    })
    socket.on('player_move', (update) => {
        players[socket.id].x += update[0];
        players[socket.id].y += update[1];
        players[socket.id].x = Math.min(500,Math.max(0, players[socket.id].x));
        players[socket.id].y = Math.min(500,Math.max(0, players[socket.id].y));
        update_players();
    });
    update_players();
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});