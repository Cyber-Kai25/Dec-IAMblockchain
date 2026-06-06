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
    const user = await User.findOne({ email: "cyberkai25@gmail.com" });
    console.log(user);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
