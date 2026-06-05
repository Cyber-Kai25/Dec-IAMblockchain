import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5000";

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
              Control Panel
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="status-dot green"></span>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600 }}>System Secure</span>
            </div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.02em" }}>
            Hello, <span className="gradient-text">{user.name.split(" ")[0]}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px" }}>
            Manage decentralized identities, create schema templates, and securely issue blockchain-anchored credentials to students.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5 animate-fadeInUp delay-1">
          {/* DID Status Card */}
          <div className="col-md-4">
            <div className="auth-card h-100" style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)" }}>
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
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Decentralized ID</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                {hasDid ? `Registered: ${didInfo.did.substring(0, 25)}...` : "Generate a Decentralized Identifier to anchor your organization on-chain."}
              </p>
              {!hasDid && !loading && (
                <Link to="/createDid" className="btn-accent text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                  Setup DID
                </Link>
              )}
            </div>
          </div>

          {/* Schema Builder Card */}
          <div className="col-md-4">
            <div className="auth-card h-100" style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Schemas</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                Define templates for verifiable credentials (e.g. Degree Certificates) specifying required claim attributes.
              </p>
              <Link to="/createSchema" className="btn-ghost text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                Build Schema
              </Link>
            </div>
          </div>

          {/* Credential Issuance Card */}
          <div className="col-md-4">
            <div className="auth-card h-100" style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Credentials</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flexGrow: 1 }}>
                Issue cryptographic credentials, store them on IPFS, and sign them with your DID keys for students.
              </p>
              <Link to="/credentials" className="btn-ghost text-center mt-3" style={{ fontSize: "0.85rem", padding: "8px", textDecoration: "none" }}>
                Issue Credentials
              </Link>
            </div>
          </div>
        </div>

        {/* Security Visual Info Banner */}
        <div className="animate-fadeInUp delay-2" style={{
          background: "linear-gradient(90deg, rgba(0, 212, 255, 0.05) 0%, rgba(10, 22, 40, 0.4) 100%)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
          padding: "30px",
          backdropFilter: "blur(20px)"
        }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h4 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Security Best Practice</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                Decentralized Identifiers (DIDs) are globally unique resolved identifiers stored securely. 
                Always ensure your private keys are stored offline or in a hardware module. Never share private keys over unencrypted channels.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <span className="badge-accent" style={{ background: "rgba(0, 212, 255, 0.15)", color: "var(--accent-cyan)", padding: "10px 20px", fontSize: "0.8rem", borderRadius: "30px", border: "1px solid rgba(0, 212, 255, 0.25)" }}>
                🔐 SHA-256 Enabled
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
