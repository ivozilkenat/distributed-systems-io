import os
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.encoders import jsonable_encoder
from application.server import Server
from application.constants import CLIENT_ROOT_DIR

# Default Route Setups 
# TODO: implement routers

def setup_route_handler(server: Server):
 
    @server.app.get("/")
    async def root():
        return FileResponse(os.path.join(CLIENT_ROOT_DIR, "html", "index.html"))

    @server.app.get("/game")
    async def root():
        return FileResponse(os.path.join(CLIENT_ROOT_DIR, "html", "game.html"))

    @server.app.get("/modules/socket.io.js")
    async def socketio_src():
        return FileResponse(os.path.join(CLIENT_ROOT_DIR, "node_modules", "socket.io", "client-dist", "socket.io.js"))

    @server.app.get('/servers')
    def get_servers():
        servers = [
            {"ip": "0.0.0.0:3001"},
            {"ip": "192.168.1.2"},
            {"ip": "192.168.1.3"},
            {"ip": "192.168.1.4"},
            {"ip": "192.168.1.5"},
        ]
        html = ''.join([f'''
            <tr>
                <td class="border px-4 py-2">{server['ip']}</td>
                <td class="border px-4 py-2">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700" onclick="location.href='/game?serverUrl={server['ip']}'">Connect</button>
                </td>
            </tr>
        ''' for server in servers])
        return HTMLResponse(content=html)