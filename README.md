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
   1. If not cluster present, create one and use current machine as master node: `docker swarm init --advertise-addr MAIN_INTERFACE_IP´
`

##### Actions

*Deploy*
* Run `make deploy`

*Undeployment*
* Run `make rm-deploy`

*Scaling*
* Add lobby `make add-lobby LOBBY_ID=test`

### Minimal testable Setup - *Manual* [!!!REWORK THIS!!!]

All services can either be started by utilizing their respective containers or by manually running the services on the host machine directly. 
> **Note**: Make sure that there is no port overlapping and consider that when testing services together that they must discover each other. In docker this is simply handled by container name DNS.

##### Running services individually - *without docker*
1. Change into the respective sub-directory

###### Project Setup
1. `python ./install.py`

###### Run
1. Automatically
   1. `python ./start.py`
2. Manually (faster startup)
   1. Activate `venv`
   2. `python ./server/main.py`

##### Creating the database
Run `docker compose up` in services/database to create the database and a phpmyadmin instance at 8080.