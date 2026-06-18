const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Credential = require("./models/CredModel");

const dbURL = "mongodb://localhost:27017/receiver-db";

mongoose
  .connect(dbURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB. Resetting receiver database...");
    
    // Clear all fields related to DIDs for all users
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          address: "",
          publicKey: "",
          privateKey: "",
          did: "",
          orgName: "",
        }
      }
    );
    console.log(`Reset ${userResult.modifiedCount || userResult.nModified || 0} user(s).`);

    // Delete all credentials from receiver DB
    const credResult = await Credential.deleteMany({});
    console.log(`Deleted ${credResult.deletedCount || 0} stored credential log(s).`);

    console.log("Database reset complete. You can now re-register the DID in the UI.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
