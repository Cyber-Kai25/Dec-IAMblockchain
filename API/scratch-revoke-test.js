const { contract } = require('./abi');
const secp = require('@noble/secp256k1');
const { keccak256 } = require('ethereum-cryptography/keccak');

async function test() {
  try {
    const ownerDID = "did:iam:student"; // Replace with actual did if known
    // Let's print contract address
    console.log("Contract Address:", contract.options.address);
    
    // Let's list some contract methods
    console.log("Contract methods:", Object.keys(contract.methods));
  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

test();
