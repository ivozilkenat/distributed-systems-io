import os
from PIL import Image

# SERVER
CLIENT_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "client")

# GAME
X_MAX, Y_MAX = Image.open(os.path.join(CLIENT_ROOT_DIR, "assets", "map.png")).size
STATE_UPDATE_INTERVAL = 1/60
BROADCAST_INTERVAL = 1/20 #1/10