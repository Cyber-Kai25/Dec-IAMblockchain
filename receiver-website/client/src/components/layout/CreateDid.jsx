import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5050";

const CreateSchema = () => {
  const [isLoading, setIsLoading] = useState(false);
  const userEmail = useSelector((state) => state.auth.user.email);
  const [copiedField, setCopiedField] = useState("");
  const [user, setUser] = useState({
    orgName: "",
    address: "",
    publicKey: "",
    privateKey: "",
    did: "",
  });

  const [input, setInput] = useState({
    orgName: "",
    address: "",
    publicKey: "",
    privateKey: "",
  });

  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
        params: { email: userEmail },
      })
      .then((res) => {
        const data = res.data;
        setUser({
          orgName: data.orgName,
          address: data.address,
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          did: data.did,
        });
      })
      .catch((err) => console.error("Error fetching user info:", err));
  }, [userEmail]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));

    if (name === "privateKey") {
      const hexRegex = /^(0x)?[0-9a-fA-F]{64}$/;
      if (hexRegex.test(value)) {
        axios
          .post(`http://${LOCAL_IP}:${BACKEND_PORT}/api/did/derivePublicKey`, { privateKey: value })
          .then((res) => {
            if (res.data && res.data.publicKey) {
              setInput((prev) => ({ ...prev, publicKey: res.data.publicKey }));
            }
          })
          .catch((err) => {
            console.error("Error deriving public key:", err);
          });
      }
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    axios
      .post(`http://${LOCAL_IP}:${BACKEND_PORT}/api/did/create`, {
        email: userEmail,
        orgName: input.orgName,
        address: input.address,
        publicKey: input.publicKey,
        privateKey: input.privateKey,
      })
      .then((res) => {
        const data = res.data;
        setUser({
          orgName: data.orgName,
          address: data.address,
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          did: data.did,
        });
        setInput({
          orgName: "",
          address: "",
          publicKey: "",
          privateKey: "",
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error creating DID:", err);
        setIsLoading(false);
      });
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          
          {/* Page Header */}
          <div className="animate-fadeInUp mb-4 text-center">
            <span className="badge-accent mb-2" style={{ display: "inline-block" }}>
              Decentralized Identity
            </span>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.02em" }}>
              Manage Receiver <span className="gradient-text">DID</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
              Configure your receiver node credentials to verify certificates peer-to-peer and establish authenticated sessions.
            </p>
          </div>

          {/* Security Flow Diagram */}
          <div className="animate-fadeInUp delay-1 mb-5" style={{ width: "100%" }}>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 32px",
              backdropFilter: "blur(20px)"
            }}>
              <div className="security-flow">
                {[
                  { icon: "📝", label: "Provide Details", active: true },
                  null,
                  { icon: "🔑", label: "Generate Keys", active: isLoading || !!user.did },
                  null,
                  { icon: "⛓️", label: "Anchor Chain", active: isLoading || !!user.did },
                  null,
                  { icon: "✅", label: "DID Active", active: !!user.did },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} className={`flow-connector ${isLoading || !!user.did ? "active" : ""}`} />
                  ) : (
                    <div key={i} className="flow-step">
                      <div className={`flow-icon ${item.active ? "complete" : ""}`}>{item.icon}</div>
                      <div className={`flow-label ${item.active ? "complete" : ""}`}>{item.label}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Card Wrapper */}
          <div className="auth-card animate-fadeInUp delay-2" style={{ padding: "32px" }}>
            {isLoading ? (
              <div className="text-center py-5">
                <h3 className="gradient-text mb-3" style={{ fontWeight: 700 }}>Anchoring DID Document...</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>
                  Generating RSA key pairs and broadcasting state update transaction on the blockchain.
                </p>
                <PulseLoader size={12} color="var(--accent-purple)" margin={6} />
              </div>
            ) : (
              <>
                {user.did ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-glass)" }}>
                      <h4 style={{ fontWeight: 700, margin: 0 }}>Active Identity</h4>
                      <span className="badge-accent" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-green)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                        ● Blockchain Anchored
                      </span>
                    </div>

                    <div className="row g-4">
                      {/* Organization Name */}
                      <div className="col-12">
                        <div style={{ background: "rgba(10, 22, 40, 0.4)", padding: "16px 20px", borderRadius: "8px", border: "1px solid rgba(0, 212, 255, 0.05)" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                            Organization Name
                          </label>
                          <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>{user.orgName}</span>
                        </div>
                      </div>

                      {/* DID ID */}
                      <div className="col-12">
                        <div style={{ background: "rgba(10, 22, 40, 0.4)", padding: "16px 20px", borderRadius: "8px", border: "1px solid rgba(0, 212, 255, 0.05)", position: "relative" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                            Decentralized Identifier (DID)
                          </label>
                          <span className="text-monospace" style={{ fontSize: "0.9rem", wordBreak: "break-all", paddingRight: "40px", display: "block" }}>{user.did}</span>
                          <button
                            onClick={() => copyToClipboard(user.did, "did")}
                            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: copiedField === "did" ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer" }}
                            title="Copy DID"
                          >
                            {copiedField === "did" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>

                      {/* Ethereum Address */}
                      <div className="col-12">
                        <div style={{ background: "rgba(10, 22, 40, 0.4)", padding: "16px 20px", borderRadius: "8px", border: "1px solid rgba(0, 212, 255, 0.05)", position: "relative" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                            Blockchain Wallet Address
                          </label>
                          <span className="text-monospace" style={{ fontSize: "0.9rem", wordBreak: "break-all", paddingRight: "40px", display: "block" }}>{user.address}</span>
                          <button
                            onClick={() => copyToClipboard(user.address, "address")}
                            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: copiedField === "address" ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer" }}
                            title="Copy Address"
                          >
                            {copiedField === "address" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>

                      {/* Keys */}
                      <div className="col-md-6">
                        <div style={{ background: "rgba(10, 22, 40, 0.4)", padding: "16px 20px", borderRadius: "8px", border: "1px solid rgba(0, 212, 255, 0.05)", position: "relative" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                            Public Key (Verify Signature)
                          </label>
                          <span className="text-monospace" style={{ fontSize: "0.8rem", wordBreak: "break-all", display: "block", height: "80px", overflowY: "auto", paddingRight: "24px" }}>
                            {user.publicKey}
                          </span>
                          <button
                            onClick={() => copyToClipboard(user.publicKey, "pub")}
                            style={{ position: "absolute", right: 20, top: 20, border: "none", background: "none", color: copiedField === "pub" ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer" }}
                            title="Copy Public Key"
                          >
                            {copiedField === "pub" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div style={{ background: "rgba(10, 22, 40, 0.4)", padding: "16px 20px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.15)", position: "relative" }}>
                          <label style={{ fontSize: "0.75rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                            Private Key (Sign Requests)
                          </label>
                          <span className="text-monospace" style={{ fontSize: "0.8rem", wordBreak: "break-all", display: "block", height: "80px", overflowY: "auto", paddingRight: "24px" }}>
                            {user.privateKey}
                          </span>
                          <button
                            onClick={() => copyToClipboard(user.privateKey, "priv")}
                            style={{ position: "absolute", right: 20, top: 20, border: "none", background: "none", color: copiedField === "priv" ? "var(--accent-green)" : "var(--text-muted)", cursor: "pointer" }}
                            title="Copy Private Key"
                          >
                            {copiedField === "priv" ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Warning Banner */}
                    <div className="mt-4" style={{
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: "#ef4444" }}>⚠️ Security Notice:</strong> Keep your private key secure. It represents this receiver portal's credentials to authenticate interactions.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit}>
                    <h4 style={{ fontWeight: 700, marginBottom: "20px" }}>Configure Identity</h4>
                    
                    <div className="auth-input-group">
                      <label htmlFor="orgName" className="auth-label">Organization Name</label>
                      <input
                        type="text"
                        id="orgName"
                        name="orgName"
                        value={input.orgName}
                        onChange={onChange}
                        placeholder="e.g. state_university_verifier"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="auth-input-group">
                      <label htmlFor="address" className="auth-label">Ethereum Wallet Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={input.address}
                        onChange={onChange}
                        placeholder="0x..."
                        className="form-control text-monospace"
                        required
                      />
                    </div>

                    <div className="auth-input-group">
                      <label htmlFor="publicKey" className="auth-label">Public Key</label>
                      <textarea
                        id="publicKey"
                        name="publicKey"
                        value={input.publicKey}
                        onChange={onChange}
                        placeholder="Paste Public Cryptographic Key"
                        className="form-control text-monospace"
                        style={{ height: "100px", fontSize: "0.85rem", resize: "none" }}
                        required
                      />
                    </div>

                    <div className="auth-input-group">
                      <label htmlFor="privateKey" className="auth-label">Private Key</label>
                      <textarea
                        id="privateKey"
                        name="privateKey"
                        value={input.privateKey}
                        onChange={onChange}
                        placeholder="Paste Private Cryptographic Key (Stored Securely)"
                        className="form-control text-monospace"
                        style={{ height: "100px", fontSize: "0.85rem", resize: "none" }}
                        required
                      />
                    </div>

                    <button type="submit" className="auth-submit-btn mt-3">
                      Generate and Anchor DID
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSchema;
