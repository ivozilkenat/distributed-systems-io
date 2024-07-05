import requests
import logging
from typing import Union
from backend.constants import HEARTBEAT_INTERVAL, SERVER_NAME, SERVER_URL
from backend.game import Game
import asyncio


class MatchmakingAPI:
    def __init__(self, url_base: str, id: Union[int, None], token: Union[str, None], game: Game):
        self.url_base = url_base
        self.id = id
        self.token = token
        self.game = game

    def post(self, path: str, request):
        return requests.post(self.url_base + path, json=request)

    def isRegistered(self):
        return (self.id is not None) and (self.token is not None)

    def registerAsNewServer(self, name: str, url: str):
        response = self.post("/game_servers/create", {
            "name": name,
            "url": url
        })

        if response.status_code == 201:
            credentials = response.json()
            self.id = credentials["id"]
            self.token = credentials["token"]
            return True
        elif response.status_code == 400:
            logging.error("Could not register: URL already taken")
            return False
        else:
            print("Could not register: ", response.status_code, response.text)
            return False

    def registerFromConstants(self):
        return self.register(SERVER_NAME, SERVER_URL)

    def register(self, name: str, url: str):
        if self.isRegistered():
            updateCode = self.updateGameServerProperties(name, url)
            if updateCode == 201:
                logging.info("Successfully re-registered!")
                return True
            elif updateCode == 400:
                logging.error("Could not re-register: URL already taken")
                self.id = None
                self.token = None
                return False
            elif updateCode == 404:
                logging.warning("Registering with provided id and token failed: Not found.")
            else:
                logging.error("Could not register with provided id and token: " + str(updateCode))

        logging.info("Registering as a new server!")
        if not self.registerAsNewServer(name, url):
            self.id = None
            self.token = None
            return False

        return True

    def ping(self):
        if not self.isRegistered():
            return False

        response = self.post("/game_servers/ping",
                             {"id": self.id, "token": self.token, "player_count": self.game.get_player_count()})
        return response.status_code == 200

    async def ping_loop(self) -> None:
        self.registerFromConstants()

        while self.isRegistered():
            if not self.ping():
                print("Ping failed [1/3]")
                if not self.ping():
                    print("Ping failed [2/3]")
                    if not self.ping():
                        print("Ping failed [3/3]; stopping now")
            await asyncio.sleep(HEARTBEAT_INTERVAL)

    def updateGameServerProperties(self, name: str, url: str):
        if not self.isRegistered():
            return False

        response = self.post("/game_servers/update", {"name": name, "url": url})

        return response.status_code

    def logoff(self):
        logging.info("Logging off!")
        if not self.isRegistered():
            return True

        response = self.post("/game_servers/logoff", {"id": self.id, "token": self.token})

        return response.status_code == 200

    def addHighscore(self, name: str, kills: int, seconds_alive: int):
        response = self.post("/highscores", {
            "name": name,
            "kills": kills,
            "seconds_alive": seconds_alive
        })

        if response.status_code == 201:
            return True
        else:
            logging.warning("Could not add highscore: " + response.text)
            return False
