from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi_socketio import SocketManager
from fastapi.middleware.cors import CORSMiddleware
import os

# Constants
CLIENT_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "client")

# FastAPI Setup & SocketManager (socket.io) Setup
app = FastAPI()
socket_manager = SocketManager(app=app, mount_location="/socket.io")

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
