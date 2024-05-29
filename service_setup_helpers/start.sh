#!/bin/bash

source ../matchmaking_server/venv/bin/activate || exit
python3 ../services/matchmaking_server/main.py &
python3 ../services/game_server/main.py &
wait