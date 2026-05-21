import os
import sqlite3
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)

app = Flask(__name__)
CORS(app, origins="*")

# Config
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'super-secret-change-in-prod')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
jwt = JWTManager(app)

DB_PATH = os.environ.get('DB_PATH', 'taskmanager.db')


# ---------------------
# Database helpers
# ---------------------

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
        g.db.execute("PRAGMA journal_mode = WAL")
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            owner_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_members (
            project_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            project_id INTEGER NOT NULL,
            assigned_to INTEGER,
            created_by INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
            priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
            due_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    db.commit()
    db.close()
    print("✅ Database initialized")


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]


def get_membership(project_id, user_id):
    db = get_db()
    row = db.execute(
        'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
        (project_id, user_id)
    ).fetchone()
    return row_to_dict(row)


# ---------------------
# Auth decorator
# ---------------------

def require_admin_role(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------------------
# AUTH ROUTES
# ---------------------

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = 'admin' if data.get('role') == 'admin' else 'member'

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    db = get_db()
    if db.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
        return jsonify({'error': 'Email already registered'}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    cur = db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
        (name, email, hashed, role)
    )
    db.commit()
    user_id = cur.lastrowid

    token = create_access_token(
        identity=str(user_id),
        additional_claims={'name': name, 'email': email, 'role': role}
    )
    return jsonify({
        'message': 'Account created successfully',
        'token': token,
        'user': {'id': user_id, 'name': name, 'email': email, 'role': role}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    user = row_to_dict(db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone())
    if not user or not bcrypt.checkpw(password.encode(), user['password'].encode()):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(
        identity=str(user['id']),
        additional_claims={'name': user['name'], 'email': user['email'], 'role': user['role']}
    )
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'role': user['role']}
    })


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    db = get_db()
    user = row_to_dict(db.execute(
        'SELECT id, name, email, role, created_at FROM users WHERE id=?', (user_id,)
    ).fetchone())
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user)


# ---------------------
# PROJECT ROUTES
# ---------------------

@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = int(get_jwt_identity())
    db = get_db()
    projects = rows_to_list(db.execute("""
        SELECT p.*, u.name as owner_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id=p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id=p.id) as task_count,
          pm.role as my_role
        FROM projects p
        JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=?
        JOIN users u ON u.id=p.owner_id
        ORDER BY p.created_at DESC
    """, (user_id,)).fetchall())
    return jsonify(projects)


@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Only admins can create projects'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '')
    if not name:
        return jsonify({'error': 'Project name is required'}), 400

    user_id = int(get_jwt_identity())
    db = get_db()
    cur = db.execute(
        'INSERT INTO projects (name, description, owner_id) VALUES (?,?,?)',
        (name, description, user_id)
    )
    project_id = cur.lastrowid
    db.execute(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)',
        (project_id, user_id, 'admin')
    )
    db.commit()

    project = row_to_dict(db.execute('SELECT * FROM projects WHERE id=?', (project_id,)).fetchone())
    return jsonify({'message': 'Project created', 'project': project}), 201


@app.route('/api/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    membership = get_membership(project_id, user_id)
    if not membership:
        return jsonify({'error': 'Access denied'}), 403

    db = get_db()
    project = row_to_dict(db.execute("""
        SELECT p.*, u.name as owner_name FROM projects p
        JOIN users u ON u.id=p.owner_id WHERE p.id=?
    """, (project_id,)).fetchone())
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    members = rows_to_list(db.execute("""
        SELECT u.id, u.name, u.email, u.role as system_role, pm.role as project_role, pm.joined_at
        FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=?
    """, (project_id,)).fetchall())

    return jsonify({**project, 'members': members, 'my_role': membership['role']})


@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    db = get_db()
    project = row_to_dict(db.execute('SELECT * FROM projects WHERE id=?', (project_id,)).fetchone())
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project['owner_id'] != user_id and claims.get('role') != 'admin':
        return jsonify({'error': 'Only the project owner or system admin can delete'}), 403
    db.execute('DELETE FROM projects WHERE id=?', (project_id,))
    db.commit()
    return jsonify({'message': 'Project deleted'})


@app.route('/api/projects/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_member(project_id):
    user_id = int(get_jwt_identity())
    membership = get_membership(project_id, user_id)
    if not membership or membership['role'] != 'admin':
        return jsonify({'error': 'Only project admins can add members'}), 403

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    role = 'admin' if data.get('role') == 'admin' else 'member'

    db = get_db()
    user = row_to_dict(db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone())
    if not user:
        return jsonify({'error': 'User with that email not found'}), 404

    existing = db.execute(
        'SELECT 1 FROM project_members WHERE project_id=? AND user_id=?',
        (project_id, user['id'])
    ).fetchone()
    if existing:
        return jsonify({'error': 'User is already a member'}), 409

    db.execute(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)',
        (project_id, user['id'], role)
    )
    db.commit()
    return jsonify({'message': f"{user['name']} added to project"})


@app.route('/api/projects/<int:project_id>/members/<int:target_user_id>', methods=['DELETE'])
@jwt_required()
def remove_member(project_id, target_user_id):
    user_id = int(get_jwt_identity())
    membership = get_membership(project_id, user_id)
    if not membership or membership['role'] != 'admin':
        return jsonify({'error': 'Only project admins can remove members'}), 403
    db = get_db()
    db.execute('DELETE FROM project_members WHERE project_id=? AND user_id=?', (project_id, target_user_id))
    db.commit()
    return jsonify({'message': 'Member removed'})


# ---------------------
# TASK ROUTES
# ---------------------

@app.route('/api/projects/<int:project_id>/tasks', methods=['GET'])
@jwt_required()
def get_tasks(project_id):
    user_id = int(get_jwt_identity())
    if not get_membership(project_id, user_id):
        return jsonify({'error': 'Access denied'}), 403

    db = get_db()
    query = """
        SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email,
          c.name as created_by_name
        FROM tasks t
        LEFT JOIN users u ON u.id=t.assigned_to
        JOIN users c ON c.id=t.created_by
        WHERE t.project_id=?
    """
    params = [project_id]

    status = request.args.get('status')
    priority = request.args.get('priority')
    assignee = request.args.get('assignee')

    if status:
        query += ' AND t.status=?'; params.append(status)
    if priority:
        query += ' AND t.priority=?'; params.append(priority)
    if assignee:
        query += ' AND t.assigned_to=?'; params.append(assignee)

    query += ' ORDER BY t.created_at DESC'
    tasks = rows_to_list(db.execute(query, params).fetchall())
    return jsonify(tasks)


@app.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())
    membership = get_membership(project_id, user_id)
    if not membership:
        return jsonify({'error': 'Access denied'}), 403
    if membership['role'] != 'admin':
        return jsonify({'error': 'Only project admins can create tasks'}), 403

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Task title is required'}), 400

    assigned_to = data.get('assigned_to')
    if assigned_to:
        if not get_membership(project_id, assigned_to):
            return jsonify({'error': 'Assignee must be a project member'}), 400

    priority = data.get('priority', 'medium')
    if priority not in ('low', 'medium', 'high'):
        priority = 'medium'

    db = get_db()
    cur = db.execute("""
        INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date)
        VALUES (?,?,?,?,?,?,?)
    """, (
        title, data.get('description', ''), project_id,
        assigned_to or None, user_id, priority,
        data.get('due_date') or None
    ))
    db.commit()

    task = row_to_dict(db.execute("""
        SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
        FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to
        JOIN users c ON c.id=t.created_by WHERE t.id=?
    """, (cur.lastrowid,)).fetchone())

    return jsonify({'message': 'Task created', 'task': task}), 201


@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    db = get_db()
    task = row_to_dict(db.execute('SELECT * FROM tasks WHERE id=?', (task_id,)).fetchone())
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    membership = get_membership(task['project_id'], user_id)
    if not membership:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json() or {}

    if membership['role'] != 'admin':
        if task['assigned_to'] != user_id:
            return jsonify({'error': 'You can only update tasks assigned to you'}), 403
        status = data.get('status')
        if status not in ('todo', 'in_progress', 'done'):
            return jsonify({'error': 'Members can only update task status'}), 400
        db.execute(
            'UPDATE tasks SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
            (status, task_id)
        )
    else:
        title = data.get('title', task['title']).strip() or task['title']
        description = data.get('description', task['description'])
        status = data.get('status', task['status'])
        if status not in ('todo', 'in_progress', 'done'):
            status = task['status']
        priority = data.get('priority', task['priority'])
        if priority not in ('low', 'medium', 'high'):
            priority = task['priority']
        due_date = data.get('due_date', task['due_date'])
        assigned_to = data.get('assigned_to', task['assigned_to'])

        db.execute("""
            UPDATE tasks SET title=?, description=?, status=?, priority=?,
              due_date=?, assigned_to=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
        """, (title, description, status, priority, due_date, assigned_to, task_id))

    db.commit()

    updated = row_to_dict(db.execute("""
        SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
        FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to
        JOIN users c ON c.id=t.created_by WHERE t.id=?
    """, (task_id,)).fetchone())

    return jsonify({'message': 'Task updated', 'task': updated})


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    db = get_db()
    task = row_to_dict(db.execute('SELECT * FROM tasks WHERE id=?', (task_id,)).fetchone())
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    membership = get_membership(task['project_id'], user_id)
    if not membership or membership['role'] != 'admin':
        return jsonify({'error': 'Only project admins can delete tasks'}), 403

    db.execute('DELETE FROM tasks WHERE id=?', (task_id,))
    db.commit()
    return jsonify({'message': 'Task deleted'})


# ---------------------
# DASHBOARD
# ---------------------

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())
    db = get_db()
    today = datetime.utcnow().strftime('%Y-%m-%d')

    project_count = db.execute(
        'SELECT COUNT(*) FROM project_members WHERE user_id=?', (user_id,)
    ).fetchone()[0]

    all_tasks = rows_to_list(db.execute("""
        SELECT t.*, p.name as project_name, u.name as assigned_to_name
        FROM tasks t
        JOIN projects p ON p.id=t.project_id
        LEFT JOIN users u ON u.id=t.assigned_to
        JOIN project_members pm ON pm.project_id=t.project_id AND pm.user_id=?
        WHERE t.assigned_to=? OR pm.role='admin'
        ORDER BY t.due_date ASC
    """, (user_id, user_id)).fetchall())

    overdue = [t for t in all_tasks if t['due_date'] and t['due_date'] < today and t['status'] != 'done']

    return jsonify({
        'project_count': project_count,
        'task_totals': {
            'todo': sum(1 for t in all_tasks if t['status'] == 'todo'),
            'in_progress': sum(1 for t in all_tasks if t['status'] == 'in_progress'),
            'done': sum(1 for t in all_tasks if t['status'] == 'done'),
        },
        'overdue_count': len(overdue),
        'overdue_tasks': overdue[:5],
        'recent_tasks': all_tasks[:5],
    })


@app.route('/api/users', methods=['GET'])
@jwt_required()
def list_users():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    db = get_db()
    users = rows_to_list(db.execute(
        'SELECT id, name, email, role FROM users ORDER BY name'
    ).fetchall())
    return jsonify(users)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})


init_db()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('DEBUG', 'false').lower() == 'true')
