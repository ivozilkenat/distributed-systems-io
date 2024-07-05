import uvicorn
import os
import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.constants import FRONTEND_ROOT_DIR
import logging


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("/game_servers/ping") == -1

class Server:
    def __init__(self) -> None:
        # FastAPI Setup & SocketManager (socket.io) Setup
        self.app = FastAPI()
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
        self.app.mount("/html", StaticFiles(directory=os.path.join(FRONTEND_ROOT_DIR, "html")), name="html")
        self.app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_ROOT_DIR, "css")), name="css")
        self.app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_ROOT_DIR, "js")), name="js")
        self.app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_ROOT_DIR, "assets")), name="assets")
        # templates = Jinja2Templates(directory=os.path.join(FRONTEND_ROOT_DIR, "templates"))

        # Don't log /game_servers/ping
        logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

    # Run the server
    def run(self) -> None:
        asyncio.run(self._gather_tasks())

    async def _gather_tasks(self) -> None:
        tasks = [
            asyncio.create_task(self._run_uvicorn_server()),
        ]
        await asyncio.gather(*tasks)

    async def _run_uvicorn_server(self) -> None:
        config = uvicorn.Config(self.app, host="0.0.0.0", port=3000)
        server = uvicorn.Server(config)
        await server.serve()
