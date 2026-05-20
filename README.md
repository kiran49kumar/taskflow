# TaskFlow - Team Task Manager

TaskFlow is a full-stack task management app for teams. It includes login/signup, admin and member roles, projects, task assignment, task status updates, priority tracking, and a dashboard.

This project is intended to run with a Python/Flask backend, a React/Vite frontend, and a local SQLite database.

## Tech Stack

| Part | Technology |
| --- | --- |
| Backend | Python, Flask |
| Database | SQLite |
| Auth | JWT with flask-jwt-extended, bcrypt |
| Frontend | React 18, Vite, React Router, Axios |
| Styling | Custom CSS |
| Deployment | Railway-ready Flask config |

## Project Location

If you downloaded the project as provided, the main project folder is:

```powershell
C:\Users\kirankumar\Downloads\files\taskflow-complete\task-manager
```

Open this folder in VS Code or use it from PowerShell.

## Prerequisites

Install these before running the project:

- Python 3.9 or newer: https://www.python.org/downloads/
- Node.js 18 or newer: https://nodejs.org/
- Git: https://git-scm.com/downloads
- VS Code, recommended: https://code.visualstudio.com/

Check that everything works:

```powershell
python --version
node -v
npm -v
git --version
```

If `python` does not work on Windows, try:

```powershell
py --version
```

## Local Setup

### 1. Open the project folder

```powershell
cd C:\Users\kirankumar\Downloads\files\taskflow-complete\task-manager
```

### 2. Start the backend

Open a PowerShell terminal:

```powershell
cd backend
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

If your system uses the Windows Python launcher, use this instead:

```powershell
py app.py
```

The backend runs at:

```text
http://localhost:5000
```

To confirm it is working, open this in your browser:

```text
http://localhost:5000/health
```

You should see a JSON response with `status: "ok"`.

### 3. Start the frontend

Open a second PowerShell terminal:

```powershell
cd C:\Users\kirankumar\Downloads\files\taskflow-complete\task-manager\frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

Open that URL in your browser.

## Environment Variables

The backend reads settings from `backend/.env`.

Example:

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret_in_production
NODE_ENV=development
```

For local development, the default values are enough. Before deploying, change `JWT_SECRET` to a strong random value.

The frontend reads `VITE_API_URL` if you create a frontend `.env` file. For local development, the frontend already points to:

```text
http://localhost:5000
```

## Important Note About Backend Files

The `backend` folder also contains Node files such as `server.js`, `db.js`, and `package.json`. For this project setup, use the Flask backend:

```powershell
python app.py
```

You do not need to run `npm start` inside the backend folder.

## Git and GitHub Setup

### 1. Initialize Git

Run this from the main project folder:

```powershell
cd C:\Users\kirankumar\Downloads\files\taskflow-complete\task-manager
git init
git status
```

### 2. Add files and make the first commit

```powershell
git add .
git commit -m "Initial commit"
```

The project includes a `.gitignore` file so folders like `node_modules`, `.env`, `dist`, virtual environments, and local database files are not committed.

### 3. Create a GitHub repository

1. Go to https://github.com/
2. Click **New repository**
3. Give it a name, for example `taskflow`
4. Do not add a README, `.gitignore`, or license on GitHub because this project already has local files
5. Click **Create repository**

### 4. Connect your local project to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

After this, your code will be visible in your GitHub repository.

## Daily Git Workflow

When you make changes:

```powershell
git status
git add .
git commit -m "Describe your change"
git push
```

To download the latest changes from GitHub:

```powershell
git pull
```

Useful commands:

```powershell
git status
git log --oneline
git remote -v
```

## Common Problems

### pip install fails

Make sure Python is installed:

```powershell
python --version
pip --version
```

If needed, use:

```powershell
py -m pip install -r requirements.txt
```

### Backend says port 5000 is already in use

Another process is already using port 5000. Close that process or change `PORT` in `backend/.env`.

### Frontend cannot connect to backend

Make sure the backend terminal is still running and check:

```text
http://localhost:5000/health
```

### npm install fails in frontend

Make sure Node.js is installed correctly:

```powershell
node -v
npm -v
```

Then run `npm install` from the `frontend` folder.

## Features

- Signup and login with JWT authentication
- Admin and member roles
- Create and manage projects
- Add members to projects
- Create, assign, update, and delete tasks
- Filter tasks by status and priority
- Dashboard with progress and recent task information
- Kanban-style task grouping

## API Overview

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Get the current user |

### Projects

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete a project |
| POST | `/api/projects/:id/members` | Add a project member |
| DELETE | `/api/projects/:id/members/:uid` | Remove a project member |

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/projects/:id/tasks` | List project tasks |
| POST | `/api/projects/:id/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## Project Structure

```text
task-manager/
  backend/
    app.py
    requirements.txt
    .env.example
    railway.toml
  frontend/
    src/
      api.js
      App.jsx
      main.jsx
      context/
      components/
      pages/
    package.json
    vite.config.js
  README.md
  .gitignore
```

## Test Flow

1. Start the backend with `python app.py`.
2. Start the frontend with `npm run dev`.
3. Open `http://localhost:5173`.
4. Sign up as an admin user.
5. Create a project.
6. Sign up as a member user in another browser or incognito window.
7. Add the member to the project using their email.
8. Create tasks and assign them to the member.
9. Log in as the member and update task status.

## Deployment Notes

This project can be deployed as two services:

- Backend service root: `backend`
- Frontend service root: `frontend`

For the backend, set:

```env
JWT_SECRET=your_strong_secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

The backend deployment command is:

```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
```

For the frontend, set:

```env
VITE_API_URL=https://your-backend-domain.com
```

Frontend build/start commands:

```bash
npm install
npm run build
npm run serve
```
