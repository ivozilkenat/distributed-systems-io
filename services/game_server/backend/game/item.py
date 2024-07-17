import random

from .player import Player
from .core import Entity, Pos
from backend.constants import X_MAX, Y_MAX

class SpeedBoostItem(Entity):
    def __init__(self) -> None:
        super().__init__(Pos(0,0))
        self.item_type = "speed"
    def on_collision(self, player: Player):
        player.increase_speed_by(1)
        print("Speed: " + str(player._speed))
        

class DamageItem(Entity):
    def __init__(self) -> None:
        super().__init__(Pos(0,0))
        self.item_type = "damage"
        
    def on_collision(self, player: Player):
        player.hp = max(player.hp - 1, 1)
    
        print("HP: " + str(player.hp))
        
        
class WeaponItem(Entity):
    def __init__(self, weapon_type) -> None:
        super().__init__(Pos(0,0))
        self.item_type = "weapon"
        self.weapon_type = weapon_type
        
    def on_collision(self, player: Player):
        player.equipped_weapon = self.weapon_type
        print("Weapon: " + str(self.weapon_type))
        
def spawn_randomly(entity: Entity):
    x_position = random.randint(0, X_MAX)
    y_position = random.randint(0, Y_MAX)
    entity.pos.x = x_position
    entity.pos.y = y_position