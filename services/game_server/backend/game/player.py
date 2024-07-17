import datetime
from .core import Entity, Pos, get_random_position
from .projectile import Projectile
import time
import random
import math
from backend.constants import X_MAX, Y_MAX

class Player (Entity):
    def __init__(self, game, pos: Pos, sid,  hp: int = 100) -> None:
        super().__init__(pos)
        self.game = game
        self.hp = hp
        self.name = "Player #" + str(random.randint(0, 1000))
        self.kills = 0
        self.last_respawned_at = datetime.datetime.now()
        self.equipped_weapon = "Pistol"
        self.cooldown = 0
        self.currentmove = 0
        self.maxmove = 12
        self.speed = 3
        self.uuid = sid

    def move(self, update):
        dx, dy = update
        dx, dy = dx * self.speed, dy * self.speed
        self.currentmove += math.sqrt(dx ** 2 + dy ** 2)
        if self.currentmove > self.maxmove:
            return
        self.pos.x += dx
        self.pos.y += dy
        self.pos.x = min(X_MAX, max(0, self.pos.x))
        self.pos.y = min(Y_MAX, max(0, self.pos.y))

    def is_in_visual_range_of(self, other) -> bool:
        dx, dy = self.pos.x_distance_to(other.pos), self.pos.y_distance_to(other.pos)
        return dx <= X_MAX / 2 and dy <= Y_MAX / 2
    
    def respawn_and_get_survival_time(self) -> datetime:
        now = datetime.datetime.now()
        delta = now - self.last_respawned_at
        self.last_respawned_at = now
        self.kills = 0
        self.hp = 100
        self.pos = get_random_position()
        return delta
    
    def take_damage(self, damage, source):
        self.hp -= damage
        if self.hp <= 0:
            if type(source) == Player:
                self.killed_by(source)
            seconds_alive = self.respawn_and_get_survival_time()
            self.on_death(seconds_alive)

    def killed(self, victim):
        if self != victim:
            self.kills += 1
            if self.kills in [3, 5, 8, 10, 15]:
                self.game.register_event("killstreak", {"player": self.uuid, "kills": self.kills})

        print(f"{self.name} sent {victim.name} to the shadow realm!")
    
    def killed_by(self, killer):
        self.game.register_event("kills", {"killer": killer.uuid, "victim": self.uuid})
        killer.killed(self)

    def on_death(self, seconds_alive):
        self.game.server.matchmaking_api.addHighscore(self.name, self.kills, seconds_alive)
    
    def shoot(self, angle):
        # emit a projectile into the angle, starting next to the player
        weapon = self.game.weapons[self.equipped_weapon]
        self.cooldown = weapon["cooldown"]
        distance = 50
        new_pos = Pos(self.pos.x + distance * math.cos(angle), self.pos.y + distance * math.sin(angle))
        new_projectile = Projectile(new_pos, angle, weapon["speed"], weapon["damage"], weapon["range"], self)
        self.game.add_projectile(new_projectile)