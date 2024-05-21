#!/bin/bash

. ./matchmaking_server/venv/bin/activate && python3 ./matchmaking_server/main.py &
python3 ./game_server/main.py &
