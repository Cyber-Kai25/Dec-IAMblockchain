const { contract } = require('./abi');
const secp = require('@noble/secp256k1');
const crypto = require('crypto');

const PUBLIC_ADDRESS = process.env.PUBLIC_ADDRESS;

const verifySig = async (sign, hash, did) => {
	try {
		const didDoc = await contract.methods.getDid(did).call();
		const publicKey = didDoc[3].publicKey;
		const isValid = secp.verify(sign, hash, publicKey);
		return isValid;
	} catch (err) {
		console.log("verifySig error:", err);
		return err;
	}
};

async function run() {
  const ownerDID = 'did:ethr:0x91787F87d141bAdA645f63013caBf29b738C0179';
  const credDID = 'did:cred:ff43d921367b2cc11c5c03a247456142f8685eb4';
  const receiverDID = '';
  const privateKey = '4ae9ebfcb4ef94d4cbb2a18f38e96951b3271e073c02160e8da213d130a4f72e';
  
  const hash = crypto.createHash('sha256').update(ownerDID).digest('hex');
  
  console.log("Signing hash:", hash);
  const signHash = await secp.sign(hash, privateKey, {
    canonical: true,
  });
  const sign = secp.Signature.fromDER(signHash);
  const signHex = sign.toCompactHex();
  console.log("Compact signature:", signHex);

  console.log("Verifying signature...");
  const isValid = await verifySig(signHex, hash, ownerDID);
  console.log("Signature is valid:", isValid);

  try {
    console.log("Calling contract revokeAccess...");
    const mssg = await contract.methods
      .revokeAccess(ownerDID, credDID, receiverDID)
      .send({
        from: PUBLIC_ADDRESS,
        gas: '1000000',
      });
    console.log("Transaction succeeded! Event message:", mssg.events.RevokeAccess.returnValues.mssg);
  } catch (err) {
    console.error("Contract call failed:", err);
  }
  process.exit(0);
}

run();
