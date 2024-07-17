from pydantic import BaseModel


class Highscore(BaseModel):
    name: str
    kills: int
    seconds_alive: int


class GameServerDescription(BaseModel):
    name: str
    url: str


class GameServerCredentials(BaseModel):
    id: int
    token: str


class GameServerPing(GameServerCredentials):
    player_count: int


class GameServerUpdate(GameServerDescription, GameServerCredentials):
    pass
