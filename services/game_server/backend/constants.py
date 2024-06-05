import os
from PIL import Image

# SERVER
FRONTEND_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# GAME
X_MAX, Y_MAX = Image.open(os.path.join(FRONTEND_ROOT_DIR, "public", "map.png")).size
STATE_UPDATE_INTERVAL = 1/60
BROADCAST_INTERVAL = 1/20 #