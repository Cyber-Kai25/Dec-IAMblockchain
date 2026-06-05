import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5050";

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      didInfo: null,
      loading: true
    };
  }

  componentDidMount() {
    const { user } = this.props.auth;
    if (user.isAdmin) {
      axios
        .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
          params: { email: user.email }
        })
        .then((res) => {
          this.setState({ didInfo: res.data, loading: false });
        })
        .catch((err) => {
          console.error("Error fetching DID info:", err);
          this.setState({ loading: false });
        });
    } else {
      this.setState({ loading: false });
    }
  }

  render() {
    const { user } = this.props.auth;
    const { didInfo, loading } = this.state;
    const hasDid = didInfo && didInfo.did;

    return (
      <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
        {/* Welcome Section */}
        <div className="animate-fadeInUp mb-5">
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="badge-accent" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {user.isAdmin ? "Receiver Control Panel" : "Student Portal"}
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="status-dot green"></span>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-purple)", fontWeight: 600 }}>Connection Secure</span>
            </div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.02em" }}>
            Hello, <span className="gradient-text">{user.name.split(" ")[0]}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px" }}>
            {user.isAdmin 
              ? "Verify student credentials cryptographically on-chain, manage organization DIDs, and inspect credential metadata."
              : "Generate a Verification session, verify your credentials with the institution, and prove authentication securely."}
          </p>
        </div>

        {/* Dynamic Cards Grid based on role */}
        <div className="row g-4 mb-5 animate-fadeInUp delay-1">
          {user.isAdmin ? (
            <>
              {/* DID Card */}
              <div className="col-md-6">
                <div className="auth-card h-100" style={{ padding: "24px" }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", color: "var(--accent-purple)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </div>
                    <span className={`status-badge ${hasDid ? "success" : "warning"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px", fontWeight: 600, background: hasDid ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", color: hasDid ? "var(--accent-green)" : "#f59e0b" }}>
                      <span className="status-dot" style={{ background: hasDid ? "var(--accent-green)" : "#f59e0b", boxShadow: hasDid ? "0 0 8px var(--accent-green)" : "none" }}></span>
                      {loading ? "Loading..." : hasDid ? "Active DID" : "No DID"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Organization DID</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                    {hasDid ? `Registered: ${didInfo.did.substring(0, 25)}...` : "Setup a Decentralized Identifier to authenticate this portal's verifications on-chain."}
                  </p>
                  {!hasDid && !loading && (
                    <Link to="/createDid" className="btn-accent text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                      Setup DID
                    </Link>
                  )}
                </div>
              </div>

              {/* Inspect Credentials Card */}
              <div className="col-md-6">
                <div className="auth-card h-100" style={{ padding: "24px" }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", color: "var(--accent-purple)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Shared Credentials</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                    View and verify all cryptographically validated student credentials that have been shared with this portal.
                  </p>
                  <Link to="/credentials" className="btn-ghost text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                    Inspect Credentials
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Verification Card */}
              <div className="col-md-6">
                <div className="auth-card h-100" style={{ padding: "24px" }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", color: "var(--accent-purple)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Verification Portal</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                    Generate a secure QR code that the verifier can scan to verify your credential and check integrity directly.
                  </p>
                  <Link to="/verification" className="btn-accent text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                    Start Verification
                  </Link>
                </div>
              </div>

              {/* Cryptographic Help Card */}
              <div className="col-md-6">
                <div className="auth-card h-100" style={{ padding: "24px" }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.1)", color: "var(--accent-purple)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>How Verification Works</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                    We verify your academic certificates directly against the issuer's public key anchored on the blockchain. 
                    Your private wallet keys stay securely under your control on your mobile device.
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "12px", borderTop: "1px solid var(--border-glass)", paddingTop: "12px" }}>
                    🔐 Zero Knowledge & Cryptographic Proofs Enabled
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Visual Info Banner */}
        <div className="animate-fadeInUp delay-2" style={{
          background: "linear-gradient(90deg, rgba(124, 58, 237, 0.05) 0%, rgba(10, 22, 40, 0.4) 100%)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
          padding: "30px",
          backdropFilter: "blur(20px)"
        }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h4 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Privacy Shield Action</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                Your data is cryptographically hashed. We do not store student PII (Personally Identifiable Information) in a centralized registry.
                Verification happens peer-to-peer over secure channels via IPFS content addressing.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <span className="badge-accent" style={{ background: "rgba(124, 58, 237, 0.15)", color: "var(--accent-purple)", padding: "10px 20px", fontSize: "0.8rem", borderRadius: "30px", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
                🛡️ IPFS Immutable Verification
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(Dashboard);
