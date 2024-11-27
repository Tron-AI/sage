# Use a base image with Node.js and Python support
FROM node:18-alpine AS base

# Install Python, dependencies, and system tools
RUN apk add --no-cache python3 py3-pip build-base libffi-dev python3-dev openssl-dev gcc musl-dev

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Create and activate a virtual environment for Python
RUN python3 -m venv /app/venv

# Install Django dependencies inside the virtual environment
COPY sage-backend/requirements.txt /app/sage-backend/requirements.txt
RUN . /app/venv/bin/activate && pip install --no-cache-dir -r /app/sage-backend/requirements.txt

# Install Next.js dependencies
COPY sage-frontend/package.json sage-frontend/package-lock.json /app/sage-frontend/
WORKDIR /app/sage-frontend

# Clean npm cache and install dependencies
RUN npm cache clean --force
RUN npm install

# Ensure tsx and typescript are installed (in case they aren't already)
RUN npm install tsx typescript

# Copy entire sage-frontend directory
COPY sage-frontend /app/sage-frontend

# Copy project files
WORKDIR /app
COPY sage-backend /app/sage-backend

# Expose necessary ports
EXPOSE 8000 3000

# Run Django commands in the virtual environment and start both servers
CMD ["sh", "-c", ". /app/venv/bin/activate && python3 /app/sage-backend/manage.py makemigrations && python3 /app/sage-backend/manage.py migrate && python3 /app/sage-backend/manage.py runserver 0.0.0.0:8000 & cd /app/sage-frontend && npm run dev"]