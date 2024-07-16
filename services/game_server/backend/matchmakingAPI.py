import json

import requests
import logging
from typing import Union
from backend.constants import HEARTBEAT_INTERVAL, SERVER_NAME, SERVER_URL, DEPEND_ON_MATCHMAKING, CREDENTIALS_FILE, PING_RETRIES
from backend.game import Game
import asyncio
import sys
import os


class MatchmakingAPI:
    def __init__(self, url_base: str, id: Union[int, None], token: Union[str, None], game: Game):
        self.url_base = url_base
        self.id = id
        self.token = token
        self.game = game
        
    def _get_tasks(self):
        return [
            asyncio.create_task(self.ping_loop())
        ]

    def post(self, path: str, request):
        try:
            return requests.post(self.url_base + path, json=request)
        except:
            return False

    def isRegistered(self):
        return (self.id is not None) and (self.token is not None)

    def registerAsNewServer(self, name: str, url: str):
        response = self.post("/game_servers/create", {
            "name": name,
            "url": url
        })

        if not response:
            print("Could not register, matchmaking server is not online")
            return False

        if response.status_code == 201:
            credentials = response.json()
            self.id = credentials["id"]
            self.token = credentials["token"]
            self.saveCredentials()
            return True
        elif response.status_code == 400:
            logging.error("Could not register: URL already taken")
            return False
        else:
            print("Could not register: ", response.status_code, response.text)
            return False

    def registerFromConstants(self):
        return self.register(SERVER_NAME, SERVER_URL)

    def loadCredentialsIfAvailable(self):
        if os.path.isfile(CREDENTIALS_FILE) and os.access(CREDENTIALS_FILE, os.R_OK):
            try:
                with open(CREDENTIALS_FILE, "r") as f:
                    credentials = json.load(f)
                    if ("id" in credentials) and ("token" in credentials):
                        self.id = credentials["id"]
                        self.token = credentials["token"]
                    else:
                        print("Invalid input file")
            except IOError as e:
                print("Could not load credentials:", e)
        else:
            print("No credentials file found")

    def saveCredentials(self):
        try:
            with open(CREDENTIALS_FILE, "w") as outfile:
                json.dump({"id": self.id, "token": self.token}, outfile)
        except IOError as e:
            print("Could not save credentials:", e)

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

        if not response:
            return False

        return response.status_code == 200

    async def ping_loop(self) -> None:
        self.loadCredentialsIfAvailable()
        if not self.registerFromConstants() and DEPEND_ON_MATCHMAKING:
            sys.exit("Exiting now because DEPEND_ON_MATCHMAKING=1")

        while self.isRegistered():
            i = 0
            while not self.ping() and i < PING_RETRIES and DEPEND_ON_MATCHMAKING:
                i = i + 1
                print(f"Ping failed [{i}/{PING_RETRIES}]")
                await asyncio.sleep(HEARTBEAT_INTERVAL)

            if i == PING_RETRIES and DEPEND_ON_MATCHMAKING:
                sys.exit("Exiting now because DEPEND_ON_MATCHMAKING=1")

            await asyncio.sleep(HEARTBEAT_INTERVAL)

    def updateGameServerProperties(self, name: str, url: str):
        if not self.isRegistered():
            return False

        response = self.post("/game_servers/update", {"name": name, "url": url})

        if not response:
            return False

        return response.status_code

    def logoff(self):
        logging.info("Logging off!")
        if not self.isRegistered():
            return True

        response = self.post("/game_servers/logoff", {"id": self.id, "token": self.token})

        if not response:
            return False

        return response.status_code == 200

    def addHighscore(self, name: str, kills: int, seconds_alive: int):
        response = self.post("/highscores", {
            "name": name,
            "kills": kills,
            "seconds_alive": seconds_alive
        })

        print(f"New Highscore: {name} got {kills} kills and was {seconds_alive} alive!")

        if not response:
            return False
        elif response.status_code == 201:
            return True
        else:
            logging.warning("Could not add highscore: " + response.text)
            return False
