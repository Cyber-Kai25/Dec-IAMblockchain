import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../actions/authActions";

const NavBar = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const onLogout = (e) => {
    e.preventDefault();
    dispatch(logoutUser());
  };

  return (
    <nav className="iam-navbar navbar navbar-expand-lg">
      <div className="container-fluid px-4">
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center" href="/">
          <span className="navbar-brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#050d1a' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span className="navbar-brand-text">Issuer Portal</span>
        </a>

        {isAuthenticated && (
          <>
            {/* Nav links */}
            <div className="d-flex align-items-center gap-1 me-auto ms-3">
              <a href="/dashboard" className="nav-link-custom">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Dashboard
              </a>
              {user.isAdmin && (
                <>
                  <a href="/createSchema" className="nav-link-custom">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    Schema
                  </a>
                  <a href="/createDid" className="nav-link-custom">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    DID
                  </a>
                </>
              )}
              <a href="/credentials" className="nav-link-custom">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Credentials
              </a>
            </div>

            {/* Right side */}
            <div className="d-flex align-items-center gap-3">
              <div className="user-chip">
                <span className="status-dot" />
                <span>{user.name}</span>
                {user.isAdmin && (
                  <span className="badge-accent ms-1" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Admin</span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="btn-ghost"
                style={{ padding: '7px 18px', fontSize: '0.82rem' }}
              >
                Sign Out
              </button>
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="d-flex align-items-center gap-2 ms-auto">
            <a href="/login" className="btn-ghost" style={{ padding: '7px 18px', fontSize: '0.82rem', textDecoration: 'none' }}>Sign In</a>
            <a href="/register" className="btn-accent" style={{ padding: '7px 18px', fontSize: '0.82rem', textDecoration: 'none', borderRadius: '8px', display: 'inline-block' }}>Register</a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
