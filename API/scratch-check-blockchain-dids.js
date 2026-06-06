const { contract } = require('./abi');

async function run() {
  const ownerDID = 'did:ethr:0x91787F87d141bAdA645f63013caBf29b738C0179';
  const credDID = 'did:cred:ff43d921367b2cc11c5c03a247456142f8685eb4';
  const receiverDID = '';

  console.log("Checking ownerDID...");
  try {
    const d1 = await contract.methods.getDid(ownerDID).call();
    console.log("ownerDID exists!", d1[1]);
  } catch (err) {
    console.log("ownerDID check failed:", err.message);
  }

  console.log("Checking credDID (via getDid)...");
  try {
    const d2 = await contract.methods.getDid(credDID).call();
    console.log("credDID exists via getDid!", d2[1]);
  } catch (err) {
    console.log("credDID check via getDid failed:", err.message);
  }

  console.log("Checking receiverDID...");
  try {
    const d3 = await contract.methods.getDid(receiverDID).call();
    console.log("receiverDID exists!", d3[1]);
  } catch (err) {
    console.log("receiverDID check failed:", err.message);
  }

  process.exit(0);
}

run();
