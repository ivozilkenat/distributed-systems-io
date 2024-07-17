import math
from .core import Entity, Pos
from backend.constants import X_MAX, Y_MAX

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
