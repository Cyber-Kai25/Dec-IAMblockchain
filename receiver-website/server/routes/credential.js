const express = require("express");
const router = express.Router();
const http = require("http");
var sha256 = require("crypto-js/sha256");
const objectHash = require("object-hash");
const secp = require("@noble/secp256k1");
const qs = require("qs");

const emitter = require("../config/emitter");

// Load User model
const Credential = require("../models/CredModel");
const User = require("../models/UserModel");
const { EventEmitter } = require("stream");

require("dotenv").config();
const API_IP = process.env.API_IP;
const MAIN_BACKEND_PORT = process.env.MAIN_BACKEND_PORT;

//Utility function
const getCredentialData = async (credential, adminDid, hash, sign) => {
  return new Promise(async (resolve, reject) => {
    const requestData = {
      credDID: credential.credDid,
      did: adminDid,
      hash: hash,
      sign: sign,
    };

    let path = "/getCredential?" + qs.stringify(requestData);

    const options = {
      hostname: API_IP,
      port: MAIN_BACKEND_PORT,
      path: path,
      method: "GET",
    };

    const request = http.request(options, (response) => {
      console.log(`statusCode: ${response.statusCode}`);
      let rawData = "";

      response.on("data", (chunk) => {
        rawData += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 500) {
          console.log(credential);
          resolve({
            name: credential.name,
            id: credential.studentId,
            date: credential.date,
            msg: "Access to this Document has been revoked",
          });
          return;
        }
        try {
          let credData = JSON.parse(rawData);
          const credSubject = credData.credentialSubject || {};
          credSubject.name = credential.name;
          credSubject.id = credential.studentId;
          credSubject.date = credential.date;
          resolve(credSubject);
        } catch (err) {
          console.error("Error parsing getCredential response in getCredentialData:", err);
          resolve({
            name: credential.name,
            id: credential.studentId,
            date: credential.date,
            msg: "Failed to parse credential data",
          });
        }
      });
    });

    request.on("error", (error) => {
      console.error("HTTP request error in getCredentialData:", error);
      resolve({
        name: credential.name,
        id: credential.studentId,
        date: credential.date,
        msg: "Connection error to main API",
      });
    });

    request.end();
  });
};

// @route GET api/credential/getAll
// @desc for admin to view all credentials submitted.
// @access Public
router.get("/getAll", async (req, res) => {
  User.find({ email: "admin@admin.com" })
    .then(async (adminData) => {
      Credential.find({})
        .then(async (credentials) => {
          if (!adminData || adminData.length === 0 || !adminData[0].privateKey) {
            // Receiver DID not configured
            const result = credentials.map(c => ({
              name: c.name,
              id: c.studentId,
              date: c.date,
              msg: "Receiver DID not configured"
            }));
            return res.status(200).json({ credentials: result });
          }

          const hash = sha256("userDid").toString();
          const signHash = await secp.sign(hash, adminData[0].privateKey, {
            canonical: true,
          });
          let sign = secp.Signature.fromDER(signHash);
          sign = sign.toCompactHex();

          let credCount = credentials.length;
          let credPromises = [];

          for (let i = 0; i < credCount; i++) {
            credPromises.push(
              getCredentialData(credentials[i], adminData[0].did, hash, sign)
            );
          }
          Promise.all(credPromises).then((result) => {
            console.log("final credentials", result);
            res.status(200).json({ credentials: result });
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: err });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// @route GET api/credential/getByUser
// @desc get all creds belonging to a user.
// @access Public
router.get("/getByUser/:email", async (req, res) => {
  const userEmail = req.params.email;
  User.findOne({ email: userEmail })
    .then(async (userData) => {
      if (!userData) {
        return res.status(400).json({ msg: "user with that email doesn't exists" });
      }
      const studentId = userData.studentId;
      User.find({ email: "admin@admin.com" })
        .then(async (adminData) => {
          Credential.find({ studentId: studentId })
            .then(async (credentials) => {
              if (!adminData || adminData.length === 0 || !adminData[0].privateKey) {
                // Receiver DID not configured
                const filteredCreds = credentials.map(c => ({
                  credName: c.credName || "NA",
                  studentId: c.studentId,
                  date: c.date,
                  credAccess: true, // Default to true so it shows as active since it is stored locally
                  msg: "Receiver DID not configured"
                }));
                return res.status(200).json({ creds: filteredCreds });
              }

              const hash = sha256("userDid").toString();
              const signHash = await secp.sign(
                hash,
                adminData[0].privateKey,
                {
                  canonical: true,
                }
              );
              let sign = secp.Signature.fromDER(signHash);
              sign = sign.toCompactHex();

              let credCount = credentials.length;
              let credPromises = [];

              for (let i = 0; i < credCount; i++) {
                credPromises.push(
                  getCredentialData(
                    credentials[i],
                    adminData[0].did,
                    hash,
                    sign
                  )
                );
              }
              Promise.all(credPromises).then((result) => {
                const filteredCreds = [];
                for (let i = 0; i < result.length; i++) {
                  filteredCreds.push({
                    credName: credentials[i].credName,
                    studentId: credentials[i].studentId,
                    date: credentials[i].date,
                    credAccess:
                      result[i].msg !==
                      "Access to this Document has been revoked",
                  });
                }
                res.status(200).json({ creds: filteredCreds });
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: err });
            });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: err });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// @route POST api/credential/send
// @desc Used to send credential from app to receiver api.
// @access Public
router.post("/send", (req, res) => {
  const reqData = {
    studentId: req.body.userId,
    userDid: req.body.userDid,
    receiverDid: req.body.receiverDid,
    credDid: req.body.documentDid,
    hash: req.body.hash,
    sign: req.body.sign,
  };
  User.findOne({ studentId: reqData.studentId })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ error: "couldn't find a user with that ID" });
      }
      requestData = {
        credDID: reqData.credDid,
        ownerDID: reqData.userDid,
        hash: reqData.hash,
        sign: reqData.sign,
        receiverDID: reqData.receiverDid,
      };
      const data = JSON.stringify(requestData);

      const options = {
        hostname: API_IP,
        port: MAIN_BACKEND_PORT,
        path: "/getCredential",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const request = http
        .request(options, (response) => {
          let rawData = "";
          response.on("data", (chunk) => {
            rawData += chunk;
          });
          response.on("end", () => {
            try {
              const credData = JSON.parse(rawData);
              console.log("getCredential response in /send:", credData);
              if (response.statusCode !== 200) {
                console.error("Failed to verify on-chain:", credData);
                return res.status(response.statusCode).json({ error: credData.error || credData.mssg || "Blockchain verification failed" });
              }

              Credential.findOne({
                studentId: reqData.studentId,
                credDid: reqData.credDid,
              })
                .then((cred) => {
                  let currentdate = new Date();
                  let datetime =
                    currentdate.getDate() +
                    "/" +
                    (currentdate.getMonth() + 1) +
                    " " +
                    currentdate.getHours() +
                    ":" +
                    currentdate.getMinutes();
                  if (cred === null) {
                    newCred = new Credential({
                      studentId: reqData.studentId,
                      name: user.name,
                      credName: credData.credentialName || "NA",
                      userEmail: user.email,
                      credDid: reqData.credDid,
                      date: datetime,
                      hash: reqData.hash,
                      sign: reqData.sign,
                    });
                    newCred
                      .save()
                      .then((data) => {
                        console.log("newCred saved:", data);
                        emitter.emit("receive" + user.email, data);
                        res.status(200).json({ msg: "credentials received" });
                      })
                      .catch((err) => {
                        console.log("Database save error:", err);
                        res.status(400).json({
                          error: "Error in updating the Credential DB",
                        });
                      });
                  } else {
                    cred.date = datetime;
                    cred.credName = credData.credentialName || cred.credName;
                    cred
                      .save()
                      .then((data) => {
                        console.log("cred updated:", data);
                        emitter.emit("update" + user.email, data);
                        res.status(200).json({ msg: "credentials received" });
                      })
                      .catch((err) => {
                        console.log("Database update error:", err);
                        res.status(400).json({
                          error: "Error in updating the Credential DB",
                        });
                      });
                  }
                })
                .catch((error) => {
                  console.log(error);
                  res.status(500).json({ error: error });
                });
            } catch (err) {
              console.error("Error parsing response in /send:", err);
              res.status(500).json({ error: "Failed to parse verified credential data from blockchain" });
            }
          });
        })
        .on("error", (error) => {
          console.error(error);
          res.status(500).json({ error: "couldn't connect to main API" });
        });
      request.write(data);
      request.end();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

module.exports = router;
