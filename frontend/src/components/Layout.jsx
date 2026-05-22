import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={17} /> },
    { label: 'Projects', path: '/projects', icon: <FolderKanban size={17} /> },
  ];

  const doLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>TaskFlow</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team Manager</div>
        </div>
        {/* Close btn visible on mobile only */}
        <button className="mobile-menu-btn" style={{ marginLeft: 'auto' }}
          onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => goTo(item.path)}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <span className={`badge badge-${user?.role}`} style={{ fontSize: 10 }}>{user?.role}</span>
        </div>
        <button className="btn-ghost" style={{ padding: 6 }} onClick={doLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </>
  );

  return (
    <div>
      {/* Mobile topbar */}
      <header className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: 16 }}>TaskFlow</span>
        </div>
        <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </header>

      {/* Overlay when sidebar open on mobile */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
