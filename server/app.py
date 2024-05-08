from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
import random
from typing import Dict
import os

# Constants
CLIENT_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "client")

# FastAPI Setup & SocketManager (socket.io) Setup
app = FastAPI()
socket_manager = SocketManager(app=app, mount_location="/socket.io")

# TODO: Maybe replace with sessions? Research required, https://python-socketio.readthedocs.io/en/latest/server.html#defining-event-handlers
# sid: {x, y, HP}
players: Dict[str, dict] = {}

def random_position(n):
    return random.randint(0, n)

async def update_players(exclude_id=None):
    for player_id, player in players.items():
        if player_id == exclude_id:
            continue
        opponents = []
        for opponent_id, opponent in players.items():
            if player_id != opponent_id:
                dx, dy = abs(player["x"] - opponent["x"]), abs(player["y"] - opponent["y"])
                if dx <= 250 and dy <= 250:
                    opponents.append([250 + (opponent["x"] - player["x"]), 250 + (opponent["y"] - player["y"])])
        await app.sio.emit("update_players",{
            "players": opponents,
            "newpos": [player["x"], player["y"]],
            "newHP": player["HP"]
        } , room = player_id)

@app.sio.on("player_move")
async def player_move(sid, update):
    players[sid]["x"] += update[0]
    players[sid]["y"] += update[1]
    players[sid]["x"] = min(500,max(0,players[sid]["x"]))
    players[sid]["y"] = min(500,max(0,players[sid]["y"]))
    await update_players()


@app.sio.on('connect')
async def client_side_receive_msg(sid,env):
    players[sid] = {"x":random_position(500), "y":random_position(500), "HP":100}
    await update_players()

@app.sio.on('disconnect')
async def client_side_receive_msg(sid):
    del players[sid]
    await update_players()

# Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to more strict settings in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files Setup
app.mount("/html", StaticFiles(directory=os.path.join(CLIENT_ROOT_DIR, "html")), name="html")
app.mount("/css", StaticFiles(directory=os.path.join(CLIENT_ROOT_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(CLIENT_ROOT_DIR, "js")), name="js")
app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_ROOT_DIR, "assets")), name="assets")

# templates = Jinja2Templates(directory=os.path.join(CLIENT_ROOT_DIR, "templates"))

# Default Route Setups 
# TODO: implement routers
@app.get("/")
async def root():
    return FileResponse(os.path.join(CLIENT_ROOT_DIR, "html", "index.html"))

@app.get("/modules/socket.io.js")
async def socketio_src():
    return FileResponse(os.path.join(CLIENT_ROOT_DIR, "node_modules", "socket.io", "client-dist", "socket.io.js"))
