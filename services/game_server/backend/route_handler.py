import os
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException
from backend.server import Server
from backend.constants import FRONTEND_ROOT_DIR

# Default Route Setups 
# TODO: implement routers

def setup_route_handler(server: Server):
 
    @server.app.get("/")
    async def root():
        return FileResponse(os.path.join(FRONTEND_ROOT_DIR, "index.html"))
    
    @server.app.get("/modules/socket.io.js")
    async def socketio_src():
        return FileResponse(os.path.join(FRONTEND_ROOT_DIR, "node_modules", "socket.io", "client-dist", "socket.io.js"))
