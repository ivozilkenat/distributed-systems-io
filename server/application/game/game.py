import asyncio
from fastapi import FastAPI
from fastapi_socketio import SocketManager
from typing import Dict
from .core import Player
from .core import X_MAX, Y_MAX, STATE_UPDATE_INTERVAL, BROADCAST_INTERVAL


class Game:    
    def __init__(self, app) -> None:
        self.app: FastAPI = app
        self.socket_connections: Dict[str, Player] = {}
        
    def _get_game_tasks(self):
        return [
            asyncio.create_task(self.update_game_state()), 
            asyncio.create_task(self.broadcast_game_state())
        ]

    async def update_game_state(self) -> None:
        while True:
            # Logic to update the game state
            # For example, update player positions, check for collisions, etc.
            
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            print("Updating game state")
            await asyncio.sleep(STATE_UPDATE_INTERVAL)
            
    async def broadcast_game_state(self) -> None:
        while True:
            # Logic to broadcast the game state to all connected clients
            
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            print("Broadcasting game state")
            await asyncio.sleep(BROADCAST_INTERVAL)

    async def update_players(self, exclude_id=None) -> None:
        for player_id, player in self.socket_connections.items(): # TODO: size might change during iteration because of disconnects (copy?)
            if player_id == exclude_id:
                continue
            opponent_positions = []
            for opponent_id, opponent in self.socket_connections.items():
                if player_id != opponent_id:
                    if (player.is_in_range_of(opponent)):
                        opponent_positions.append(
                            [X_MAX / 2 + (opponent.pos.x - player.pos.x), Y_MAX / 2 + (opponent.pos.y - player.pos.y)])

            await self.app.sio.emit("update_players", {
                "players": opponent_positions,
                "newpos": list(player.pos),
                "newHP": player.hp
            }, room=player_id)