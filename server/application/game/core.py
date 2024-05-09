# Constants (dont work as static variables)
X_MAX = 500
Y_MAX = 500
STATE_UPDATE_INTERVAL = 1/60
BROADCAST_INTERVAL = 1/10

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