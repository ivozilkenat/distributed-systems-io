import datetime
import random
import os
import math
import json

from backend.constants import X_MAX, Y_MAX

def random_position(n):
    return random.randint(0, n) # TODO: magic number


class Pos:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        
    def __iter__(self):
        return iter([self.x, self.y])
    
    def distance_to(self, other):
        dx, dy = self.x_distance_to(other), self.y_distance_to(other)
        return math.sqrt(dx ** 2 + dy ** 2)
    
    def x_distance_to(self, other):
        return abs(self.x - other.x)
    
    def y_distance_to(self, other):
        return abs(self.y - other.y)


class Player:
    def __init__(self, game, pos: Pos, hp: int = 100) -> None:
        self.game = game
        self.pos = pos
        self.hp = hp
        self.name = "Player #" + str(random.randint(0, 1000))
        self.kills = 0
        self.last_respawned_at = datetime.datetime.now()
        self.equipped_weapon = "Pistol"
        self.cooldown = 0
        self.hitbox_radius = 25

    def is_in_range_of(self, other, range) -> bool:
        return self.pos.distance_to(other.pos) <= range
    
    def is_in_visual_range_of(self, other) -> bool:
        dx, dy = self.pos.x_distance_to(other.pos), self.pos.y_distance_to(other.pos)
        return dx <= X_MAX / 2 and dy <= Y_MAX / 2
    
    def respawn_and_get_survival_time(self) -> datetime:
        now = datetime.datetime.now()
        delta = now - self.last_respawned_at
        self.last_respawned_at = now
        self.kills = 0
        self.hp = 100
        # TODO: respawn player at random position
        return delta
    
    def is_hit_by(self, origin, angle) -> bool:
        return abs(math.cos(angle) * (origin.y_distance_to(self.pos))) - math.sin(angle) * (origin.x_distance_to(self.pos)) <= self.hitbox_radius
 
    def take_damage(self, damage, source):
        self.hp -= damage
        if self.hp <= 0:
            if type(source) == Player:
                self.killed_by(source)
            self.respawn_and_get_survival_time()

    def killed(self, victim):
        self.kills += 1
        print(f"{self.name} sent {victim.name} to the shadow realm!")
        # TODO communicate kill to frontend
    
    def killed_by(self, killer):
        killer.killed(self)
        # TODO communicate death to frontend

    def shoot(self, angle):
        if self.cooldown > 0:
            return
        weapon = self.game.weapons[self.equipped_weapon]
        hit_enemy = None
        for _, enemy in self.game.socket_connections.items():
            if enemy == self:
                continue
            if self.is_in_range_of(enemy, weapon['range']) & enemy.is_hit_by(self.pos, angle):
                if hit_enemy is None or self.pos.distance_to(enemy.pos) < self.pos.distance_to(hit_enemy.pos):
                    hit_enemy = enemy
        damage = weapon["damage"]
        if hit_enemy != None:
            print(f"{self.name} touched {hit_enemy.name} in their no-no square.")
            hit_enemy.take_damage(damage, self)
    