# Use an official Python runtime as the parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the backend application's requirements file into the container
COPY . .

# Install Node.js
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# We wont use venvs here, because a container itself is isolated and we don't need venvs here
RUN cd /app/frontend 
RUN bun install 
RUN bun run build 
RUN cd /app/backend 
RUN pip install -r requirements.txt

# Expose the port the server listens on
EXPOSE 3000

# Don't run start.py because we wont get log output
CMD ["python3", "./main.py"]