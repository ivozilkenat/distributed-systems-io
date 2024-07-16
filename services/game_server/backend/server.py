import uvicorn
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi_socketio import SocketManager # type: ignore
from fastapi.middleware.cors import CORSMiddleware
from backend.constants import FRONTEND_ROOT_DIR, HOST, PORT, MATCHMAKING_SERVER, SERVER_ID, SERVER_TOKEN
from backend.game import Game
from backend.matchmakingAPI import MatchmakingAPI

class Server:
    def __init__(self) -> None:
        
        # Lifespan events (logoff from matchmaking service on shutdown)
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            print("Startup")
            yield
            print("Shutdown")
            self.matchmaking_api.logoff()
            
        # FastAPI Setup & SocketManager (socket.io) Setup
        self.app = FastAPI(lifespan=lifespan)
        self._setup()
        
        self._socket_manager = SocketManager(app=self.app, mount_location="/socket.io")
        self.game = Game(self)
        self.matchmaking_api = MatchmakingAPI(MATCHMAKING_SERVER, SERVER_ID, SERVER_TOKEN, self.game)
        
    def _setup(self) -> None:
        # Middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # TODO: Adjust this to more strict settings in production (also add to matchmaking service)
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Static Files
        self.app.mount("/dist", StaticFiles(directory=os.path.join(FRONTEND_ROOT_DIR)), name="html")
        # templates = Jinja2Templates(directory=os.path.join(FRONTEND_ROOT_DIR, "templates"))
        
    # Run the server
    def run(self) -> None:
        asyncio.run(self._gather_tasks())
        
    async def _gather_tasks(self) -> None:
        tasks = [
            *self._get_tasks(),
            *self.game._get_tasks(),
            *self.matchmaking_api._get_tasks(),
        ]
        await asyncio.gather(*tasks)

    def _get_tasks(self):
        return [
            asyncio.create_task(self._run_uvicorn_server()),
        ]

    async def _run_uvicorn_server(self) -> None:
        config = uvicorn.Config(self.app, host=HOST, port=PORT)
        server = uvicorn.Server(config)
        await server.serve()
