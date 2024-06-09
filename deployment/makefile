# Makefile to run Ansible playbooks

.PHONY: deploy add_lobby
include .env

# Define the playbook files
DEPLOY_PLAYBOOK := start_core_services.yml
RM_PLAYBOOK := rm_core_services.yml
ADD_LOBBY_PLAYBOOK := add_game_lobby.yml
RM_GAME_LOBBIES_PLAYBOOK := rm_game_lobbies.yml

# Default value for lobby_id
lobby_id := test

# === DEPLOYMENT ===
deploy: rm-all pull-images start-all

start-all: start-core-services add-lobby

rm-all: rm-lobbies rm-core-services
# ==================

start-core-services:
	@dotenv ansible-playbook $(DEPLOY_PLAYBOOK)

rm-core-services:
	@dotenv ansible-playbook $(RM_PLAYBOOK)

add-lobby:
	@dotenv ansible-playbook $(ADD_LOBBY_PLAYBOOK) -e "lobby_id=$(lobby_id)"

rm-lobbies:
	@dotenv ansible-playbook $(RM_GAME_LOBBIES_PLAYBOOK)

pull-images:
	@docker compose pull
