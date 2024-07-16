import os
from PIL import Image

# SERVER
FRONTEND_ROOT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

# ENVIRONMENT
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "3000"))
