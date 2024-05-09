import uvicorn
import os
import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
from application.game import Game

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
        
server = Server()
