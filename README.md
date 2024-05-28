# distributed-systems-io

Hello World!

## Project Setup
`python ./install.py`

## Run
1. Automatically
   1. `python ./start.py`
2. Manually (faster startup)
   1. Activate `venv`
   2. `python ./server/main.py`

### Run Database
Use docker to run your database:

```bash
docker run --env-file database.env -v ./initial-database.sql:/docker-entrypoint-initdb.d/01-initialize.sql -p 3306:3306 mariadb:latest
```
or use your own instance (e.g. xampp for windows) and import the `initial-database.sql` into a new database called `dsio`. You should also create a user called `dsio` with password `dsio` and grant it all privileges on `dsio`.

## Deployment
- Push to branch `main`
  - Wait for action to build package & web server to run container
- View at [https://distr-sys-io.ivo-zilkenat.de/](https://distr-sys-io.ivo-zilkenat.de/)
