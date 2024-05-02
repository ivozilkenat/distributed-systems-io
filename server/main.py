from fastapi import FastAPI, WebSocket, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from typing import Dict
import os
import random

app = FastAPI()

# Static files setup
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

templates = Jinja2Templates(directory="templates")

@app.get("/")
async def root():
    return FileResponse(os.path.join(os.getcwd(), "index.html"))

# Players data structure
players: Dict[str, dict] = {}

def random_position(n):
    return random.randint(0, n)

def update_players(exclude_id=None):
    for player_id, player in players.items():
        if player_id == exclude_id:
            continue
        opponents = []
        for opponent_id, opponent in players.items():
            if player_id != opponent_id:
                dx, dy = abs(player["x"] - opponent["x"]), abs(player["y"] - opponent["y"])
                if dx <= 250 and dy <= 250:
                    opponents.append([250 + (opponent["x"] - player["x"]), 250 + (opponent["y"] - player["y"])])
        player["socket"].send_json({
            "opponents": opponents,
            "position": [player["x"], player["y"]]
        })

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player_id = id(websocket)
    players[player_id] = {"socket": websocket, "x": random_position(100), "y": random_position(100)}

    try:
        while True:
            data = await websocket.receive_json()
            if "move" in data:
                move = data["move"]
                players[player_id]["x"] += move[0]
                players[player_id]["y"] += move[1]
                players[player_id]["x"] = min(500, max(0, players[player_id]["x"]))
                players[player_id]["y"] = min(500, max(0, players[player_id]["y"]))
                update_players(player_id)
    except Exception as e:
        pass
    finally:
        del players[player_id]
        update_players()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3000)
