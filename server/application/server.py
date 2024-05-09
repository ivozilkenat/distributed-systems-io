from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import asyncio
from typing import Dict

# templates = Jinja2Templates(directory=os.path.join(CLIENT_ROOT_DIR, "templates"))

class Server:
    # Server Constants
    CLIENT_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "client")
    
    def __init__(self) -> None:
        # FastAPI Setup & SocketManager (socket.io) Setup
        self.app = FastAPI()
        self._socket_manager = SocketManager(app=self.app, mount_location="/socket.io")
        
        self.game = Game(self.app)
        
        self._setup()
        
    def _setup(self) -> None:
        # Middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Adjust this to more strict settings in production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Static Files
        self.app.mount("/html", StaticFiles(directory=os.path.join(Server.CLIENT_ROOT_DIR, "html")), name="html")
        self.app.mount("/css", StaticFiles(directory=os.path.join(Server.CLIENT_ROOT_DIR, "css")), name="css")
        self.app.mount("/js", StaticFiles(directory=os.path.join(Server.CLIENT_ROOT_DIR, "js")), name="js")
        self.app.mount("/assets", StaticFiles(directory=os.path.join(Server.CLIENT_ROOT_DIR, "assets")), name="assets")
        
    # Run the server
    def run(self) -> None:
        asyncio.run(self._gather_tasks())
        
    async def _gather_tasks(self) -> None:
        tasks = [
            asyncio.create_task(self._run_uvicorn_server()),
            *self.game._get_game_tasks()
        ]
        await asyncio.gather(*tasks)
        
    async def _run_uvicorn_server(self) -> None:
        config = uvicorn.Config(self.app, host="127.0.0.1", port=3000)
        server = uvicorn.Server(config)
        await server.serve()
        
class Pos:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        
    def __iter__(self):
        return iter([self.x, self.y])


class Player:
    def __init__(self, pos: Pos, hp: int = 100) -> None:
        self.pos = pos
        self.hp = hp

    def is_in_range_of(self, other) -> bool:
        dx, dy = abs(self.pos.x - other.pos.x), abs(self.pos.y - other.pos.y)
        return dx <= Game.X_MAX / 2 and dy <= Game.Y_MAX / 2


class Game:
    X_MAX = 500
    Y_MAX = 500
    STATE_UPDATE_INTERVAL = 1/60
    BROADCAST_INTERVAL = 1/10
    
    def __init__(self, app) -> None:
        self.app = app
        self.socket_connections: Dict[str, Player] = {}
        
    def _get_game_tasks(self):
        return [
            asyncio.create_task(self.update_game_state()), 
            asyncio.create_task(self.broadcast_game_state())
        ]

    async def update_game_state(self) -> None:
        while True:
            # Logic to update the game state
            # For example, update player positions, check for collisions, etc.
            
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            print("Updating game state")
            await asyncio.sleep(Game.STATE_UPDATE_INTERVAL)
            
    async def broadcast_game_state(self) -> None:
        while True:
            # Logic to broadcast the game state to all connected clients
            
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            print("Broadcasting game state")
            await asyncio.sleep(Game.Broadcast_INTERVAL)

    async def update_players(self, exclude_id=None) -> None:
        for player_id, player in self.socket_connections.items():
            if player_id == exclude_id:
                continue
            opponent_positions = []
            for opponent_id, opponent in self.socket_connections.items():
                if player_id != opponent_id:
                    if (player.is_in_range_of(opponent)):
                        opponent_positions.append(
                            [Game.X_MAX / 2 + (opponent.pos.x - player.pos.x), Game.Y_MAX / 2 + (opponent.pos.y - player.pos.y)])

            await self.app.sio.emit("update_players", {
                "players": opponent_positions,
                "newpos": list(player.pos),
                "newHP": player.hp
            }, room=player_id)
            
server = Server()
