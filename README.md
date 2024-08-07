# Distributed-Systems-IO

---

## Deployment

### Production - *Automatic*
- Push to branch `main`
  - Wait for action to build package & web server to run container
- View at [https://distr-sys-io.ivo-zilkenat.de/](https://distr-sys-io.ivo-zilkenat.de/)

### Full Setup - *Manual*

##### Dependencies
1. `docker`
2. `ansible`
3. `python3-dotenv-cli`
4. `git` (pre-installed on many Linux distros)
5. `make` (pre-installed on many Linux distros)

##### Setup

1. Clone project 
2. Configure environment variables `cp local.env ./deployment/.env` (e.g. `DOMAIN`, ...)
3. `cd` into `./deployment` directory
4. Join docker swarm cluster
   1. If not cluster present, create one and use current machine as master node: `docker swarm init --advertise-addr 127.0.0.1´
`

##### Actions

*Deploy using local container (e.g. your code changes in game_server or app_matchmaking_host):*
* Please use the images and domain environmental variables as listed in localhost.env in your deployment/.env file
* Then run `make deploy-local`

*Deploy*
* Run `make deploy`

*Undeployment*
* Run `make rm-all`

*Scaling*
* Add lobby `make lobby_id=your_name_here add-lobby`

### Minimal testable setup

*Run database:*
+ Go into services/database
+ Run `docker compose up`

Run the matchmaking server:
+ Go into services/app_matchmaking_host
+ Activate venv (e.g. with `source backend/venv/bin/activate`)
+ Run server with `python main.py`

*Run _a_ game server:*
+ Go into services/game_server
+ Activate venv (e.g. with `source venv/bin/activate`)
+ Optional: Customize environment variables (with `export {VARIABLE_NAME}={VARIABLE_VALUE}`)
  + `DEPEND_ON_MATCHMAKING`: Set to 0 if you want the game server to start without the matchmaking server 
  + `HOST`: Host name of the Server, defaults to 0.0.0.0, but could (should) be `localhost` for example
  + `PORT`: Port of the Server, defaults to 3001
  + `SERVER_NAME`: Name of the lobby which gets sent to the app_matchmaking_host, defaults to `Unbekannt`
  + `SERVER_URL`: The url of the lobby which gets sent to the app_matchmaking_host, defaults to `http://{HOST}:{PORT}`
  + Credentials `SERVER_ID` and `SERVER_TOKEN`, not set by default
    Only use these, if you want to re log into the matchmaking_server, you probably do not need them.
  + `CREDENTIALS_FILE`: The file where credentials are saved to, defaults to `DATA_DIR/credentials.json`
+ Run server with `python main.py`
