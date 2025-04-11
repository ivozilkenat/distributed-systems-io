# Distributed-Systems-IO

A 2D multiplayer game with a dynamic lobby system. Lobbies are created on demand and dynamically spun up as new instances behind a Traefik reverse proxy. This architecture showcases core concepts of distributed systems and was built with scalability and modularity in mind.

---

## 🧱 Tech Stack

![image](https://github.com/user-attachments/assets/86adc25a-19eb-4696-982f-364c141fd380)

### 📦 Services
<!-- Insert image showing the structure of the game_server, matchmaking, database, etc. -->
![image](https://github.com/user-attachments/assets/13620968-5461-4466-a44a-ce5f5f7dade6)

### 🚀 Deployment Overview
<!-- Insert image showing automatic deployment pipeline (GitHub Actions, container, swarm, etc.) -->
![image](https://github.com/user-attachments/assets/e1163b74-3ad1-4a10-83ea-77ff356f7873)
![image](https://github.com/user-attachments/assets/a028a222-fc75-4efc-a047-31b134b3b87b)

---

## 🖥️ Server Setup
<!-- Insert image showing server infrastructure, e.g., manager node, swarm nodes, docker/traefik layout -->
![image](https://github.com/user-attachments/assets/03f5fd76-c003-475c-9956-061bd25d81c1)

---

## 🔄 Service Communication
<!-- Insert image/diagram showing the data flow between services: matchmaking ↔ game server ↔ database -->
![image](https://github.com/user-attachments/assets/f29ac9d9-45f7-4364-80ac-95080e69ab0c)

---

## 🔍 Server Browser Example
<!-- Insert image showing what the user sees when browsing for lobbies -->
![image](https://github.com/user-attachments/assets/4a73ba70-63e3-49d8-a115-2d823e580e75)

---

## 🚀 Deployment

### 🌐 Production – *Automatic*
- Push to the `main` branch
  - A GitHub Action will build the package and instruct the web server to run the container
- Access the app at: [https://distr-sys-io.ivo-zilkenat.de/](https://distr-sys-io.ivo-zilkenat.de/)

---

### 🛠️ Full Setup – *Manual*

#### ✅ Dependencies
Make sure you have the following installed:
1. `docker`
2. `ansible`
3. `python3-dotenv-cli`
4. `git` (pre-installed on most Linux distributions)
5. `make` (pre-installed on most Linux distributions)

#### ⚙️ Setup

1. Clone the project.
2. Configure environment variables:  
   `cp local.env ./deployment/.env`  
   (Set values like `DOMAIN`, etc.)
3. Change into the deployment directory:  
   `cd ./deployment`
4. Join a Docker Swarm cluster:
   - If no cluster is present, initialize one and use the current machine as the master node:  
     ```bash
     docker swarm init --advertise-addr 127.0.0.1
     ```

#### 🚦 Actions

**Deploy using local containers (e.g. for testing code changes in `game_server` or `app_matchmaking_host`):**
- Ensure image and domain variables are set in `deployment/.env` based on `localhost.env`
- Run:  
  ```bash
  make deploy-local
  ```

**Deploy:**
```bash
make deploy
```

**Undeploy:**
```bash
make rm-all
```

**Scale (e.g. add a new lobby instance):**
```bash
make lobby_id=your_name_here add-lobby
```

---

## 🧪 Minimal Testable Setup

**Run the Database:**
```bash
cd services/database
docker compose up
```

**Run the Matchmaking Server:**
```bash
cd services/app_matchmaking_host
source backend/venv/bin/activate  # Adjust path if necessary
python main.py
```

**Run a Game Server:**
```bash
cd services/game_server
source venv/bin/activate  # Adjust path if necessary
```

Optional environment variables:
- `DEPEND_ON_MATCHMAKING=0` – Start without matchmaking dependency
- `HOST=localhost` – Host address (default: `0.0.0.0`)
- `PORT=3001` – Port number
- `SERVER_NAME=Unbekannt` – Lobby name
- `SERVER_URL=http://{HOST}:{PORT}` – Lobby URL
- `SERVER_ID` and `SERVER_TOKEN` – Credentials for reconnecting to matchmaking (optional)
- `CREDENTIALS_FILE=DATA_DIR/credentials.json` – Where credentials are saved

Start the server:
```bash
python main.py
```
