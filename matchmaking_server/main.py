from application.server import Server
from application.database import Database
from application.route_handler import setup_route_handler

if __name__ == "__main__":
    server = Server()
    database = Database()
    setup_route_handler(server, database)
    server.run()