const express = require("express");
const http = require("http");
const axios = require("axios");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const secp = require("@noble/secp256k1");

router.post("/derivePublicKey", (req, res) => {
  try {
    let privateKey = req.body.privateKey;
    if (!privateKey) {
      return res.status(400).json({ error: "Private key is required" });
    }
    if (privateKey.startsWith("0x")) {
      privateKey = privateKey.substring(2);
    }
    const publicKeyBytes = secp.getPublicKey(privateKey);
    const publicKeyHex = secp.utils.bytesToHex(publicKeyBytes);
    return res.status(200).json({ publicKey: publicKeyHex });
  } catch (error) {
    return res.status(400).json({ error: "Invalid private key format" });
  }
});

// Load input validation
//const validateRegisterInput = require("../validation/register");
//const validateLoginInput = require("../validation/login");

require("dotenv").config();
const LOCAL_IP = process.env.LOCAL_IP;
const MAIN_BACKEND_PORT = process.env.MAIN_BACKEND_PORT;
const API_IP = process.env.API_IP;

// Load User model
const User = require("../models/UserModel");
const Schema = require("../models/SchemaModel");

// @route POST api/did/create
// @desc Store address and public key for user and create DID.
// @access Public
router.post("/create", (req, res) => {
  console.log("create request");
  const userData = {
    email: req.body.email,
    address: req.body.address,
    publicKey: req.body.publicKey,
    privateKey: req.body.privateKey,
    orgName: req.body.orgName,
  };

  //getting did from main server.
  const reqObject = {
    address: userData.address,
    publicKey: userData.publicKey,
    name: userData.orgName,
  };
  const data = JSON.stringify(reqObject);

  console.log(LOCAL_IP, MAIN_BACKEND_PORT);

  const options = {
    hostname: API_IP,
    port: MAIN_BACKEND_PORT,
    path: "/createDID",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const request = http
    .request(options, (response) => {
      console.log(`statusCode: ${response.statusCode}`);

      response.on("data", (d) => {
        const { did } = JSON.parse(d);
        User.findOne({ email: userData.email }).then((user) => {
          user.orgName = userData.orgName;
          user.address = userData.address;
          user.publicKey = userData.publicKey;
          user.privateKey = userData.privateKey;
          user.did = did;
          user
            .save()
            .then((user) => {
              console.log("DID created and saved to user successfully.");
              res.status(200).json(user);
            })
            .catch((err) => {
              res.status(400).json({ error: "couldn't update user Details" });
              console.log(err);
            });
        });
      });
    })
    .on("error", (error) => {
      console.error(error);
    });
  request.write(data);
  request.end();
});

module.exports = router;
