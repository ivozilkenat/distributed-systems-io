from application.server import server, Game, Player, Pos
from typing import Dict
from collections import namedtuple
import random
import asyncio

# TODO: Maybe replace with sessions? Research required, https://python-socketio.readthedocs.io/en/latest/server.html#defining-event-handlers
# TODO: Please no magic numbers everywhere
# TODO: Please use more descriptive variable names
# TODO: How do we do maths? @ivo has math lib if needed (for basic vector operations)



def random_position(n):
    return random.randint(0, n)

@server.app.sio.on("player_move")
async def player_move(sid, update):
    player = server.game.socket_connections[sid]
    player.pos.x += update[0]
    player.pos.y += update[1]
    
    # Prevent player from going out of bounds
    player.pos.x = min(Game.X_MAX, max(0, player.pos.x))
    player.pos.y = min(Game.Y_MAX, max(0, player.pos.y))
    await server.game.update_players()


@server.app.sio.on('connect')
async def client_side_receive_msg(sid, env):
    server.game.socket_connections[sid] = Player(Pos(random_position(Game.X_MAX), random_position(Game.Y_MAX)))
    await server.game.update_players()


@server.app.sio.on('disconnect')
async def client_side_receive_msg(sid):
    del server.game.socket_connections[sid]
    await server.game.update_players()
