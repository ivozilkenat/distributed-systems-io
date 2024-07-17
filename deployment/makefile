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
deploy: rm-all purge-data pull-images start-all

deploy-local: rm-all purge-data assure-registry provide-images start-all

start-all: start-core-services add-lobby

rm-all: rm-lobbies rm-core-services

provide-images: provide-database-image provide-matchmaking-image provide-game-image
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

assure-registry:
	docker stack deploy -c ./local_registry/docker-compose.yml registry

provide-database-image:
	docker build --tag "127.0.0.1:5000/database" ../services/database
	docker push "127.0.0.1:5000/database"

provide-matchmaking-image:
	docker build --tag "127.0.0.1:5000/matchmaking" ../services/matchmaking_server
	docker push "127.0.0.1:5000/matchmaking"

provide-game-image:
	docker build --tag "127.0.0.1:5000/game" ../services/game_server
	docker push "127.0.0.1:5000/game"

purge-data:
	@echo "Waiting 5s for stack to be deleted so we can remove the volume"
	@sleep 5s
	-docker volume rm core_services_database