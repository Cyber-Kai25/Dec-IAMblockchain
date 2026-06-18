const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

// Load User model
const User = require("../models/UserModel");

// @route POST api/users/register
// @desc Register user
// @access Public

router.post("/register", (req, res) => {
  //Form validation
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        password: req.body.password,
        email: req.body.email,
        studentId: Math.floor(Math.random() * 10000 + 1) + "",
      });

      // Hash password before storing in database
      const rounds = 10;
      bcrypt.genSalt(rounds, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

// @route GET api/users/info
// @desc Getting user info from db
// @access Public

router.get("/info", (req, res) => {
  const email = req.query.email;
  //Find user by Email
  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    res.status(200).json({
      orgName: user.orgName,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      address: user.address,
      publicKey: user.publicKey,
      privateKey: user.privateKey,
      did: user.did,
    });
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public

router.post("/login", (req, res) => {
  //Form Valdiation
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  //Find user by Email
  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // Create JWT Payload
        console.log("user: ", user);
        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926,
          },
          (err, token) => {
            let returnData = {
              success: true,
              token: "Bearer " + token,
            };
            res.json(returnData);
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

// @route GET api/users/allStudentsWithCredentials
// @desc Returns all non-admin students in receiver-db with their credential DIDs.
//       Used by the issuer admin dashboard to populate the revocation panel.
// @access Public (admin only in practice)

const Credential = require("../models/CredModel");

router.get("/allStudentsWithCredentials", async (req, res) => {
  try {
    // 1. Get all non-admin users (actual wallet-app students who registered)
    const students = await User.find(
      { isAdmin: false },
      { name: 1, email: 1, studentId: 1, did: 1 }
    ).sort({ name: 1 });

    if (students.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // 2. For each student, fetch their credential DIDs from the credentials collection
    const studentIds = students.map((s) => s.studentId);
    const allCreds = await Credential.find(
      { studentId: { $in: studentIds } },
      { studentId: 1, credDid: 1, credName: 1, date: 1, ownerDid: 1 }
    );

    // 3. Group credentials by studentId
    const credsByStudentId = {};
    allCreds.forEach((c) => {
      if (!credsByStudentId[c.studentId]) {
        credsByStudentId[c.studentId] = [];
      }
      credsByStudentId[c.studentId].push({
        credDid: c.credDid,
        credName: c.credName || "Credential",
        date: c.date,
        ownerDid: c.ownerDid || "",   // ← wallet-app student's on-chain DID
      });
    });


    // 4. Merge into student objects
    const result = students.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      studentId: s.studentId,
      did: s.did || "",
      credentials: credsByStudentId[s.studentId] || [],
    }));

    res.status(200).json({ students: result });
  } catch (err) {
    console.error("Error fetching students with credentials:", err);
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;

