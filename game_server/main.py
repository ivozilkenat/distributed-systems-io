from application.server import Server
from application.websocket_handler import setup_ws_handler

if __name__ == "__main__":
    server = Server()
    setup_ws_handler(server)
    server.run()