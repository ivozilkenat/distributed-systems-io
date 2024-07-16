import asyncio
import json
import os
from typing import Dict
from .core import Player
from backend.constants import STATE_UPDATE_INTERVAL, BROADCAST_INTERVAL, DATA_DIR


class Game:    
    def __init__(self, server) -> None:
        self.server = server
        self.socket_connections: Dict[str, Player] = {}
        with open(os.path.join(DATA_DIR, "weapons.json")) as f:
            self.weapons = json.load(f)
        
    def _get_tasks(self):
        return [
            asyncio.create_task(self.update_game_state()), 
            asyncio.create_task(self.broadcast_game_state())
        ]

    def get_player_count(self):
        return len(self.socket_connections)

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
        
        await self.broadcast_leaderboard()
        for player_id, player in connections: 
            if player_id == exclude_id:
                continue
            enemy_positions = {}
            enemy_health = {}
            for opponent_id, opponent in connections:
                if player_id == opponent_id:
                    continue
                if (player.is_in_visual_range_of(opponent) or True): # TODO: currently always true for smooth interpolation (find different range metric, like max distance in one update on top)
                    enemy_positions[opponent_id] = list(opponent.pos) # Id necessary for frontend to identify players (this is very ugly right now, refactor later)
                    enemy_health[opponent_id] = opponent.hp
                        
            player.cooldown = max(0, player.cooldown - STATE_UPDATE_INTERVAL)

            # TODO: this is ugly, refactor
            await self.server.app.sio.emit("update_players", {
                "enemies": enemy_positions,
                "enemyHealth": enemy_health,
                "newpos": list(player.pos),
                "newHP": player.hp,
                "canShoot": player.cooldown == 0,
            }, room=player_id)


    async def broadcast_leaderboard(self) -> None:
        connections = list(self.socket_connections.items())
        leaderboard = {player_id: player.kills for player_id, player in connections}
        sorted_leaderboard = sorted(leaderboard.items(), key=lambda item: item[1], reverse=True)
        for player_id, player in connections:
            await self.server.app.sio.emit("current_leaderboard", {
                "leaderboard": sorted_leaderboard,
            }, room=player_id)