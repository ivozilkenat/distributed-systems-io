from backend.server import Server
from backend.highscores_api import HighscoresAPI
from backend.websocket_handler import setup_ws_handler
from backend.route_handler import setup_route_handler

if __name__ == "__main__":
    server = Server()
    highscores_api = HighscoresAPI("http://localhost:3000") # TODO This is the matchmaking_server
    setup_ws_handler(server, highscores_api)
    setup_route_handler(server)
    server.run()