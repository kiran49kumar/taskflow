import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ArrowLeft, Trash2, UserPlus, Users, ChevronDown } from 'lucide-react';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

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
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
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
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
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
        <h2 style={{ marginBottom: 20 }}>Add Member</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          The user must already have a TaskFlow account.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task object
  const [memberModal, setMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [editTask, setEditTask] = useState(null);

  const loadProject = async () => {
    try {
      const res = await api.get(`/api/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      toast.error('Access denied or project not found');
      navigate('/projects');
    }
  };

  const loadTasks = async () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    const res = await api.get(`/api/projects/${id}/tasks`, { params });
    setTasks(res.data);
  };

  useEffect(() => {
    Promise.all([loadProject(), loadTasks()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (project) loadTasks(); }, [filters]);

  const myRole = project?.my_role;
  const isProjectAdmin = myRole === 'admin';
  const today = new Date().toISOString().split('T')[0];

  const updateTaskStatus = async (task, status) => {
    try {
      const res = await api.patch(`/api/tasks/${task.id}`, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? res.data.task : t));
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
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
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/projects/${id}/members/${memberId}`);
      setProject(p => ({ ...p, members: p.members.filter(m => m.id !== memberId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const onTaskSaved = (task, type) => {
    if (type === 'create') setTasks(ts => [task, ...ts]);
    else setTasks(ts => ts.map(t => t.id === task.id ? task : t));
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading project…</div>;
  if (!project) return null;

  const statusGroups = ['todo', 'in_progress', 'done'];
  const tasksByStatus = statusGroups.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button className="btn-ghost" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isProjectAdmin && (
              <>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setMemberModal(true)}>
                  <UserPlus size={15} /> Add Member
                </button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setTaskModal('create')}>
                  <Plus size={15} /> New Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['tasks', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', background: 'transparent',
            color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            borderRadius: 0, textTransform: 'capitalize', fontWeight: activeTab === tab ? 600 : 400,
          }}>
            {tab === 'tasks' ? `Tasks (${tasks.length})` : `Members (${project.members?.length || 0})`}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Filters */}
          <div className="task-filters" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', paddingTop: 6 }}>Filter:</span>
            {['', 'todo', 'in_progress', 'done'].map(s => (
              <button key={s} className={`filter-chip ${filters.status === s ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, status: s }))}>
                {s ? STATUS_LABELS[s] : 'All Status'}
              </button>
            ))}
            <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
            {['', 'high', 'medium', 'low'].map(p => (
              <button key={p} className={`filter-chip ${filters.priority === p ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, priority: p }))}>
                {p ? PRIORITY_LABELS[p] : 'All Priority'}
              </button>
            ))}
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 style={{ marginBottom: 8 }}>No tasks found</h3>
              <p>{isProjectAdmin ? 'Create the first task for this project.' : 'No tasks match your filters.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {statusGroups.map(status => (
                <div key={status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 10 }}>
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tasksByStatus[status].map(task => {
                      const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
                      const canUpdateStatus = !isProjectAdmin && task.assigned_to === user.id;
                      return (
                        <div key={task.id} className={`task-item ${isOverdue ? 'overdue' : ''}`}
                          style={{ flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 500, fontSize: 14, flex: 1, paddingRight: 8 }}>{task.title}</div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {isProjectAdmin && (
                                <button className="btn-ghost btn-sm" onClick={() => setEditTask(task)}>✏️</button>
                              )}
                              {isProjectAdmin && (
                                <button className="btn-ghost btn-sm" onClick={() => deleteTask(task.id)}>
                                  <Trash2 size={13} color="var(--red)" />
                                </button>
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{task.description}</p>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                            {task.due_date && (
                              <span style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text-muted)' }}>
                                📅 {task.due_date}
                              </span>
                            )}
                          </div>
                          {task.assigned_to_name && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                {task.assigned_to_name[0]}
                              </div>
                              {task.assigned_to_name}
                            </div>
                          )}
                          {canUpdateStatus && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
                              {task.status !== 'in_progress' && (
                                <button className="btn-secondary btn-sm" onClick={() => updateTaskStatus(task, 'in_progress')}>
                                  Start
                                </button>
                              )}
                              {task.status !== 'done' && (
                                <button className="btn-primary btn-sm" onClick={() => updateTaskStatus(task, 'done')}>
                                  Mark Done
                                </button>
                              )}
                              {task.status === 'done' && (
                                <button className="btn-secondary btn-sm" onClick={() => updateTaskStatus(task, 'todo')}>
                                  Reopen
                                </button>
                              )}
                              <select className="status-select" style={{ flex: '1 1 130px' }} value={task.status}
                                onChange={e => updateTaskStatus(task, e.target.value)}>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.id} className="member-item">
                <div className="avatar">{m.name[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
                <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                {isProjectAdmin && m.id !== user.id && (
                  <button className="btn-danger btn-sm" onClick={() => removeMember(m.id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {(taskModal === 'create') && (
        <TaskModal project={project} members={project.members || []}
          task={null} onClose={() => setTaskModal(null)} onSaved={onTaskSaved} />
      )}
      {editTask && (
        <TaskModal project={project} members={project.members || []}
          task={editTask} onClose={() => setEditTask(null)} onSaved={onTaskSaved} />
      )}
      {memberModal && (
        <AddMemberModal projectId={id} onClose={() => setMemberModal(false)}
          onAdded={loadProject} />
      )}
    </div>
  );
}
