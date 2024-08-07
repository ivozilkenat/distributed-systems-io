import os
from PIL import Image

# SERVER
FRONTEND_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# GAME
X_MAX, Y_MAX = Image.open(os.path.join(FRONTEND_ROOT_DIR, "map.png")).size
STATE_UPDATE_INTERVAL = 1/60
BROADCAST_INTERVAL = 1/20

# Ping Matchmaking Server every ten seconds
HEARTBEAT_INTERVAL = 10
PING_RETRIES = 3

# ENVIRONMENT
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "3001"))

APP_MATCHMAKING_HOST = os.getenv('APP_MATCHMAKING_HOST', "http://localhost:3000")
SERVER_NAME = os.getenv('SERVER_NAME', os.getenv('HOSTNAME', "Unbenannt"))
SERVER_URL = os.getenv('SERVER_URL', f'http://{HOST}:{PORT}/')
SERVER_ID = os.getenv('SERVER_ID')
SERVER_TOKEN = os.getenv('SERVER_TOKEN')
DEPEND_ON_MATCHMAKING = os.getenv('DEPEND_ON_MATCHMAKING', "0") != "0"
CREDENTIALS_FILE = os.getenv('CREDENTIALS_FILE', os.path.join(DATA_DIR, "credentials.json"))
