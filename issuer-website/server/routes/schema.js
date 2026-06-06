const express = require("express");
const router = express.Router();
const http = require("http");

// Load User model
const Schema = require("../models/SchemaModel");

require("dotenv").config();
const LOCAL_IP = process.env.LOCAL_IP;
const MAIN_BACKEND_PORT = process.env.MAIN_BACKEND_PORT;
const API_IP = process.env.API_IP;

// @route GET api/schema/getAll
// @desc Get all the schema(name , desc, did) from the schema db
// @access Public
router.get("/getAll", (req, res) => {
  Schema.find()
    .then((allSchemas) => {
      const schemasList = allSchemas.map((s) => ({
        name: s.name,
        description: s.description,
        did: s.did,
        properties: s.properties || [],
      }));
      res.status(200).json({ schemas: schemasList });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ error: err });
    });
});

// @route POST api/schema/create
// @desc Store the schema in blockchain and database.
// @access Public
router.post("/create", (req, res) => {
  const schemaData = req.body;
  console.log(schemaData);

  //making api call to main server and get schema DID.
  const reqObject = {
    issuerDID: schemaData.did,
    name: schemaData.name,
    description: schemaData.description,
    properties: schemaData.properties,
  };
  const data = JSON.stringify(reqObject);

  const options = {
    hostname: API_IP,
    port: MAIN_BACKEND_PORT,
    path: "/createSchema",
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
        const schemaDid = JSON.parse(d).did;
        Schema.findOne({ did: schemaDid }).then((schema) => {
          if (schema) {
            return res
              .status(400)
              .json({ error: "The same schema alredy exists" });
          } else {
            const newSchema = new Schema({
              name: schemaData.name,
              description: schemaData.description,
              did: schemaDid,
              properties: Array.isArray(schemaData.properties) ? schemaData.properties : [],
            });
            console.log(newSchema);

            newSchema
              .save()
              .then((data) => {
                console.log(data);
                res.status(200).json(data);
              })
              .catch((err) => {
                console.log(err);
                res.status(400).json({ error: "Error in updating Schema DB" });
              });
          }
        });
      });
    })
    .on("error", (error) => {
      console.error(error);
    });
  request.write(data);
  request.end();
});

// @route PATCH api/schema/setUniqueId
// @desc Mark a property on a schema as a unique-ID field so it gets auto-incremented on issuance
// @access Public (admin only in practice)
router.patch("/setUniqueId", (req, res) => {
  const { schemaDid, propertyKey, isUniqueId } = req.body;
  Schema.findOne({ did: schemaDid })
    .then((schema) => {
      if (!schema) {
        return res.status(404).json({ error: "Schema not found" });
      }
      const prop = schema.properties.find((p) => p.key === propertyKey);
      if (!prop) {
        return res.status(404).json({ error: `Property '${propertyKey}' not found on schema` });
      }
      prop.isUniqueId = !!isUniqueId;
      schema
        .save()
        .then((updated) => res.status(200).json(updated))
        .catch((err) => res.status(400).json({ error: err }));
    })
    .catch((err) => res.status(400).json({ error: err }));
});

module.exports = router;
