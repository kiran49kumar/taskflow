import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityColor = { low: 'var(--text-muted)', medium: 'var(--blue)', high: 'var(--red)' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading dashboard…</div>;
  if (!data) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
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
              <div className="stat-value" style={{ color: data.overdue_count > 0 ? 'var(--red)' : 'var(--text)' }}>{data.overdue_count}</div>
              <div className="stat-label">Overdue</div>
            </div>
            <AlertTriangle size={24} color={data.overdue_count > 0 ? 'var(--red)' : 'var(--text-dim)'} />
          </div>
        </div>
      </div>

      {/* Task completion bar */}
      {(data.task_totals.todo + data.task_totals.in_progress + data.task_totals.done) > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Overall Progress</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {data.task_totals.done} / {data.task_totals.todo + data.task_totals.in_progress + data.task_totals.done} tasks done
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
            {(() => {
              const total = data.task_totals.todo + data.task_totals.in_progress + data.task_totals.done;
              const donePct = total ? (data.task_totals.done / total * 100) : 0;
              const inPct = total ? (data.task_totals.in_progress / total * 100) : 0;
              return (
                <div style={{ height: '100%', display: 'flex' }}>
                  <div style={{ width: `${donePct}%`, background: 'var(--green)', transition: 'width 0.6s' }} />
                  <div style={{ width: `${inPct}%`, background: 'var(--yellow)', transition: 'width 0.6s' }} />
                </div>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> Done</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--yellow)', display: 'inline-block' }} /> In Progress</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'inline-block' }} /> To Do</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Overdue */}
        {data.overdue_tasks.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> Overdue Tasks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.overdue_tasks.map(task => (
                <div key={task.id} style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, borderLeft: '3px solid var(--red)', cursor: 'pointer' }}
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

        {/* Recent tasks */}
        <div className="card" style={{ gridColumn: data.overdue_tasks.length > 0 ? 'auto' : '1 / -1' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Recent Tasks</h3>
          {data.recent_tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No tasks yet. Go to a project to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recent_tasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${task.project_id}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.project_name}</div>
                  </div>
                  <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
