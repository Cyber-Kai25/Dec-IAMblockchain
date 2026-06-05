const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Schema = require("./models/SchemaModel");

const dbURL = "mongodb://localhost:27017/issuer-db";

mongoose
  .connect(dbURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB. Resetting issuer database...");
    
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

    // Delete all stored schemas in the issuer db
    const schemaResult = await Schema.deleteMany({});
    console.log(`Deleted ${schemaResult.deletedCount || 0} schema(s).`);

    console.log("Database reset complete. You can now re-register the DID in the UI.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
