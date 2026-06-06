import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import PulseLoader from "react-spinners/PulseLoader";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5000";

const CreateSchema = () => {
  const email = useSelector((state) => state.auth.user.email);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [form, setForm] = useState([]);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/users/info`, {
        params: { email: email },
      })
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
        setLoading(false);
      });
  }, [email]);

  const addProperty = (e) => {
    e.preventDefault();
    setForm((prev) => [...prev, { key: "", propType: "string", propFormat: "text", isUniqueId: false }]);
  };

  const onPropertyChange = (e, index) => {
    const { name: propertyName, value: propertyValue, type, checked } = e.target;
    const val = type === "checkbox" ? checked : propertyValue;
    setForm((prev) =>
      prev.map((item, ind) => (ind === index ? { ...item, [propertyName]: val } : item))
    );
  };

  const removeProperty = (e, index) => {
    e.preventDefault();
    setForm((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Schema Name is required");
      return;
    }
    setSubmitting(true);
    const schemaData = {
      name: name,
      did: user.did,
      description: description,
      properties: form,
    };
    axios
      .post(`http://${LOCAL_IP}:${BACKEND_PORT}/api/schema/create`, schemaData)
      .then(() => {
        setName("");
        setDescription("");
        setForm([]);
        setSubmitting(false);
        alert("Schema successfully registered on blockchain!");
      })
      .catch((err) => {
        console.error("Error creating schema:", err);
        setSubmitting(false);
      });
  };

  const hasDid = user && user.did;

  // Live JSON Preview helper
  const livePreviewJson = JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: name || "UntitledSchema",
      description: description || "No description provided.",
      type: "object",
      properties: form.reduce((acc, curr) => {
        if (curr.key) {
          acc[curr.key] = {
            type: curr.propType || "string",
            format: curr.propFormat || "text"
          };
        }
        return acc;
      }, {}),
      required: form.map(f => f.key).filter(Boolean)
    },
    null,
    2
  );

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
      <div className="row justify-content-center">
        <div className="col-xl-11">

          {/* Page Header */}
          <div className="animate-fadeInUp mb-4 text-center">
            <span className="badge-accent mb-2" style={{ display: "inline-block" }}>
              Verifiable Data Model
            </span>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.02em" }}>
              Schema <span className="gradient-text">Template Builder</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
              Define cryptographic credential schemas to standardize verification layers for academic transcripts and certifications.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <PulseLoader size={12} color="var(--accent-cyan)" />
            </div>
          ) : !hasDid ? (
            <div className="animate-fadeInUp text-center py-5">
              <div style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "var(--radius-lg)",
                padding: "40px",
                maxWidth: "600px",
                margin: "0 auto"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚠️</div>
                <h4 style={{ fontWeight: 700, color: "#ef4444", marginBottom: "12px" }}>DID Identity Required</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px", lineHeight: 1.6 }}>
                  You must configure and anchor your organization's Decentralized Identifier (DID) on the blockchain before creating schema templates.
                </p>
                <a href="/createDid" className="btn-accent" style={{ textDecoration: "none", display: "inline-block" }}>
                  Setup DID First
                </a>
              </div>
            </div>
          ) : (
            <div className="row g-4 mt-2">
              {/* Builder Form */}
              <div className="col-lg-7 col-md-12 animate-fadeInUp delay-1">
                <div className="auth-card" style={{ padding: "30px" }}>
                  <form onSubmit={onSubmit}>
                    <h4 style={{ fontWeight: 700, marginBottom: "20px" }}>Schema Details</h4>

                    <div className="auth-input-group">
                      <label htmlFor="name" className="auth-label">Schema Name</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. BachelorOfScienceDegree"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="auth-input-group">
                      <label htmlFor="description" className="auth-label">Description</label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the credential context (e.g. Certified undergraduate transcript)"
                        className="form-control"
                        style={{ height: "80px", resize: "none" }}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                      <h5 style={{ fontWeight: 700, margin: 0 }}>Schema Attributes</h5>
                      <button onClick={addProperty} className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                        + Add Attribute
                      </button>
                    </div>

                    {form.length === 0 ? (
                      <div className="text-center py-4" style={{ background: "rgba(10,22,40,0.3)", borderRadius: "8px", border: "1px dashed var(--border-glass)" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                          No attributes added yet. Click "+ Add Attribute" to define schema keys.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {form.map((value, index) => (
                          <div
                            key={index}
                            style={{
                              background: "rgba(10, 22, 40, 0.4)",
                              border: "1px solid var(--border-glass)",
                              borderRadius: "8px",
                              padding: "16px",
                              position: "relative"
                            }}
                          >
                            <button
                              onClick={(e) => removeProperty(e, index)}
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "12px",
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "1rem"
                              }}
                              title="Remove Attribute"
                            >
                              🗑️
                            </button>

                            <div className="row g-2">
                              <div className="col-md-4">
                                <label className="auth-label" style={{ fontSize: "0.7rem" }}>Attribute Key</label>
                                <input
                                  type="text"
                                  name="key"
                                  value={value.key}
                                  placeholder="e.g. studentName"
                                  onChange={(e) => onPropertyChange(e, index)}
                                  className="form-control text-monospace"
                                  style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                                  required
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="auth-label" style={{ fontSize: "0.7rem" }}>Data Type</label>
                                <select
                                  name="propType"
                                  value={value.propType}
                                  onChange={(e) => onPropertyChange(e, index)}
                                  className="form-control text-monospace"
                                  style={{ padding: "6px 10px", fontSize: "0.85rem", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                                >
                                  <option value="string">string</option>
                                  <option value="number">number</option>
                                  <option value="boolean">boolean</option>
                                  <option value="date">date</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="auth-label" style={{ fontSize: "0.7rem" }}>Format Specifier</label>
                                <input
                                  type="text"
                                  name="propFormat"
                                  value={value.propFormat}
                                  placeholder="e.g. text / date-time"
                                  onChange={(e) => onPropertyChange(e, index)}
                                  className="form-control text-monospace"
                                  style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div className="col-md-2 d-flex flex-column justify-content-end">
                                <label
                                  className="auth-label"
                                  style={{ fontSize: "0.7rem", marginBottom: "4px" }}
                                  title="When checked, this field will be auto-incremented (e.g. 000001, 000002) on every credential issuance to guarantee uniqueness across all holders."
                                >
                                  Auto-ID 🔢
                                </label>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "34px" }}>
                                  <input
                                    type="checkbox"
                                    name="isUniqueId"
                                    checked={!!value.isUniqueId}
                                    onChange={(e) => onPropertyChange(e, index)}
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      accentColor: "var(--accent-cyan)",
                                      cursor: "pointer",
                                    }}
                                  />
                                  <span style={{ fontSize: "0.7rem", color: value.isUniqueId ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                                    {value.isUniqueId ? "On" : "Off"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="auth-submit-btn mt-4"
                      disabled={submitting}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {submitting ? (
                        <>
                          <PulseLoader size={8} color="#050d1a" margin={3} />
                          <span style={{ marginLeft: 8 }}>Registering Schema...</span>
                        </>
                      ) : (
                        "Anchor Schema to Blockchain"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* JSON Schema Preview Panel */}
              <div className="col-lg-5 col-md-12 animate-fadeInUp delay-2">
                <div className="auth-card" style={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="status-dot green"></span>
                    <h4 style={{ fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>Schema Preview</h4>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                    This W3C compliant schema definition will be compiled and uploaded to the decentralized network, creating an immutable blueprint for issuance verification.
                  </p>
                  
                  <div style={{ flexGrow: 1, minHeight: "260px", background: "rgba(10, 22, 40, 0.6)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "16px" }}>
                    <pre style={{
                      margin: 0,
                      color: "var(--accent-cyan)",
                      fontSize: "0.78rem",
                      fontFamily: "monospace",
                      height: "100%",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}>
                      {livePreviewJson}
                    </pre>
                  </div>
                  
                  <div className="security-badge mt-3" style={{ alignSelf: "flex-start", fontSize: "0.75rem" }}>
                    🔒 Draft-07 Compliant
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreateSchema;
