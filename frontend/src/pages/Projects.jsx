import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Users, CheckSquare, Trash2, FolderKanban } from 'lucide-react';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/projects', form);
      toast.success('Project created!');
      onCreated(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>New Project</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="What is this project about?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    api.get('/api/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading projects…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FolderKanban size={48} color="var(--text-dim)" /></div>
          <h3 style={{ marginBottom: 8 }}>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: projectColor(p.id), borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                  {isAdmin && (
                    <button className="btn-danger btn-sm" onClick={e => deleteProject(e, p.id)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{p.name}</h3>
              {p.description && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{p.description}</p>}
              <div className="divider" style={{ margin: '14px 0' }} />
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} /> {p.member_count} member{p.member_count !== 1 ? 's' : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckSquare size={13} /> {p.task_count} task{p.task_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
function projectColor(id) { return COLORS[id % COLORS.length] + '33'; }
