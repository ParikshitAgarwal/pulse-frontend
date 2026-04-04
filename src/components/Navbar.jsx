import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo" onClick={closeMenu}>
          VaultScreen
        </Link>

        {/* Desktop links */}
        <div className="navbar-links desktop-only">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          {(user?.role === 'editor' || user?.role === 'admin') && (
            <Link
              to="/upload"
              className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
            >
              Upload
            </Link>
          )}
        </div>

        {/* Desktop right */}
        <div className="navbar-right desktop-only">
          <div className="nav-user">
            <span className="nav-user-name">{user?.name}</span>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* User info */}
          <div className="mobile-user">
            <span className="mobile-user-name">{user?.name}</span>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>

          <div className="mobile-divider" />

          {/* Nav links */}
          <Link
            to="/dashboard"
            className={`mobile-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Dashboard
          </Link>

          {(user?.role === 'editor' || user?.role === 'admin') && (
            <Link
              to="/upload"
              className={`mobile-link ${isActive('/upload') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Upload
            </Link>
          )}

          <div className="mobile-divider" />

          <button onClick={handleLogout} className="mobile-logout">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}