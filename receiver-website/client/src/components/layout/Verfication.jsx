import React, { useState, useEffect } from "react";
import { QRCode } from "react-qr-svg";
import { useSelector } from "react-redux";
import axios from "axios";
import socketio from "socket.io-client";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5050";

const Verification = () => {
  const localUserData = useSelector((state) => state.auth.user);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [toastMssg, setToastMssg] = useState("");
  const [sharedCreds, setSharedCred] = useState([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
        params: { email: localUserData.email },
      })
      .then((response) => {
        axios
          .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
            params: { email: "admin@admin.com" },
          })
          .then((res) => {
            setQrCode(
              JSON.stringify({
                url: `http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/send`,
                userId: response.data.studentId,
                receiverDid: res.data.did,
                receiverName: res.data.orgName || "Authorized Institution",
              })
            );
            axios
              .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/getByUser/${localUserData.email}`)
              .then((res) => {
                setSharedCred(res.data.creds || []);
              })
              .catch((err) => console.error("Error fetching credentials:", err));
          });
      })
      .catch((err) => console.error("Error fetching user info:", err));
  }, [localUserData.email]);

  const onClick = (event) => {
    event.preventDefault();
    const socketEndpoint = `http://${LOCAL_IP}:${BACKEND_PORT}`;
    const socket = socketio(socketEndpoint);
    setListening(true);
    socket.on("connect", () => {
      console.log("connected via socket io");
      socket.emit("checkUpdate", localUserData.email);
    });
    socket.on("credentialUpdated", () => {
      setToastMssg("Credential Access Rights Given");
      setShowQrCode(false);
      setListening(false);
      socket.disconnect();
      // Refetch shared credentials list
      axios
        .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/getByUser/${localUserData.email}`)
        .then((res) => {
          setSharedCred(res.data.creds || []);
        });
    });
    socket.on("credentialAdded", () => {
      setToastMssg("Credential Received");
      setShowQrCode(false);
      setListening(false);
      socket.disconnect();
      // Refetch shared credentials list
      axios
        .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/getByUser/${localUserData.email}`)
        .then((res) => {
          setSharedCred(res.data.creds || []);
        });
    });
    setShowQrCode(true);
  };

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
      {/* ── Large Centered Notification Modal ── */}
      {toastMssg !== "" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5, 13, 26, 0.75)",
            backdropFilter: "blur(10px)",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setToastMssg("")}
        >
          <div
            style={{
              background: "rgba(10, 22, 40, 0.95)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "24px",
              padding: "52px 60px",
              textAlign: "center",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 0 60px rgba(16,185,129,0.25), 0 30px 80px rgba(0,0,0,0.5)",
              animation: "fadeInUp 0.35s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Big checkmark icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(16,185,129,0.15)",
                border: "2px solid rgba(16,185,129,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px auto",
                fontSize: "2.4rem",
                boxShadow: "0 0 32px rgba(16,185,129,0.3)",
              }}
            >
              ✅
            </div>

            <h2
              style={{
                fontWeight: 800,
                fontSize: "1.8rem",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              {toastMssg}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "28px", lineHeight: 1.6 }}>
              The credential has been successfully verified on-chain and accepted by the receiver portal.
            </p>

            <button
              onClick={() => setToastMssg("")}
              style={{
                padding: "12px 40px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, var(--success), #059669)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              Got it
            </button>

            <p style={{ marginTop: "16px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Click anywhere or press Got it to dismiss
            </p>
          </div>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          
          {/* Header */}
          <div className="animate-fadeInUp text-center mb-5">
            <span className="badge-accent mb-2" style={{ display: "inline-block" }}>
              Secure Exchange
            </span>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.02em" }}>
              Verify Your <span className="gradient-text">Credentials</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
              Request verifications and share cryptographically signed proofs with authorized organizations securely.
            </p>
          </div>

          {/* QR Display Card */}
          <div className="auth-card animate-fadeInUp delay-1 mb-5" style={{ padding: "30px", textAlign: "center" }}>
            <h5 style={{ fontWeight: 700, marginBottom: "16px" }}>Student Verification Session</h5>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "460px", margin: "0 auto 24px auto" }}>
              Generate a one-time connection token. Scan with your mobile wallet app to present your academic credential keys.
            </p>

            {showQrCode ? (
              <div className="d-flex flex-column align-items-center">
                <div style={{
                  background: "#fff",
                  padding: "16px",
                  borderRadius: "12px",
                  display: "inline-block",
                  boxShadow: "0 0 24px rgba(124, 58, 237, 0.25)",
                  marginBottom: "16px"
                }}>
                  <QRCode
                    bgColor="#FFFFFF"
                    fgColor="#050d1a"
                    level="Q"
                    style={{ width: 200, height: 200 }}
                    value={qrCode}
                  />
                </div>
                {listening && (
                  <div className="d-flex align-items-center gap-2" style={{
                    background: "rgba(124, 58, 237, 0.08)",
                    border: "1px solid rgba(124, 58, 237, 0.15)",
                    padding: "6px 16px",
                    borderRadius: "30px",
                    fontSize: "0.82rem"
                  }}>
                    <span className="status-dot purple-pulse"></span>
                    <span style={{ color: "var(--accent-purple)", fontWeight: 600 }}>Awaiting Wallet Connection...</span>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onClick} className="btn-accent" style={{ padding: "12px 30px" }}>
                Generate Session QR Code
              </button>
            )}
          </div>

          {/* History Section */}
          <div className="auth-card animate-fadeInUp delay-2" style={{ padding: "30px" }}>
            <h4 style={{ fontWeight: 800, marginBottom: "20px", fontSize: "1.25rem" }}>Previously Shared Credentials</h4>

            {sharedCreds.length === 0 ? (
              <div className="text-center py-4" style={{ background: "rgba(10,22,40,0.3)", borderRadius: "8px", border: "1px dashed var(--border-glass)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                  No credentials have been shared in this portal yet.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table custom-table align-middle" style={{ color: "var(--text-primary)", background: "transparent" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                      <th style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, paddingBottom: 12 }}>Credential Name</th>
                      <th style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, paddingBottom: 12 }}>User ID</th>
                      <th style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, paddingBottom: 12 }}>Shared Date</th>
                      <th className="text-end" style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, paddingBottom: 12 }}>Access Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedCreds.map((cred, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ fontWeight: 600, padding: "14px 0" }}>{cred.credName}</td>
                        <td className="text-monospace" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{cred.studentId}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{cred.date}</td>
                        <td className="text-end" style={{ padding: "14px 0" }}>
                          {cred.credAccess ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 12px",
                              borderRadius: "20px",
                              background: "rgba(16, 185, 129, 0.08)",
                              color: "var(--accent-green)",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              border: "1px solid rgba(16, 185, 129, 0.15)"
                            }}>
                              ✓ Verified Active
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 12px",
                              borderRadius: "20px",
                              background: "rgba(239, 68, 68, 0.08)",
                              color: "#ef4444",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              border: "1px solid rgba(239, 68, 68, 0.15)"
                            }}>
                              ✗ Access Revoked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Verification;
