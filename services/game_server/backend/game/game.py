import asyncio
import json
import os
from fastapi import FastAPI
from fastapi_socketio import SocketManager
from typing import Dict
from .core import Player
from backend.constants import STATE_UPDATE_INTERVAL, BROADCAST_INTERVAL, DATA_DIR


class Game:    
    def __init__(self, server) -> None:
        self.server = server
        self.socket_connections: Dict[str, Player] = {}
        self.projectiles: Dict[str, Player] = {}
        with open(os.path.join(DATA_DIR, "weapons.json")) as f:
            self.weapons = json.load(f)
        
    def _get_tasks(self):
        return [
            asyncio.create_task(self.update_game_state()), 
            asyncio.create_task(self.broadcast_game_state())
        ]

    def get_player_count(self):
        return len(self.socket_connections)
    
    def add_projectile(self, projectile):
        self.projectiles[projectile.uuid] = projectile

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

    def check_collisions(players) -> None:
        projectiles_to_destroy = []
        for _, projectile in self.projectiles.items():
            for _, player in players:
                if self.is_collision(player, projectile):
                    player.take_damage(projectile.damage, projectile.creator)
                    projectiles_to_destroy.append(projectile.uuid)

            for _, other_projectile in self.projectiles.items():
                if self.is_collision(projectile, other_projectile):
                    projectiles_to_destroy.append(projectile)
                    projectiles_to_destroy.append(other_projectile)

        projectiles_to_destroy = list(set(projectiles_to_destroy))
        for projectile in projectiles_to_destroy:
            del self.projectiles[projectile]

    async def update_players(self) -> None:
        connections = list(self.socket_connections.items()) # Size might change during iteration because of disconnects 

        self.check_collisions(connections)

        gameState = {
            "players": {pid: {"pos": list(p.pos), "hp": list(p.hp)} for pid, p in self.socket_connections.items()},
            "projectiles": {pid: {"pos": list(p.pos)} for pid, p in self.projectiles.items()}
        }

        for player_id, player in connections: 
            player.cooldown = max(0, player.cooldown - STATE_UPDATE_INTERVAL)

            # TODO: this is ugly, refactor
            await self.app.sio.emit("update_players", {
                "gameState": gameState,
                "canShoot": player.cooldown == 0,
                "playerId": player_id
            }, room=player_id)