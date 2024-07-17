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
        self.projectiles_to_destroy = []
        self.reset_events()
        with open(os.path.join(DATA_DIR, "weapons.json")) as f:
            self.weapons = json.load(f)
        
    def reset_events(self):
        self.latest_events = []
    
    def register_event(self, event_type, event_data):
        self.latest_events.append({
            "event_type": event_type,
            "event_data": event_data
        })

    def _get_tasks(self):
        return [
            asyncio.create_task(self.update_game_state()), 
            asyncio.create_task(self.broadcast_game_state())
        ]

    def get_player_count(self):
        return len(self.socket_connections)
    
    def add_projectile(self, projectile):
        self.projectiles[projectile.uuid] = projectile

    def destroy_projectile(self, projectile):
        self.projectiles_to_destroy.append(projectile.uuid)

    def destroy_projectiles(self):
        self.projectiles_to_destroy = list(set(self.projectiles_to_destroy))
       
        for projectile in self.projectiles_to_destroy:
            del self.projectiles[projectile]

        self.projectiles_to_destroy = []

    async def update_game_state(self) -> None:
        while True:
            connections = list(self.socket_connections.items()) # Size might change during iteration because of disconnects 

            # Logic to update the game state
            # For example, update player positions, check for collisions, etc.
            
            self.move_projectiles()

            self.check_collisions(connections)

            for _, player in connections:
                player.cooldown = max(0, player.cooldown - STATE_UPDATE_INTERVAL)
                player.currentmove = 0
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            # print("Updating game state")
            await asyncio.sleep(STATE_UPDATE_INTERVAL)
            
    async def broadcast_game_state(self) -> None:
        while True:
            # Logic to broadcast the game state to all connected clients
            
            await self.update_players()
            
            # Run this update at fixed intervals (e.g., 60 times per second)
            #print("Broadcasting game state")
            await asyncio.sleep(BROADCAST_INTERVAL)

    def move_projectiles(self) -> None:
        for _, projectile in self.projectiles.items():
            projectile.move()
        

    def check_collisions(self, players) -> None:
        for _, projectile in self.projectiles.items():
            for _, player in players:
                if player.is_collision(projectile):
                    player.take_damage(projectile.damage, projectile.creator)
                    projectile.destroy()

            for _, other_projectile in self.projectiles.items():
                if projectile.uuid == other_projectile.uuid:
                    continue
                if projectile.is_collision(other_projectile):
                    projectile.destroy()
                    other_projectile.destroy()

        self.destroy_projectiles()
        

    async def update_players(self) -> None:
        connections = list(self.socket_connections.items()) # Size might change during iteration because of disconnects 
        
        await self.broadcast_leaderboard()

        gameState = {
            "players": {pid: {"pos": list(p.pos), "hp": p.hp, "name": p.name} for pid, p in self.socket_connections.items()},
            "projectiles": {pid: {"pos": list(p.pos)} for pid, p in self.projectiles.items()}
        }

        for player_id, player in connections: 
            await self.server.app.sio.emit("update_players", {
                "gameState": gameState,
                "canShoot": player.cooldown <= 0,
                "playerId": player_id,
                "events": self.latest_events
            }, room=player_id)

        self.reset_events()

    async def broadcast_leaderboard(self) -> None:
        connections = list(self.socket_connections.items())
        leaderboard = {player_id: player.kills for player_id, player in connections}
        sorted_leaderboard = sorted(leaderboard.items(), key=lambda item: item[1], reverse=True)
        for player_id, player in connections:
            await self.server.app.sio.emit("current_leaderboard", {
                "leaderboard": sorted_leaderboard,
                "playerId": player_id
            }, room=player_id)