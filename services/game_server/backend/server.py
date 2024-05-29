import uvicorn
import os
import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
from backend.game import Game
from backend.constants import FRONTEND_ROOT_DIR

origins = ["http://localhost:3000"]


class Server:
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
            allow_origins=[],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        
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
        config = uvicorn.Config(self.app, host="0.0.0.0", port=3001)
        server = uvicorn.Server(config)
        await server.serve()
