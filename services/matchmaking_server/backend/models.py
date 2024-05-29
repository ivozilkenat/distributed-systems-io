from pydantic import BaseModel

class Highscore(BaseModel):
    name: str
    kills: int
    seconds_alive: int