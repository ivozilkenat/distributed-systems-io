from backend.server import Server
from backend.websocket_handler import setup_ws_handler
from backend.route_handler import setup_route_handler

if __name__ == "__main__":
    server = Server()
    setup_ws_handler(server)
    setup_route_handler(server)
    server.run()