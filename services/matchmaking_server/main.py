from backend.server import Server
from backend.database import Database
from backend.route_handler import setup_route_handler

if __name__ == "__main__":
    server = Server()
    database = Database()
    setup_route_handler(server, database)
    server.run()