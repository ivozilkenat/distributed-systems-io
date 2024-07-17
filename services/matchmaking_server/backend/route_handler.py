import os
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException
from backend.server import Server
from backend.database import Database
from backend.constants import FRONTEND_ROOT_DIR
from backend.models import Highscore, GameServerDescription, GameServerUpdate, GameServerCredentials, GameServerPing

# Default Route Setups
# TODO: implement routers

def setup_route_handler(server: Server, database: Database):
 
    @server.app.get("/")
    async def root():
        return FileResponse(os.path.join(FRONTEND_ROOT_DIR, "html", "index.html"))

    @server.app.get('/servers')
    def get_servers():
        servers = database.getGameServers()
        html = ''
        for server in servers:
            color = "green" if server["status"] == "HEALTHY" else "yellow" if server["status"] == "UNHEALTHY" else "gray"
            html = html + f'''
            <tr>
                <td class="border px-4 py-2">{server['name']}</td>
                <td class="border px-4 py-2">{server['url']}</td>
                <td class="border px-4 py-2">{server['last_seen']}</td>
                <td class="border px-4 py-2">{server['player_count']}</td>
                <td class="border px-4 py-2">{server['status']}</td>
                <td class="border px-4 py-2">
                    <a class="bg-{color}-500 text-white px-4 py-2 rounded hover:bg-{color}-700" href="{server['url']}" target="_blank">Connect</a>
                </td>
            </tr>
        '''
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

    @server.app.post('/game_servers/create', status_code=201)
    async def create_game_server(game_server: GameServerDescription):
        if len(game_server.name) > 63:
            raise HTTPException(status_code=400, detail='Name should not be longer than 63 characters')
        if len(game_server.url) > 255:
            raise HTTPException(status_code=400, detail='URL should not be longer than 255 characters')

        response = database.registerGameServer(game_server.name, game_server.url)
        if not response:
            raise HTTPException(status_code=500, detail='Could not refresh game server')

        return JSONResponse(content=response, status_code=201)

    @server.app.post('/game_servers/update', status_code=201)
    async def update_game_server(game_server_update: GameServerUpdate):
        if game_server_update.name and len(game_server_update.name) > 63:
            raise HTTPException(status_code=400, detail='Name should not be longer than 63 characters')
        if game_server_update.url and len(game_server_update.url) > 255:
            raise HTTPException(status_code=400, detail='URL should not be longer than 255 characters')

        okay = database.updateGameServer(game_server_update)
        if not okay:
            raise HTTPException(status_code=500, detail='Could not refresh game server')

        return True

    @server.app.post('/game_servers/ping', status_code=200)
    async def refresh_game_server(game_server_ping: GameServerPing):
        okay = database.refreshGameServer(game_server_ping)
        if not okay:
            raise HTTPException(status_code=500, detail='Could not refresh game server')

        return True

    @server.app.post('/game_servers/delete', status_code=201)
    async def remove_game_server(game_server_credentials: GameServerCredentials):
        okay = database.unregisterGameServer(game_server_credentials)
        if not okay:
            raise HTTPException(status_code=500, detail='Could not remove game server')

        return True

    @server.app.post('/game_servers/logoff', status_code=201)
    async def logoff_game_server(game_server_credentials: GameServerCredentials):
        okay = database.logOffGameServer(game_server_credentials)
        if not okay:
            raise HTTPException(status_code=500, detail='Could not log off game server')

        return True

    @server.app.get('/game_servers', status_code=200)
    async def get_game_servers():
        game_servers = database.getGameServers()
        return JSONResponse(content=jsonable_encoder(game_servers))
