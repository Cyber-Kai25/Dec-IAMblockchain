const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserModel = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    default: "",
  },
  publicKey: {
    type: String,
    default: "",
  },
  privateKey: {
    type: String,
    default: "",
  },
  did: {
    type: String,
    default: "",
  },
  orgName: {
    type: String,
    default: "",
  },
  // To record credentials immediately upon issuance directly on the user profile
  issuedCredentials: [{
    credName: String,
    credDid: String,
    date: String,
    ownerDid: String,
    walletName: String // The name registered in the wallet app (from blockchain)
  }]
});

module.exports = mongoose.model("users", UserModel);
