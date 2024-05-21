import os
from fastapi.responses import FileResponse
from application.server import Server
from application.constants import CLIENT_ROOT_DIR

# Default Route Setups 
# TODO: implement routers

def setup_route_handler(server: Server):
 
    @server.app.get("/")
    async def root():
        return FileResponse(os.path.join(CLIENT_ROOT_DIR, "html", "index.html"))

    @server.app.get("/modules/socket.io.js")
    async def socketio_src():
        return FileResponse(os.path.join(CLIENT_ROOT_DIR, "node_modules", "socket.io", "client-dist", "socket.io.js"))
