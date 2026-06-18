const express = require("express");
const router = express.Router();
const http = require("http");
const objectHash = require("object-hash");
const secp = require("@noble/secp256k1");

const Schema = require("../models/SchemaModel");
const User = require("../models/UserModel");

require("dotenv").config();
const LOCAL_IP = process.env.LOCAL_IP;
const MAIN_BACKEND_PORT = process.env.MAIN_BACKEND_PORT;
const API_IP = process.env.API_IP;

// ---------------------------------------------------------------------------
// Helper: make an HTTP request and return parsed JSON
// ---------------------------------------------------------------------------
const makeHttpRequest = (options, body) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
};

// ---------------------------------------------------------------------------
// Helper: map a known property key to a user's stored field value
// ---------------------------------------------------------------------------
const USER_FIELD_MAP = {
  // Identity fields
  name: (user) => user.name || "",
  fullName: (user) => user.name || "",
  studentName: (user) => user.name || "",
  holderName: (user) => user.name || "",
  firstName: (user) => (user.name || "").split(" ")[0] || "",
  lastName: (user) => (user.name || "").split(" ").slice(1).join(" ") || "",

  // Contact / account fields
  email: (user) => user.email || "",
  emailAddress: (user) => user.email || "",

  // ID fields
  studentId: (user) => user.studentId || "",
  id: (user) => user.studentId || "",
  userId: (user) => user.studentId || "",

  // DID
  did: (user) => user.did || "",
  holderDid: (user) => user.did || "",

  // Organisation
  orgName: (user) => user.orgName || "",
  organization: (user) => user.orgName || "",
  collegeName: (user) => user.orgName || "",
  universityName: (user) => user.orgName || "",

  // Address
  address: (user) => user.address || "",
};

// ---------------------------------------------------------------------------
// Build a dynamic credentialSubject from schema properties + user data
// ---------------------------------------------------------------------------
const buildCredentialSubject = (schemaProperties, user, issuanceCount, customValues = {}) => {
  const subject = {};

  for (const prop of schemaProperties) {
    const key = prop.key;

    if (customValues && customValues[key] !== undefined) {
      subject[key] = customValues[key];
      continue;
    }

    if (prop.isUniqueId) {
      // Auto-increment: use (issuanceCount + 1) padded to 6 digits
      subject[key] = String(issuanceCount + 1).padStart(6, "0");
      continue;
    }

    // Try to map the property key to a known user field
    const mapper = USER_FIELD_MAP[key];
    if (mapper) {
      subject[key] = mapper(user);
      continue;
    }

    // Fallback defaults based on declared type / format
    if (prop.propType === "date" || prop.propFormat === "date" || prop.propFormat === "date-time") {
      subject[key] = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    } else if (prop.propType === "number") {
      subject[key] = 0;
    } else if (prop.propType === "boolean") {
      subject[key] = false;
    } else {
      subject[key] = ""; // empty string — admin can update later if needed
    }
  }

  return subject;
};

// ---------------------------------------------------------------------------
// POST /api/credential/create
// ---------------------------------------------------------------------------
router.post("/create", async (req, res) => {
  const { schemaDid, userDid, walletUserDid, userId, customValues } = req.body;

  // The wallet sends its own DID as `walletUserDid`.
  // Fall back to `userDid` for backwards compatibility, then `userId`.
  const holderDid = walletUserDid || userDid;

  try {
    // 1. Fetch schema (includes stored properties)
    const schema = await Schema.findOne({ did: schemaDid });
    if (!schema) {
      return res.status(400).json({ error: "Schema doesn't exist" });
    }

    // 2. Resolve the wallet holder — prefer lookup by DID, fall back to studentId
    let user = null;
    if (holderDid) {
      user = await User.findOne({ did: holderDid });
    }
    if (!user && userId) {
      user = await User.findOne({ studentId: userId });
    }
    if (!user) {
      return res.status(400).json({ error: "User doesn't exist. Register on the issuer website first." });
    }

    // 3. Fetch admin (issuer)
    const admin = await User.findOne({ email: "admin@admin.com" });
    if (!admin) {
      return res.status(400).json({ error: "Admin account not found" });
    }

    // 4. Build the dynamic credentialSubject from schema properties
    const credentialSubject = buildCredentialSubject(
      schema.properties,
      user,
      schema.issuanceCount,
      customValues
    );

    // 5. Sign the credentialSubject
    const hash = objectHash(credentialSubject);
    const signHash = await secp.sign(hash, admin.privateKey, { canonical: true });
    const sign = secp.Signature.fromDER(signHash);

    // 6. Assemble the Verifiable Credential
    const verifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1",
      ],
      id: schemaDid,
      type: ["VerifiableCredential", `${schema.name.replace(/\s+/g, "")}Credential`],
      issuerDID: admin.did,
      ownerDID: userDid,
      issuanceDate: new Date().toISOString(),
      credentialSubject,
      credentialName: schema.name,
      schemaDid,
      proof: {
        type: "EcdsaSecp256k1Signature2019",
        created: new Date().toISOString(),
        proofPurpose: "assertionMethod",
        verificationMethod: admin.did,
        sign: sign.toCompactHex(),
        hash,
      },
    };

    // 7. Send to main API / blockchain
    const data = JSON.stringify(verifiableCredential);
    const options = {
      hostname: API_IP,
      port: MAIN_BACKEND_PORT,
      path: "/addCredential",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const request = http
      .request(options, (response) => {
        let rawData = "";
        response.on("data", (chunk) => { rawData += chunk; });
        response.on("end", async () => {
          try {
            const parsed = JSON.parse(rawData);
            if (response.statusCode !== 200) {
              return res.status(response.statusCode).json(parsed);
            }

            // 8. Increment issuanceCount AFTER successful blockchain registration
            await Schema.updateOne(
              { did: schemaDid },
              { $inc: { issuanceCount: 1 } }
            );

            // 9. Fetch wallet user's name from blockchain and record issuance directly on user
            try {
              const nameRes = await makeHttpRequest({
                hostname: API_IP,
                port: MAIN_BACKEND_PORT,
                path: `/getName/${encodeURI(userDid)}`,
                method: "GET"
              });
              const walletName = nameRes.data.name || user.name;
              
              user.issuedCredentials.push({
                credName: schema.name,
                credDid: parsed.did,
                date: new Date().toLocaleString(),
                ownerDid: userDid,
                walletName: walletName
              });
              await user.save();
            } catch (recordErr) {
              console.error("Failed to record issuance on user profile:", recordErr);
              // We still return success since the blockchain issuance succeeded
            }

            res.status(200).json({ credentialDid: parsed.did });
          } catch (parseErr) {
            console.error("Error parsing API response:", parseErr);
            res.status(500).json({ error: "Unexpected response from credential API" });
          }
        });
      })
      .on("error", (error) => {
        console.error("HTTP request error:", error);
        res.status(500).json({ error: error.message });
      });

    request.write(data);
    request.end();
  } catch (err) {
    console.error("Credential creation error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

// ---------------------------------------------------------------------------
// GET /api/credential/stats
// @desc Returns aggregate statistics for the admin dashboard
// ---------------------------------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const [userCount, schemas] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      Schema.find({}, { name: 1, issuanceCount: 1 }),
    ]);

    const schemaCount = schemas.length;
    const totalIssued = schemas.reduce((sum, s) => sum + (s.issuanceCount || 0), 0);
    const schemaBreakdown = schemas.map((s) => ({
      name: s.name,
      count: s.issuanceCount || 0,
    }));

    res.status(200).json({ userCount, schemaCount, totalIssued, schemaBreakdown });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

// ---------------------------------------------------------------------------
// POST /api/credential/revokeByAdmin
// @desc Admin revokes a credential by credDID and receiverDID.
//       Signs the proof server-side using stored admin private key.
// ---------------------------------------------------------------------------
router.post("/revokeByAdmin", async (req, res) => {
  const { credDID, receiverDID } = req.body;

  if (!credDID || !receiverDID) {
    return res.status(400).json({ error: "credDID and receiverDID are required" });
  }

  try {
    // Fetch the admin account (issuer)
    const admin = await User.findOne({ email: "admin@admin.com" });
    if (!admin || !admin.privateKey || !admin.did) {
      return res.status(400).json({ error: "Admin account not configured. Please set up a DID first." });
    }

    // Build and sign the revocation proof (same pattern as credential creation)
    const hash = objectHash({ credDID, receiverDID, revoker: admin.did });
    const signHash = await secp.sign(hash, admin.privateKey, { canonical: true });
    const sign = secp.Signature.fromDER(signHash).toCompactHex();

    const payload = JSON.stringify({
      credDID,
      ownerDID: admin.did,
      receiverDID,
      hash,
      sign,
    });

    const options = {
      hostname: API_IP,
      port: MAIN_BACKEND_PORT,
      path: "/revokeAccess",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const result = await makeHttpRequest(options, payload);

    if (result.status !== 200) {
      return res.status(result.status).json(result.data);
    }

    res.status(200).json({ message: "Credential successfully revoked.", detail: result.data });
  } catch (err) {
    console.error("Revocation error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
