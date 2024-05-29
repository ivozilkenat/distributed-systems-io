from backend.server import Server
from backend.highscores_api import HighscoresAPI
from backend.game import Game
from backend.game.core import Pos, Player, random_position
from backend.game.core import X_MAX, Y_MAX

# TODO: Maybe replace with sessions? Research required, https://python-socketio.readthedocs.io/en/latest/server.html#defining-event-handlers
# TODO: Please no magic numbers everywhere
# TODO: Please use more descriptive variable names
# TODO: How do we do maths? @ivo has math lib if needed (for basic vector operations)

def setup_ws_handler(server: Server, highscores_api: HighscoresAPI):

    @server.app.sio.on("player_move")
    async def player_move(sid, update):
        player = server.game.socket_connections[sid]
        player.pos.x += update[0]
        player.pos.y += update[1]
        
        # Prevent player from going out of bounds
        # TODO: Canvas size is needed as constant? -> how to properly change these magic numbers everywhere?
        player.pos.x = min(X_MAX, max(0, player.pos.x))
        player.pos.y = min(Y_MAX, max(0, player.pos.y))
       #  await server.game.update_players() #<- done by game


    @server.app.sio.on("player_click")
    async def player_shoot(sid, angle):
        player = server.game.socket_connections[sid]
        if player.cooldown == 0:
            player.shoot(angle)

    @server.app.sio.on('connect')
    async def client_side_receive_msg(sid, env):
        server.game.socket_connections[sid] = Player(Pos(random_position(X_MAX), random_position(Y_MAX)))
        await server.game.update_players()


    @server.app.sio.on('disconnect')
    async def client_side_receive_msg(sid):
        del server.game.socket_connections[sid]
        await server.game.update_players()

    # TODO call this when the player gets killed
    def on_player_killed(sid, player: Player):
        name = player.name
        kills = player.kills
        survival_time = player.respawn_and_get_survival_time()
        seconds_alive = survival_time.total_seconds()

        highscores_api.addHighscore(name, kills, seconds_alive)
