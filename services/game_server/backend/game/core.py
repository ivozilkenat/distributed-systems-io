import time
import random
import math

from backend.constants import X_MAX, Y_MAX

def random_position(n):
    return random.randint(0, n) # TODO: magic number

def get_random_position():
    return Pos(random_position(X_MAX), random_position(Y_MAX))


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
    
    def distance_to_line(self, origin, angle):
        # Calculate the slope of the line
        m = math.tan(angle)
        # Calculate the distance using the formula
        distance = abs(-m * self.x + self.y + -origin.y + m * origin.x) / math.sqrt(m ** 2 + 1)
        return distance

class Entity:
    def __init__(self, pos: Pos) -> None:
        self.pos = pos
        self.hitbox_radius : int = 25

    def is_in_range_of(self, other, range) -> bool:
        return self.pos.distance_to(other.pos) <= range
    
    def is_collision(self, other) -> bool:
        return self.pos.distance_to(other.pos) <= self.hitbox_radius + other.hitbox_radius

class Projectile (Entity):
    def __init__(self, pos: Pos, angle: float, speed: float, damage, creator) -> None:
        super().__init__(pos)
        self.angle = angle
        self.speed = speed
        self.hitbox_radius = 5
        self.damage = damage
        self.creator = creator
        self.uuid = self.generate_uuid()

    def move(self):
        self.pos.x += self.speed * math.cos(self.angle)
        self.pos.y += self.speed * math.sin(self.angle)

    def generate_uuid(self):
        integer_part, fractional_part = str(time.time()).split('.')
        return integer_part[-3:] + fractional_part[:3] + str(random.randint(0, 1000))

class Player (Entity):
    def __init__(self, game, pos: Pos, hp: int = 100) -> None:
        super().__init__(pos)
        self.game = game
        self.hp = hp
        self.name = "Player #" + str(random.randint(0, 1000))
        self.kills = 0
        self.last_respawned_at = datetime.datetime.now()
        self.equipped_weapon = "Pistol"
        self.cooldown = 0

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
        self.kills += 1
        print(f"{self.name} sent {victim.name} to the shadow realm!")
        # TODO communicate kill to frontend
    
    def killed_by(self, killer):
        killer.killed(self)

    def on_death(self, seconds_alive):
        self.game.server.matchmaking_api.addHighscore(self.name, self.kills, seconds_alive)
        # TODO communicate death to frontend
    
    def shoot(self, angle):
        # emit a projectile into the angle, starting next to the player
        weapon = self.game.weapons[self.equipped_weapon]
        new_pos = Pos(self.pos.x + math.cos(angle), self.pos.y + math.sin(angle))
        new_projectile = Projectile(new_pos, angle, weapon.speed, weapon.damage, self)
        self.game.add_projectile(new_projectile)
