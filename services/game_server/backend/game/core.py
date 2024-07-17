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