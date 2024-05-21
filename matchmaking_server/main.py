from application.server import Server
from application.route_handler import setup_route_handler

if __name__ == "__main__":
    server = Server()
    setup_route_handler(server)
    server.run()