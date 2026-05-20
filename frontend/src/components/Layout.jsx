import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={17} /> },
    { label: 'Projects', path: '/projects', icon: <FolderKanban size={17} /> },
  ];

  const doLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11 }}><span className={`badge badge-${user?.role}`}>{user?.role}</span></div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={doLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
