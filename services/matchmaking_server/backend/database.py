import os
import mysql.connector
from backend.models import GameServerCredentials, GameServerUpdate, GameServerPing
from fastapi import HTTPException


class Database:
    def __init__(self):
        self.db = False

    def assureConnection(self):
        if self.db and self.db.is_connected():
            return True
        else:
            return self.connect()

    def connect(self):
        database_host = os.getenv('APP_DATABASE_HOST', 'localhost')
        database_user = os.getenv('MYSQL_USER', 'dsio')
        database_pass = os.getenv('MYSQL_PASSWORD', 'dsio')
        database_name = os.getenv('MYSQL_DATABASE', 'dsio')

        try:
            self.db = mysql.connector.connect(
                host=database_host,
                user=database_user,
                password=database_pass,
                database=database_name
            )
            return True
        except mysql.connector.errors.DatabaseError:
            print("Could not connect to database! Database functions will not be available")
            return False

    def getHighscores(self):
        if not self.assureConnection():
            return []

        cursor = self.db.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, kills, seconds_alive, ((kills * 60) / seconds_alive) AS kills_per_minute, timestamp FROM dsio_highscores ORDER BY kills DESC LIMIT 5")
        return cursor.fetchall()

    def addHighscore(self, name, kills, seconds_alive):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        cursor.execute("INSERT INTO dsio_highscores (name, kills, seconds_alive) VALUES (%s, %s, %s)",
                       (name, kills, seconds_alive))
        self.db.commit()

        return True

    def registerGameServer(self, name: str, url: str):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        try:
            cursor.execute("INSERT INTO dsio_game_servers (name, url) VALUES (%s, %s)", (name, url))
            self.db.commit()
        except mysql.connector.errors.IntegrityError:
            raise HTTPException(status_code=400, detail='The url is not available')

        id = cursor.lastrowid
        cursor.execute("SELECT token FROM dsio_game_servers WHERE id = %s", (id,))
        token = cursor.fetchone()[0]
        return {"id": id, "token": token}

    def unregisterGameServer(self, credentials: GameServerCredentials):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        cursor.execute("DELETE FROM dsio_game_servers WHERE id = %s AND token = %s",
                       (credentials.id, credentials.token))
        self.db.commit()

        return True

    def logOffGameServer(self, credentials: GameServerCredentials):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE dsio_game_servers SET should_be_online = 0, last_seen = CURRENT_TIMESTAMP(), player_count = 0 WHERE id = %s AND token = %s",
            (credentials.id, credentials.token))
        self.db.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Id/token combination not found')

        return True

    def updateGameServer(self, update: GameServerUpdate):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        try:
            cursor.execute("""UPDATE dsio_game_servers
                SET name = %s, url = %s, last_seen = CURRENT_TIMESTAMP()
                WHERE id = %s AND token = %s""", (update.name, update.url, update.id, update.token))
        except mysql.connector.errors.IntegrityError:
            raise HTTPException(status_code=400, detail='The url is not available')

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Id/token combination not found')

        self.db.commit()
        return True

    def refreshGameServer(self, ping: GameServerPing):
        if not self.assureConnection():
            return False

        cursor = self.db.cursor()
        cursor.execute(
            "UPDATE dsio_game_servers SET player_count = %s, should_be_online = 1, last_seen = CURRENT_TIMESTAMP() WHERE id = %s AND token = %s",
            (ping.player_count, ping.id, ping.token))
        self.db.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Id/token combination not found')

        return True

    def getGameServers(self):
        if not self.assureConnection():
            return []

        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM dsio_game_servers_status")
        return cursor.fetchall()
