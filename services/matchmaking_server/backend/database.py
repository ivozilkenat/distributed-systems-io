import os
import mysql.connector 

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
        cursor.execute("SELECT id, name, kills, seconds_alive, ((kills * 60) / seconds_alive) AS kills_per_minute, timestamp FROM dsio_highscores ORDER BY kills DESC LIMIT 5")
        return cursor.fetchall()
    
    def addHighscore(self, name, kills, seconds_alive):
        if not self.assureConnection():
            return False
        
        cursor = self.db.cursor()
        cursor.execute("INSERT INTO dsio_highscores (name, kills, seconds_alive) VALUES (%s, %s, %s)", (name, kills, seconds_alive))
        self.db.commit()

        return True