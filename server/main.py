from application.server import Server
from application.route_handler import setup_route_handler
from application.websocket_handler import setup_ws_handler

if __name__ == "__main__":
    server = Server()
    setup_route_handler(server)
    setup_ws_handler(server)
    server.run()