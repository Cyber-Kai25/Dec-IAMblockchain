import React, { useState, useEffect } from "react";
import { QRCode } from "react-qr-svg";
import { Modal } from "react-bootstrap";
import axios from "axios";
import { useSelector } from "react-redux";
import PulseLoader from "react-spinners/PulseLoader";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5000";

const CredentialList = () => {
  const localUserData = useSelector((state) => state.auth.user);
  const [userData, setUserData] = useState({});
  const [credList, setCredList] = useState([]);
  const [show, setShow] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
        params: { email: localUserData.email },
      })
      .then((response) => {
        setUserData(response.data);
        axios
          .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/schema/getAll`)
          .then((res) => {
            setCredList(res.data.schemas || []);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching schemas:", error);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
        setLoading(false);
      });
  }, [localUserData.email]);

  const onGenerateQr = (e, index) => {
    e.preventDefault();
    setShow(true);
    const link = `http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/create`;
    setQrValue(
      JSON.stringify({
        url: link,
        schemaDid: credList[index].did,
        userId: userData.studentId,
      })
    );
  };

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
      {/* QR Code Modal OVERRIDE */}
      <Modal
        show={show}
        onHide={() => setShow(false)}
        centered
        dialogClassName="custom-modal-dialog"
        contentClassName="custom-modal-content"
      >
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
          padding: "30px",
          backdropFilter: "blur(20px)",
          textAlign: "center"
        }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 style={{ fontWeight: 800, margin: 0 }} className="gradient-text">Credential QR Issuer</h4>
            <button
              onClick={() => setShow(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            display: "inline-block",
            marginBottom: "20px",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)"
          }}>
            <QRCode
              bgColor="#FFFFFF"
              fgColor="#050d1a"
              level="Q"
              style={{ width: 220, height: 220 }}
              value={qrValue}
            />
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 auto", maxWidth: "280px" }}>
            Scan this QR code using your <strong>Decentralized Wallet App</strong> to request and download the verifiable credential.
          </p>

          <div className="security-badge mt-4" style={{ display: "inline-flex", gap: 6 }}>
            🔒 Secure Cryptographic Endpoint
          </div>
        </div>
      </Modal>

      {/* Main Page Layout */}
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">

          <div className="animate-fadeInUp text-center mb-5">
            <span className="badge-accent mb-2" style={{ display: "inline-block" }}>
              Active Templates
            </span>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.02em" }}>
              Available <span className="gradient-text">Credentials</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Browse verified credential schemas. If you are a student, generate a QR code to download signed proofs.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <PulseLoader size={12} color="var(--accent-cyan)" />
            </div>
          ) : credList.length === 0 ? (
            <div className="text-center py-5" style={{ background: "rgba(10,22,40,0.3)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-glass)" }}>
              <p style={{ color: "var(--text-muted)" }}>No credential schemas have been created yet by the admin.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 animate-fadeInUp delay-1">
              {credList.map((value, ind) => (
                <div
                  key={ind}
                  className="auth-card"
                  style={{
                    padding: "24px 30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 16
                  }}
                >
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                        {value.name}
                      </h3>
                      <span className="text-monospace" style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", background: "rgba(0, 212, 255, 0.08)", padding: "2px 8px", borderRadius: "4px" }}>
                        DID: {value.did.substring(0, 15)}...
                      </span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                      {value.description}
                    </p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: "1px solid rgba(0, 212, 255, 0.05)" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {value.properties && value.properties.map((p, pIdx) => (
                        <span key={pIdx} className="text-monospace" style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          {p.key}
                        </span>
                      ))}
                    </div>

                    {!localUserData.isAdmin && (
                      <button
                        onClick={(e) => onGenerateQr(e, ind)}
                        className="btn-accent"
                        style={{ padding: "8px 20px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                      >
                        Generate QR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CredentialList;
