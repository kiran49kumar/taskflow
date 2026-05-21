# TaskFlow - Team Task Manager

TaskFlow is a full-stack team task manager where users can create projects, add team members, assign tasks, and track progress with role-based access control.

## Live Links

- Live App: https://vigilant-trust-production-ad17.up.railway.app/
- Backend Health Check: https://taskflow-production-5d678.up.railway.app/health
- GitHub Repository: https://github.com/kiran49kumar/taskflow

## Assignment Coverage

- Authentication: signup/login with JWT tokens
- Role-based access: Admin and Member permissions
- Project management: create projects and manage project teams
- Team management: add members by email
- Task management: create, assign, update, and delete tasks
- Status tracking: To Do, In Progress, Done
- Dashboard: project count, task totals, overdue tasks, recent tasks
- REST API and database: Flask APIs with SQLite relationships
- Deployment: backend and frontend deployed on Railway

## Tech Stack

| Part | Technology |
| --- | --- |
| Backend | Python, Flask |
| Database | SQLite |
| Auth | JWT with flask-jwt-extended, bcrypt |
| Frontend | React 18, Vite, React Router, Axios |
| Styling | Custom CSS |
| Deployment | Railway |

## How It Works

TaskFlow has two Railway services:

- Backend service deployed from `backend`
- Frontend service deployed from `frontend`

The React frontend calls the Flask backend using `VITE_API_URL`. The backend exposes REST APIs under `/api`, stores data in SQLite, hashes passwords with bcrypt, and uses JWT tokens for authenticated requests.

Admins can create projects, add members, create tasks, assign tasks, edit task details, and delete tasks. Members can view project tasks and update only the status of tasks assigned to them.

## Local Setup

### Prerequisites

- Python 3.9 or newer
- Node.js 18 or newer
- Git

Check your versions:

```powershell
python --version
node -v
npm -v
git --version
```

### Backend

```powershell
cd backend
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment Variables

Backend:

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret_in_production
NODE_ENV=development
```

Frontend:

```env
VITE_API_URL=http://localhost:5000
```

On Railway, `VITE_API_URL` is set to the deployed backend URL:

```env
VITE_API_URL=https://taskflow-production-5d678.up.railway.app
```

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
| GET | `/api/projects/:id` | Get project details and members |
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

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/dashboard` | Get project count, task totals, overdue tasks, and recent tasks |

## Project Structure

```text
task-manager/
  backend/
    app.py
    requirements.txt
    railway.toml
    nixpacks.toml
    .env.example
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
    railway.toml
  README.md
  .gitignore
```

## Demo Flow

Use this flow for a 2-5 minute demo video:

1. Open the live app.
2. Sign up as an Admin.
3. Create a project.
4. Sign up as a Member in another browser or incognito window.
5. Log back in as Admin and add the Member by email.
6. Create a task and assign it to the Member.
7. Log in as the Member.
8. Open the project and update the assigned task using Start or Mark Done.
9. Show the dashboard progress and task status counts.

## Git Commit Story

The commit history is organized by assignment feature:

- Project setup and README documentation
- Repository ignore rules
- Flask backend API with authentication, validation, RBAC, and SQLite
- React/Vite frontend foundation
- Authentication flow and protected routes
- Dashboard progress tracking
- Project management UI
- Team member and task management UI
- Railway deployment fixes

## Deployment Notes

Backend Railway service:

```text
Root Directory: backend
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
Health Check: /health
```

Frontend Railway service:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npx serve -s dist -l tcp://0.0.0.0:$PORT
```

Required Railway variables:

```env
JWT_SECRET=your_strong_secret
NODE_ENV=production
VITE_API_URL=https://taskflow-production-5d678.up.railway.app
```

## Notes

Local database files, environment files, build output, and dependency folders are intentionally ignored by Git.
