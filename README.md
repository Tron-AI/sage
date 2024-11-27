
Sage Application Docker Setup

This repository contains a Docker setup for running the Sage Application, a full-stack project built with a Django backend and a Next.js frontend. The Dockerfile is designed to handle both services within a single container.

---

Features
- Python Environment: Uses Python 3 with a virtual environment for Django.
- Node.js Environment: Uses Node.js 18 for the Next.js frontend.
- Django Commands: Automatically runs makemigrations and migrate to set up the backend database.
- Next.js Development Server: Runs the Next.js frontend in development mode.
- Ports Exposed:
  - Backend: 8000
  - Frontend: 3000

---

Prerequisites
- Docker must be installed on your system.
- Ensure the project directories `sage-backend` and `sage-frontend` exist with the following structure:
  .
  ├── sage-backend
  │   ├── manage.py
  │   ├── requirements.txt
  │   └── ...
  ├── sage-frontend
  │   ├── package.json
  │   ├── package-lock.json
  │   └── ...
  └── Dockerfile

---

Build the Docker Image
1. Navigate to the project directory containing the Dockerfile.
2. Build the Docker image:
   docker build --no-cache -t sage .

---

Run the Container
Run the Docker container using the following command:
docker run -p 8000:8000 -p 3000:3000 sage

This will:
- Start the Django backend server on port 8000.
- Start the Next.js frontend server on port 3000.

---

Notes
1. The makemigrations and migrate commands are automatically executed when the container starts.
2. The backend runs in development mode using python manage.py runserver.
3. The frontend runs in development mode using npm run dev.

---

Troubleshooting
- Database Issues: Ensure that your database is properly configured in sage-backend/settings.py before running the container.
- Port Conflicts: Make sure ports 8000 and 3000 are not already in use.
- Environment Issues: If virtual environment activation fails, ensure Python and its dependencies are correctly installed in the container.
