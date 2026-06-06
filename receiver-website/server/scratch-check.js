const mongoose = require("mongoose");
const Credential = require("./models/CredModel");
const User = require("./models/UserModel");

const dbURL = "mongodb://localhost:27017/receiver-db";

mongoose
  .connect(dbURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB.");
    const users = await User.find({});
    console.log("Total users:", users.length);
    users.forEach(u => console.log(`User: ${u.email}, Name: ${u.name}, ID: ${u.studentId}, Has DID: ${!!u.did}`));
    
    const creds = await Credential.find({});
    console.log("Total credentials in DB:", creds.length);
    creds.forEach(c => console.log(c));
    
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
