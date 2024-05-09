from application.server import Server
from application.routing import setup_routes
from application.websocketlogic import setup_ws_handler

if __name__ == "__main__":
    server = Server()
    setup_routes(server)
    setup_ws_handler(server)
    server.run()