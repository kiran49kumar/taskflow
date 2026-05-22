import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ArrowLeft, Trash2, UserPlus } from 'lucide-react';
import { SkeletonTaskCard } from '../components/SkeletonCard';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const STATUS_GROUPS = ['todo', 'in_progress', 'done'];

/* ---------- TASK MODAL ---------- */
function TaskModal({ project, members, task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    status: task?.status || 'todo',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null };
      let res;
      if (isEdit) {
        res = await api.patch(`/api/tasks/${task.id}`, payload);
        onSaved(res.data.task, 'update');
        toast.success('Task updated');
      } else {
        res = await api.post(`/api/projects/${project.id}/tasks`, payload);
        onSaved(res.data.task, 'create');
        toast.success('Task created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>{isEdit ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Task Title *</label>
            <input autoFocus value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Design homepage wireframe" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional details…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign To</label>
              <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_GROUPS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- ADD MEMBER MODAL ---------- */
function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/projects/${projectId}/members`, form);
      toast.success('Member added!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 8 }}>Add Member</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          The user must already have a TaskFlow account.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Email Address</label>
            <input autoFocus type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member — view & update assigned tasks</option>
              <option value="admin">Admin — full project access</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- TASK CARD ---------- */
function TaskCard({ task, isProjectAdmin, userId, today, onEdit, onDelete, onStatusChange }) {
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
  const canEdit = isProjectAdmin || task.assigned_to === userId;

  return (
    <div className={`task-item ${isOverdue ? 'overdue' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontWeight: 500, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {canEdit && (
            <button className="btn-ghost btn-sm" onClick={() => onEdit(task)} title="Edit task">✏️</button>
          )}
          {isProjectAdmin && (
            <button className="btn-ghost btn-sm" onClick={() => onDelete(task.id)} title="Delete task">
              <Trash2 size={13} color="var(--red)" />
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {task.due_date && (
          <span style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            📅 {task.due_date}
            {isOverdue && <span style={{ color: 'var(--red)', fontWeight: 600 }}> · Overdue</span>}
          </span>
        )}
      </div>

      {task.assigned_to_name && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
            {task.assigned_to_name[0]}
          </div>
          {task.assigned_to_name}
        </div>
      )}

      {/* Quick status for assigned member */}
      {!isProjectAdmin && task.assigned_to === userId && (
        <select className="status-select" value={task.status}
          onChange={e => onStatusChange(task, e.target.value)}>
          {STATUS_GROUPS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      )}
    </div>
  );
}

/* ---------- MAIN PAGE ---------- */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const loadProject = useCallback(async () => {
    try {
      const res = await api.get(`/api/projects/${id}`);
      setProject(res.data);
    } catch {
      toast.error('Access denied or project not found');
      navigate('/projects');
    }
  }, [id, navigate]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await api.get(`/api/projects/${id}/tasks`, { params });
      setTasks(res.data);
    } finally {
      setTasksLoading(false);
    }
  }, [id, filters]);

  useEffect(() => {
    Promise.all([loadProject(), loadTasks()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (!loading) loadTasks(); }, [filters]);

  const isProjectAdmin = project?.my_role === 'admin';
  const today = new Date().toISOString().split('T')[0];

  const onTaskSaved = (task, type) => {
    if (type === 'create') setTasks(ts => [task, ...ts]);
    else setTasks(ts => ts.map(t => t.id === task.id ? task : t));
  };

  const updateTaskStatus = async (task, status) => {
    try {
      const res = await api.patch(`/api/tasks/${task.id}`, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? res.data.task : t));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(ts => ts.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/api/projects/${id}/members/${memberId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (loading) return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 130, height: 32, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 240, height: 28 }} />
      </div>
      <div className="kanban-board">
        {[1,2,3].map(i => (
          <div key={i}>
            <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
            {[1,2].map(j => <div key={j} style={{ marginBottom: 10 }}><SkeletonTaskCard /></div>)}
          </div>
        ))}
      </div>
    </div>
  );

  if (!project) return null;

  const tasksByStatus = STATUS_GROUPS.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn-ghost" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => navigate('/projects')}>
          <ArrowLeft size={15} /> Back to Projects
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          {isProjectAdmin && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setMemberModal(true)}>
                <UserPlus size={15} /> Add Member
              </button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setTaskModal(true)}>
                <Plus size={15} /> New Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {['tasks', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', background: 'transparent',
            color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            borderRadius: 0, fontWeight: activeTab === tab ? 600 : 400,
          }}>
            {tab === 'tasks' ? `Tasks (${tasks.length})` : `Members (${project.members?.length || 0})`}
          </button>
        ))}
      </div>

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <>
          {/* Filters */}
          <div className="task-filters">
            <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter:</span>
            {['', 'todo', 'in_progress', 'done'].map(s => (
              <button key={s} className={`filter-chip ${filters.status === s ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, status: s }))}>
                {s ? STATUS_LABELS[s] : 'All'}
              </button>
            ))}
            <span style={{ width: 1, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
            {['', 'high', 'medium', 'low'].map(p => (
              <button key={p} className={`filter-chip ${filters.priority === p ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, priority: p }))}>
                {p ? PRIORITY_LABELS[p] : 'All Priority'}
              </button>
            ))}
          </div>

          {tasksLoading ? (
            <div className="kanban-board">
              {[1,2,3].map(i => (
                <div key={i}>
                  <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                  <SkeletonTaskCard />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 style={{ marginBottom: 8 }}>No tasks found</h3>
              <p>{isProjectAdmin ? 'Create the first task for this project.' : 'No tasks match your filters.'}</p>
              {isProjectAdmin && (
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTaskModal(true)}>
                  <Plus size={15} style={{ marginRight: 6 }} /> Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="kanban-board">
              {STATUS_GROUPS.map(status => (
                <div key={status}>
                  <div className="kanban-col-header">
                    <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 10 }}>
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tasksByStatus[status].length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                        No tasks
                      </div>
                    ) : tasksByStatus[status].map(task => (
                      <TaskCard key={task.id} task={task}
                        isProjectAdmin={isProjectAdmin} userId={user.id}
                        today={today} onEdit={setEditTask}
                        onDelete={deleteTask} onStatusChange={updateTaskStatus} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div>
          {project.members?.length === 0 ? (
            <div className="empty-state">
              <p>No members yet.</p>
            </div>
          ) : (
            <div className="members-list">
              {project.members.map(m => (
                <div key={m.id} className="member-item">
                  <div className="avatar">{m.name[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                  </div>
                  <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                  {isProjectAdmin && m.id !== user.id && (
                    <button className="btn-danger btn-sm" onClick={() => removeMember(m.id)} title="Remove member">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal project={project} members={project.members || []}
          task={null} onClose={() => setTaskModal(false)} onSaved={onTaskSaved} />
      )}
      {editTask && (
        <TaskModal project={project} members={project.members || []}
          task={editTask} onClose={() => setEditTask(null)} onSaved={onTaskSaved} />
      )}
      {memberModal && (
        <AddMemberModal projectId={id} onClose={() => setMemberModal(false)} onAdded={loadProject} />
      )}
    </div>
  );
}
