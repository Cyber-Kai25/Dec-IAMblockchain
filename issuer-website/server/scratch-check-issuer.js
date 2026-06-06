const mongoose = require("mongoose");
const User = require("./models/UserModel");

const dbURL = "mongodb://localhost:27017/issuer-db";

mongoose
  .connect(dbURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB issuer-db.");
    const users = await User.find({});
    console.log("Total users in issuer-db:", users.length);
    users.forEach(u => console.log(`User: ${u.email}, Name: ${u.name}, ID: ${u.studentId}, DID: ${u.did}`));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
