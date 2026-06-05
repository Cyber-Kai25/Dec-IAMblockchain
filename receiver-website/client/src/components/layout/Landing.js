import React, { Component } from "react";
import { Link } from "react-router-dom";

class Landing extends Component {
  render() {
    return (
      <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>

        {/* Background radial glow — purple */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Badge */}
        <div className="badge-accent animate-fadeInUp mb-4" style={{ fontSize: '0.7rem' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Trustless Verification — Powered by Blockchain & IPFS
        </div>

        {/* Headline */}
        <h1 className="animate-fadeInUp delay-1" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 760, marginBottom: 16 }}>
          Verify <span className="gradient-text">Student Credentials</span><br />Without Trusting a Third Party
        </h1>

        <p className="animate-fadeInUp delay-2" style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Scan a student's QR code, cryptographically verify their credentials on-chain,
          and grant or deny access — all in seconds.
        </p>

        {/* CTAs */}
        <div className="animate-fadeInUp delay-3 d-flex gap-3 flex-wrap justify-content-center" style={{ marginBottom: 64 }}>
          <Link to="/register" className="btn-accent" style={{ padding: '14px 36px', fontSize: '0.95rem', borderRadius: '10px', textDecoration: 'none', display: 'inline-block' }}>
            Get Started
          </Link>
          <Link to="/login" className="btn-ghost" style={{ padding: '14px 36px', fontSize: '0.95rem', borderRadius: '10px', textDecoration: 'none', display: 'inline-block' }}>
            Sign In
          </Link>
        </div>

        {/* Security Flow Diagram */}
        <div className="animate-fadeInUp delay-4" style={{ width: '100%', maxWidth: 700 }}>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            Verification Flow
          </p>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px',
            backdropFilter: 'blur(20px)'
          }}>
            <div className="security-flow">
              {[
                { icon: '🎓', label: 'Student', sub: 'Scans QR' },
                null,
                { icon: '📱', label: 'Wallet', sub: 'Sends VC' },
                null,
                { icon: '⛓️', label: 'Blockchain', sub: 'Verifies' },
                null,
                { icon: '🔍', label: 'IPFS', sub: 'Retrieves' },
                null,
                { icon: '✅', label: 'Access', sub: 'Granted' },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} className="flow-connector active" />
                ) : (
                  <div key={i} className="flow-step">
                    <div className="flow-icon complete">{item.icon}</div>
                    <div className="flow-label complete">{item.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{item.sub}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="animate-fadeInUp delay-5 d-flex gap-3 flex-wrap justify-content-center mt-5">
          {['🔗 Blockchain Verified', '🗂️ IPFS Backed', '🔑 ZK Proofs Ready', '✅ Tamper Proof'].map(b => (
            <span key={b} className="badge-accent" style={{ fontSize: '0.7rem' }}>{b}</span>
          ))}
        </div>
      </div>
    );
  }
}

export default Landing;
