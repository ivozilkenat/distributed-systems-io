import asyncio
from fastapi import FastAPI
from fastapi_socketio import SocketManager
from typing import Dict
from .core import Player
from application.constants import STATE_UPDATE_INTERVAL, BROADCAST_INTERVAL


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
            #print("Updating game state")
            await asyncio.sleep(STATE_UPDATE_INTERVAL)
            
    async def broadcast_game_state(self) -> None:
        while True:
            # Logic to broadcast the game state to all connected clients
            
            await self.update_players()
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            #print("Broadcasting game state")
            await asyncio.sleep(BROADCAST_INTERVAL)

    async def update_players(self, exclude_id=None) -> None:
        connections = list(self.socket_connections.items()) # Size might change during iteration because of disconnects 
        for player_id, player in connections: 
            if player_id == exclude_id:
                continue
            enemy_positions = {}
            for opponent_id, opponent in connections:
                if player_id == opponent_id:
                    continue
                if (player.is_in_range_of(opponent) or True): # TODO: currently always true for smooth interpolation (find different range metric, like max distance in one update on top)
                    enemy_positions[opponent_id] = list(opponent.pos) # Id necessary for frontend to identify players (this is very ugly right now, refactor later)
                        

            # TODO: this is ugly, refactor
            await self.app.sio.emit("update_players", {
                "enemies": enemy_positions,
                "newpos": list(player.pos),
                "newHP": player.hp
            }, room=player_id)