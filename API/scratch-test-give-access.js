const { contract } = require('./abi');

const PUBLIC_ADDRESS = process.env.PUBLIC_ADDRESS;

async function run() {
  const ownerDID = 'did:ethr:0x91787F87d141bAdA645f63013caBf29b738C0179';
  const credDID = 'did:cred:ff43d921367b2cc11c5c03a247456142f8685eb4';
  const receiverDID = '';

  try {
    console.log("Calling contract giveAccess with empty receiverDID...");
    const tx = await contract.methods
      .giveAccess(ownerDID, credDID, receiverDID)
      .send({
        from: PUBLIC_ADDRESS,
        gas: '1000000',
      });
    console.log("giveAccess succeeded!");
  } catch (err) {
    console.error("giveAccess failed:", err.message);
  }

  process.exit(0);
}

run();
