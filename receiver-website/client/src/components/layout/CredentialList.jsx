import React, { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";

const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "5050";

const CredentialList = () => {
  const [credList, setCredList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://${LOCAL_IP}:${BACKEND_PORT}/api/credential/getAll`)
      .then((response) => {
        setCredList(response.data.credentials || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching credentials:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 65px)", color: "var(--text-primary)" }}>
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">

          {/* Page Header */}
          <div className="animate-fadeInUp text-center mb-5">
            <span className="badge-accent mb-2" style={{ display: "inline-block" }}>
              Inspection Log
            </span>
            <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-0.02em" }}>
              Received <span className="gradient-text">Credentials</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Cryptographically inspect shared student credentials verified against anchored blockchain DIDs.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <PulseLoader size={12} color="var(--accent-purple)" />
            </div>
          ) : credList.length === 0 ? (
            <div className="text-center py-5" style={{ background: "rgba(10,22,40,0.3)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-glass)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
                No credentials have been shared with this portal yet.
              </p>
            </div>
          ) : (
            <div className="animate-fadeInUp delay-1">
              <Accordion className="custom-accordion">
                {credList.map((value, ind) => {
                  const hasError = !!value.msg;
                  return (
                    <Accordion.Item eventKey={ind.toString()} key={ind} style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      overflow: "hidden"
                    }}>
                      <Accordion.Header className="custom-accordion-header">
                        <div className="d-flex justify-content-between align-items-center w-100 pe-3 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                              {value.name || "Credential Info"}
                            </span>
                            <span className="text-monospace" style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "2px 8px", borderRadius: "4px" }}>
                              ID: {value.id}
                            </span>
                          </div>
                          
                          <div className="d-flex align-items-center gap-3">
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              Shared: {value.date}
                            </span>
                            {hasError ? (
                              <span style={{
                                padding: "2px 10px",
                                borderRadius: "20px",
                                background: "rgba(239, 68, 68, 0.08)",
                                color: "#ef4444",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                border: "1px solid rgba(239, 68, 68, 0.15)"
                              }}>
                                ✗ Verification Error
                              </span>
                            ) : (
                              <span style={{
                                padding: "2px 10px",
                                borderRadius: "20px",
                                background: "rgba(16, 185, 129, 0.08)",
                                color: "var(--accent-green)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                border: "1px solid rgba(16, 185, 129, 0.15)"
                              }}>
                                ✓ Verified On-Chain
                              </span>
                            )}
                          </div>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body style={{ background: "rgba(10, 22, 40, 0.35)", borderTop: "1px solid var(--border-glass)", padding: "20px" }}>
                        {hasError ? (
                          <div style={{
                            background: "rgba(239, 68, 68, 0.05)",
                            border: "1px solid rgba(239, 68, 68, 0.15)",
                            borderRadius: "8px",
                            padding: "16px",
                            color: "#ef4444",
                            fontSize: "0.88rem"
                          }}>
                            <strong>Verification Failed:</strong> {value.msg}
                          </div>
                        ) : (
                          <div className="row g-3">
                            {Object.keys(value).map((key, index) => {
                              // Hide internal parameters if needed, or format nicely
                              if (["name", "id", "date"].includes(key)) return null;
                              return (
                                <div className="col-md-6" key={index}>
                                  <div style={{
                                    background: "rgba(10, 22, 40, 0.2)",
                                    border: "1px solid rgba(255, 255, 255, 0.02)",
                                    borderRadius: "6px",
                                    padding: "10px 14px"
                                  }}>
                                    <span style={{
                                      fontSize: "0.72rem",
                                      color: "var(--text-muted)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      display: "block",
                                      marginBottom: 2
                                    }}>
                                      {key}
                                    </span>
                                    <span className="text-monospace" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                                      {typeof value[key] === "object" ? JSON.stringify(value[key]) : String(value[key])}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CredentialList;
