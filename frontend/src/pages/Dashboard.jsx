import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { SkeletonStatCard } from '../components/SkeletonCard';
import { FolderOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">⚠️</div>
      <p style={{ color: 'var(--red)' }}>{error}</p>
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const total = data ? data.task_totals.todo + data.task_totals.in_progress + data.task_totals.done : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stat cards — skeleton while loading */}
      <div className="stats-grid">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{data.project_count}</div>
                  <div className="stat-label">Projects</div>
                </div>
                <FolderOpen size={24} color="var(--accent)" />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--yellow)' }}>{data.task_totals.in_progress}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <Clock size={24} color="var(--yellow)" />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--green)' }}>{data.task_totals.done}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <CheckCircle size={24} color="var(--green)" />
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: data.overdue_count > 0 ? 'var(--red)' : 'var(--text)' }}>
                    {data.overdue_count}
                  </div>
                  <div className="stat-label">Overdue</div>
                </div>
                <AlertTriangle size={24} color={data.overdue_count > 0 ? 'var(--red)' : 'var(--text-dim)'} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Overall Progress</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {data.task_totals.done} / {total} tasks done
            </span>
          </div>
          <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex' }}>
              <div style={{ width: `${total ? data.task_totals.done / total * 100 : 0}%`, background: 'var(--green)', transition: 'width 0.6s' }} />
              <div style={{ width: `${total ? data.task_totals.in_progress / total * 100 : 0}%`, background: 'var(--yellow)', transition: 'width 0.6s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {[['var(--green)', 'Done'], ['var(--yellow)', 'In Progress'], ['var(--surface2)', 'To Do']].map(([color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', border: label === 'To Do' ? '1px solid var(--border)' : 'none' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom grid — skeleton while loading */}
      {loading ? (
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card">
            <div className="skeleton" style={{ width: 120, height: 18, marginBottom: 16 }} />
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 10 }} />)}
          </div>
        </div>
      ) : (
        <div className="dashboard-bottom-grid" style={{ display: 'grid', gridTemplateColumns: data?.overdue_tasks?.length ? '1fr 1fr' : '1fr', gap: 20 }}>
          {data.overdue_tasks.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} /> Overdue Tasks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.overdue_tasks.map(task => (
                  <div key={task.id}
                    style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, borderLeft: '3px solid var(--red)', cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${task.project_id}`)}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {task.project_name} · Due {task.due_date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Recent Tasks</h3>
            {data.recent_tasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p style={{ fontSize: 13 }}>No tasks yet. Go to a project to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.recent_tasks.map(task => (
                  <div key={task.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${task.project_id}`)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.project_name}</div>
                    </div>
                    <span className={`badge badge-${task.status}`} style={{ flexShrink: 0 }}>{statusLabel[task.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
