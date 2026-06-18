import React, { useState, useEffect, useCallback } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5000";

// ─────────────────────────────────────────────
// Sub-component: Animated stat card
// ─────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, loading }) => (
  <div className="stat-card animate-fadeInUp">
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-value">{loading ? "—" : value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ─────────────────────────────────────────────
// Sub-component: Pure-CSS bar chart
// ─────────────────────────────────────────────
const IssuanceChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {data.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "24px 0" }}>
          No credentials issued yet.
        </p>
      ) : (
        data.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              title={item.name}
              style={{
                minWidth: "120px",
                maxWidth: "140px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "right",
              }}
            >
              {item.name}
            </span>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                borderRadius: "6px",
                height: "26px",
                overflow: "hidden",
                border: "1px solid var(--border-glass)",
              }}
            >
              <div
                style={{
                  width: `${Math.max((item.count / max) * 100, item.count > 0 ? 3 : 0)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent-dark), var(--accent-cyan))",
                  borderRadius: "6px",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "8px",
                  minWidth: item.count > 0 ? "32px" : "0",
                }}
              >
                {item.count > 0 && (
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#050d1a", whiteSpace: "nowrap" }}>
                    {item.count}
                  </span>
                )}
              </div>
            </div>
            {item.count === 0 && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>0</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const AdminDashboard = ({ auth }) => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Revocation panel state
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCredDid, setSelectedCredDid] = useState("");

  // Confirmation modal
  const [revokeTarget, setRevokeTarget] = useState(null);

  // Revocation status
  const [revoking, setRevoking] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState(null);

  // ── Fetch stats from issuer server ──
  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/stats`)
      .then((res) => {
        setStats(res.data);
        setStatsLoading(false);
      })
      .catch((err) => {
        console.error("Stats fetch error:", err);
        setStatsLoading(false);
      });
  }, []);

  // ── Fetch ALL wallet-app students from ISSUER server ──
  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/allStudents`)
      .then((res) => {
        const data = res.data.students || [];
        setStudents(data);
        setFilteredStudents(data);
        setStudentsLoading(false);
      })
      .catch((err) => {
        console.error("Students fetch error:", err);
        setStudentsLoading(false);
      });
  }, []);

  // ── Filter students on search ──
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.studentId && s.studentId.includes(q))
        )
      );
    }
    setSelectedStudent(null);
    setSelectedCredDid("");
    setRevokeMsg(null);
  }, [searchQuery, students]);

  // ── Revocation confirm handler ──
  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    setRevokeMsg(null);
    try {
      await axios.post(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/revokeByAdmin`, {
        credDID: revokeTarget.credDID,
        receiverDID: revokeTarget.receiverDID,
      });
      setRevokeMsg({ type: "success", text: `Credential "${revokeTarget.credName}" successfully revoked for ${revokeTarget.studentName}.` });
      setRevokeTarget(null);
      setSelectedCredDid("");
      // Refresh stats
      axios.get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/stats`).then((r) => setStats(r.data));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Revocation failed.";
      setRevokeMsg({ type: "error", text: msg });
      setRevokeTarget(null);
    } finally {
      setRevoking(false);
    }
  }, [revokeTarget]);

  // ── Guard ──
  if (!auth.user.isAdmin) {
    return (
      <div className="container py-5 text-center">
        <h3 style={{ color: "var(--danger)" }}>Access Denied</h3>
        <p style={{ color: "var(--text-secondary)" }}>This page is restricted to administrators.</p>
      </div>
    );
  }

  const selectedStudentCreds = selectedStudent?.credentials || [];

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>

      {/* ── Page Header ── */}
      <div className="animate-fadeInUp mb-5">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="badge-accent" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Admin Only
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="status-dot green"></span>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600 }}>Live Data</span>
          </div>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.02em" }}>
          Analytics &amp; <span className="gradient-text">Revocation</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px" }}>
          Real-time system metrics and one-click credential revocation for wallet-app students.
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="row g-4 mb-5 animate-fadeInUp delay-1">
        <div className="col-md-4">
          <StatCard icon="👥" label="Issuer-Registered Users" value={stats?.userCount ?? 0} color="cyan" loading={statsLoading} />
        </div>
        <div className="col-md-4">
          <StatCard icon="📋" label="Credential Schemas" value={stats?.schemaCount ?? 0} color="green" loading={statsLoading} />
        </div>
        <div className="col-md-4">
          <StatCard icon="🏆" label="Total Credentials Issued" value={stats?.totalIssued ?? 0} color="purple" loading={statsLoading} />
        </div>
      </div>

      {/* ── Issuance Chart ── */}
      <div className="animate-fadeInUp delay-2 mb-5">
        <div className="auth-card" style={{ padding: "30px", maxWidth: "100%" }}>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 style={{ fontWeight: 700, margin: 0 }}>
                Credentials Issued <span className="gradient-text">per Schema</span>
              </h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                Breakdown of total credential issuances across all templates
              </p>
            </div>
            <span style={{ fontSize: "0.72rem", padding: "4px 12px", borderRadius: "20px", background: "rgba(0,212,255,0.08)", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.2)", fontWeight: 600 }}>
              LIVE
            </span>
          </div>
          {statsLoading ? (
            <div className="text-center py-4"><PulseLoader size={10} color="var(--accent-cyan)" /></div>
          ) : (
            <IssuanceChart data={stats?.schemaBreakdown || []} />
          )}
        </div>
      </div>

      {/* ── Revocation Panel ── */}
      <div className="animate-fadeInUp delay-2">
        <div className="auth-card" style={{ padding: "30px", maxWidth: "100%" }}>
          <div className="mb-4">
            <h4 style={{ fontWeight: 700, margin: 0, marginBottom: "6px" }}>
              One-Click <span className="gradient-text">Credential Revocation</span>
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
              Search for a wallet-app student by name, email, or student ID. Select a credential to revoke.
            </p>
          </div>

          {/* Status message */}
          {revokeMsg && (
            <div
              style={{
                padding: "14px 18px", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 500, marginBottom: "20px",
                background: revokeMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${revokeMsg.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: revokeMsg.type === "success" ? "var(--accent-green)" : "#ef4444",
                display: "flex", alignItems: "center", gap: "10px",
              }}
            >
              <span>{revokeMsg.type === "success" ? "✅" : "❌"}</span>
              {revokeMsg.text}
              <button onClick={() => setRevokeMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>
          )}

          <div className="row g-4">
            {/* ── Left: student search ── */}
            <div className="col-lg-5">
              <label className="auth-label">Search Wallet-App Student</label>
              <input
                id="student-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email or student ID..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)",
                  borderRadius: "8px", padding: "10px 14px", color: "var(--text-primary)", fontSize: "0.9rem",
                  marginBottom: "12px", outline: "none",
                }}
              />
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }} className="custom-scrollbar">
                {studentsLoading ? (
                  <div className="text-center py-3"><PulseLoader size={8} color="var(--accent-cyan)" /></div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", background: "rgba(10,22,40,0.3)", borderRadius: "8px", border: "1px dashed var(--border-glass)" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {students.length === 0
                        ? "No wallet-app students found. Students must register on the receiver portal first."
                        : "No students match your search."}
                    </span>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id || student.email}
                      onClick={() => {
                        setSelectedStudent(student);
                        setSelectedCredDid("");
                        setRevokeMsg(null);
                      }}
                      style={{
                        padding: "12px 14px", borderRadius: "8px", cursor: "pointer",
                        border: `1px solid ${selectedStudent?.email === student.email ? "var(--accent-cyan)" : "var(--border-glass)"}`,
                        background: selectedStudent?.email === student.email ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                          {student.name}
                        </div>
                        <span style={{
                          fontSize: "0.65rem", padding: "2px 7px", borderRadius: "10px", fontWeight: 600,
                          background: student.credentials.length > 0 ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                          color: student.credentials.length > 0 ? "var(--accent-green)" : "var(--text-muted)",
                          border: `1px solid ${student.credentials.length > 0 ? "rgba(16,185,129,0.25)" : "var(--border-glass)"}`,
                        }}>
                          {student.credentials.length} cred{student.credentials.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {student.email} · ID: {student.studentId}
                      </div>
                      {student.did ? (
                        <div className="text-monospace" style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", marginTop: "4px", wordBreak: "break-all" }}>
                          {student.did.substring(0, 35)}...
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.68rem", color: "#f59e0b", marginTop: "4px" }}>⚠️ No DID yet</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Right: credential picker + revoke ── */}
            <div className="col-lg-7">
              {!selectedStudent ? (
                <div style={{
                  height: "100%", minHeight: "200px", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", background: "rgba(10,22,40,0.3)",
                  borderRadius: "12px", border: "1px dashed var(--border-glass)", padding: "40px", textAlign: "center",
                }}>
                  <span style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</span>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                    Select a student from the list to manage their credentials.
                  </p>
                </div>
              ) : (
                <div style={{ background: "rgba(10,22,40,0.4)", borderRadius: "12px", border: "1px solid var(--border-glass)", padding: "24px" }}>
                  {/* Student header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent-dark), var(--accent-cyan))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "1rem", color: "#050d1a", flexShrink: 0,
                    }}>
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{selectedStudent.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {selectedStudent.email} · ID: {selectedStudent.studentId}
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(null); setSelectedCredDid(""); setRevokeMsg(null); }}
                      style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", flexShrink: 0 }}
                    >✕</button>
                  </div>

                  {/* DID display */}
                  {selectedStudent.did && (
                    <div style={{ marginBottom: "16px" }}>
                      <label className="auth-label">Student DID (on-chain)</label>
                      <div className="text-monospace" style={{
                        fontSize: "0.75rem", color: "var(--accent-cyan)", background: "rgba(0,212,255,0.05)",
                        padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(0,212,255,0.15)", wordBreak: "break-all",
                      }}>
                        {selectedStudent.did}
                      </div>
                    </div>
                  )}

                  {/* Credential picker */}
                  {selectedStudentCreds.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "rgba(10,22,40,0.4)", borderRadius: "8px", border: "1px dashed var(--border-glass)" }}>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        This student has not presented any credentials to the receiver portal yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="auth-label" style={{ marginBottom: "8px", display: "block" }}>
                        Select Credential to Revoke
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", maxHeight: "200px", overflowY: "auto" }} className="custom-scrollbar">
                        {selectedStudentCreds.map((cred, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedCredDid(cred.credDid)}
                            style={{
                              padding: "12px 14px", borderRadius: "8px", cursor: "pointer",
                              border: `1px solid ${selectedCredDid === cred.credDid ? "rgba(239,68,68,0.5)" : "var(--border-glass)"}`,
                              background: selectedCredDid === cred.credDid ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                {cred.credName}
                              </div>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{cred.date}</span>
                            </div>
                            <div className="text-monospace" style={{ fontSize: "0.68rem", color: selectedCredDid === cred.credDid ? "#ef4444" : "var(--text-muted)", marginTop: "4px", wordBreak: "break-all" }}>
                              {cred.credDid}
                            </div>
                            {/* Show DID status per credential */}
                            {cred.ownerDid ? (
                              <div className="text-monospace" style={{ fontSize: "0.65rem", color: "rgba(16,185,129,0.7)", marginTop: "3px" }}>
                                ✓ Wallet DID: {cred.ownerDid.substring(0, 28)}...
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.65rem", color: "#f59e0b", marginTop: "3px" }}>
                                ⚠️ Owner DID missing
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        id="revoke-btn"
                        disabled={!selectedCredDid || revoking || !selectedStudentCreds.find(c => c.credDid === selectedCredDid)?.ownerDid}
                        onClick={() => {
                          const cred = selectedStudentCreds.find((c) => c.credDid === selectedCredDid);
                          if (!cred?.ownerDid) return;
                          setRevokeTarget({
                            credDID: selectedCredDid,
                            receiverDID: cred.ownerDid,   // ← use per-credential ownerDid
                            studentName: selectedStudent.name,
                            credName: cred?.credName || "Credential",
                          });
                        }}
                        style={{
                          width: "100%", padding: "12px", borderRadius: "8px",
                          border: `1px solid ${selectedCredDid && selectedStudentCreds.find(c => c.credDid === selectedCredDid)?.ownerDid ? "rgba(239,68,68,0.4)" : "var(--border-glass)"}`,
                          background: selectedCredDid && selectedStudentCreds.find(c => c.credDid === selectedCredDid)?.ownerDid ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.04)",
                          color: selectedCredDid && selectedStudentCreds.find(c => c.credDid === selectedCredDid)?.ownerDid ? "#ef4444" : "var(--text-muted)",
                          fontWeight: 700, fontSize: "0.9rem",
                          cursor: selectedCredDid && selectedStudentCreds.find(c => c.credDid === selectedCredDid)?.ownerDid ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                      >
                        🚫 Revoke Selected Credential
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {revokeTarget && (
        <div className="admin-revoke-overlay">
          <div className="admin-revoke-modal animate-fadeInUp">
            <div style={{ fontSize: "2.5rem", marginBottom: "12px", textAlign: "center" }}>⚠️</div>
            <h4 style={{ fontWeight: 800, marginBottom: "8px", textAlign: "center" }}>Confirm Revocation</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, textAlign: "center", marginBottom: "20px" }}>
              You are about to permanently revoke{" "}
              <strong style={{ color: "#ef4444" }}>"{revokeTarget.credName}"</strong>{" "}
              for <strong style={{ color: "var(--text-primary)" }}>{revokeTarget.studentName}</strong>.
              <br />
              This updates the on-chain ACL and <strong>cannot be undone</strong>.
            </p>

            <div style={{ background: "rgba(10,22,40,0.6)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px 14px", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Credential DID</div>
              <div className="text-monospace" style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                {revokeTarget.credDID}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                id="confirm-revoke-btn"
                onClick={handleRevoke}
                disabled={revoking}
                style={{
                  flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.5)",
                  background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 700,
                  cursor: revoking ? "not-allowed" : "pointer", fontSize: "0.875rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {revoking ? <PulseLoader size={6} color="#ef4444" /> : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AdminDashboard.propTypes = { auth: PropTypes.object.isRequired };

const mapStateToProps = (state) => ({ auth: state.auth });

export default connect(mapStateToProps)(AdminDashboard);
