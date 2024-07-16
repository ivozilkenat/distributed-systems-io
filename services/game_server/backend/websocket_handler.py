from backend.server import Server
from backend.game.core import Pos, Player, random_position
from backend.game.core import X_MAX, Y_MAX

# TODO: Maybe replace with sessions? Research required, https://python-socketio.readthedocs.io/en/latest/server.html#defining-event-handlers
# TODO: Please no magic numbers everywhere
# TODO: Please use more descriptive variable names
# TODO: How do we do maths? @ivo has math lib if needed (for basic vector operations)

def setup_ws_handler(server: Server):

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
    async def client_side_receive_msg(sid, _):
        server.game.socket_connections[sid] = Player(server.game, Pos(random_position(X_MAX), random_position(Y_MAX)))
        server.matchmaking_api.ping()
        await server.game.update_players()