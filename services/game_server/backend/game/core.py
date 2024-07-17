import time
import datetime
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
    def __init__(self, pos: Pos, angle: float, speed: float, damage, maxrange, creator) -> None:
        super().__init__(pos)
        self.angle = angle
        self.speed = speed
        self.hitbox_radius = 5
        self.damage = damage
        self.creator = creator
        self.maxrange = maxrange
        self.traveltime = 0
        self.uuid = self.generate_uuid()

    def move(self):
        newpos = Pos(self.pos.x + self.speed * math.cos(self.angle), self.pos.y + self.speed * math.sin(self.angle))
        
        i = 0
        while self.collides_with_bounds(newpos):
            self.adjust_angle(newpos)
            newpos = Pos(self.pos.x + self.speed * math.cos(self.angle), self.pos.y + self.speed * math.sin(self.angle))
            i += 1
            if i > 10:
                self.destroy()
                break
            
        self.pos = newpos

        self.traveltime += self.speed
        if self.traveltime >= self.maxrange:
            self.destroy()

    def adjust_angle(self, newpos):
        # calculate angle of incidence if projectile hits a wall
        if newpos.x < 0 or newpos.x > X_MAX:
            self.angle = math.pi - self.angle
        if newpos.y < 0 or newpos.y > Y_MAX:
            self.angle = -self.angle
        
    def collides_with_bounds(self, newpos):
        return newpos.x < 0 or newpos.x > X_MAX or newpos.y < 0 or newpos.y > Y_MAX
    
    def reset_to_in_bounds(self):
        if self.pos.x < 0:
            self.pos.x = 0
        elif self.pos.x > X_MAX:
            self.pos.x = X_MAX
        if self.pos.y < 0:
            self.pos.y = 0
        elif self.pos.y > Y_MAX:
            self.pos.y = Y_MAX

    def generate_uuid(self):
        integer_part, fractional_part = str(time.time()).split('.')
        return integer_part[-3:] + fractional_part[:3] + str(random.randint(0, 1000))
    
    def destroy(self):
        self.creator.game.destroy_projectile(self)

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
        self.currentmove = 0
        self.maxmove = 12
        self.speed = 3

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
        self.cooldown = weapon["cooldown"]
        distance = 50
        new_pos = Pos(self.pos.x + distance * math.cos(angle), self.pos.y + distance * math.sin(angle))
        new_projectile = Projectile(new_pos, angle, weapon["speed"], weapon["damage"], weapon["range"], self)
        self.game.add_projectile(new_projectile)