import requests

class HighscoresAPI:
    def __init__(self, url_base: str): 
        self.url_base = url_base

    def addHighscore(self, name: str, kills: int, seconds_alive: int):
        url = self.url_base + "/highscores"

        request = {
            "name": name,
            "kills": kills,
            "seconds_alive": seconds_alive
        }

        response = requests.post(url, json=request)

        if response.status_code == 201:
            return True
        else:
            print("Could not add highscore:", response.text)
            return False