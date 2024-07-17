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
        self.uuid = self.generate_uuid()

    def is_in_range_of(self, other, range) -> bool:
        return self.pos.distance_to(other.pos) <= range
    
    def is_collision(self, other) -> bool:
        return self.pos.distance_to(other.pos) <= self.hitbox_radius + other.hitbox_radius
    
    def generate_uuid(self):
        integer_part, fractional_part = str(time.time()).split('.')
        return integer_part[-3:] + fractional_part[:3] + str(random.randint(0, 1000))

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
    
    def destroy(self):
        self.creator.game.destroy_projectile(self)
