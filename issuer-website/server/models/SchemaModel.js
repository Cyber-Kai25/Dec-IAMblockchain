const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Property sub-schema
const PropertySchema = new Schema(
  {
    key: { type: String, required: true },
    propType: { type: String, default: "string" },
    propFormat: { type: String, default: "text" },
    // If true, this field will be auto-incremented per issuance to ensure uniqueness
    isUniqueId: { type: Boolean, default: false },
  },
  { _id: false }
);

// Create Schema
const SchemaModel = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "Description for the Schema",
  },
  did: {
    type: String,
    required: true,
  },
  // Stores the credential attributes defined at schema creation time
  properties: {
    type: [PropertySchema],
    default: [],
  },
  // Tracks how many credentials have been issued for this schema (used for unique ID counters)
  issuanceCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("schemas", SchemaModel);