import random
import os
from application.constants import X_MAX, Y_MAX

def random_position(n):
    return random.randint(0, n) # TODO: magic number


class Pos:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        
    def __iter__(self):
        return iter([self.x, self.y])


class Player:
    def __init__(self, pos: Pos, hp: int = 100) -> None:
        self.pos = pos
        self.hp = hp

    def is_in_range_of(self, other) -> bool:
        dx, dy = abs(self.pos.x - other.pos.x), abs(self.pos.y - other.pos.y)
        return dx <= X_MAX / 2 and dy <= Y_MAX / 2