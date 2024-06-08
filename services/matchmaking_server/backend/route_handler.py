import os
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException
from backend.server import Server
from backend.database import Database
from backend.constants import FRONTEND_ROOT_DIR
from backend.models import Highscore

# Default Route Setups 
# TODO: implement routers

def setup_route_handler(server: Server, database: Database):
 
    @server.app.get("/")
    async def root():
        return FileResponse(os.path.join(FRONTEND_ROOT_DIR, "html", "index.html"))

    @server.app.get('/servers')
    def get_servers():
        servers = [
            {"ip": "TEST"},
            {"ip": "TEST2"},
            {"ip": "TEST3"},
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
    
    @server.app.get('/highscores')
    async def get_highscores():
        highscores = database.getHighscores()
        return JSONResponse(content=jsonable_encoder(highscores))
    
    @server.app.get('/highscores_html')
    async def get_highscores_html():
        highscores = database.getHighscores()
        html = ''.join([f'''
            <tr>
                <td class="border px-4 py-2">{highscore['name']}</td>
                <td class="border px-4 py-2">{highscore['kills']}</td>
                <td class="border px-4 py-2">{highscore['kills_per_minute']}</td>
                <td class="border px-4 py-2">{highscore['seconds_alive']}</td>
                <td class="border px-4 py-2">{highscore['timestamp']}</td>
            </tr>
        ''' for highscore in highscores])
        return HTMLResponse(content=html)
    
    @server.app.post('/highscores', status_code=201)
    async def create_highscore(highscore: Highscore):
        if len(highscore.name) > 255:
            raise HTTPException(status_code=400, detail='Name should not be longer than 255 characters')
        if highscore.kills < 0:
            raise HTTPException(status_code=400, detail='You can not have less than 0 kills')
        if highscore.seconds_alive <= 0:
            raise HTTPException(status_code=400, detail='You must be alive more than 0 seconds')
        
        okay = database.addHighscore(highscore.name, highscore.kills, highscore.seconds_alive)
        if not okay:
            raise HTTPException(status_code=500, detail='Could not save highscore')
        
        return True
