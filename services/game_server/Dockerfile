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

RUN python ./service_setup_helpers/install.py

# Expose the port the server listens on
EXPOSE 3001


CMD ["python3", "./service_setup_helpers/start.py"]
