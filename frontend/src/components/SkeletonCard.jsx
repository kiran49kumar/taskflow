export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div className="skeleton" style={{ width: 60, height: 36, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 80, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
      </div>
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="project-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ width: '70%', height: 18, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 4 }} />
      <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 16 }} />
      <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="skeleton" style={{ width: 80, height: 14 }} />
        <div className="skeleton" style={{ width: 60, height: 14 }} />
      </div>
    </div>
  );
}

export function SkeletonTaskCard() {
  return (
    <div className="task-item">
      <div className="skeleton" style={{ width: '80%', height: 16 }} />
      <div className="skeleton" style={{ width: '60%', height: 13 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 50, height: 22, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 20 }} />
      </div>
    </div>
  );
}
