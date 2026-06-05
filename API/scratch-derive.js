const secp = require('@noble/secp256k1');

// Private key from the screenshot (without 0x prefix)
const privateKeyHex = "4ae9ebfcb4ef94d4cbb2a18f38e96951b3271e073c02160e8da213d130a4f72e";

try {
  const publicKeyBytes = secp.getPublicKey(privateKeyHex);
  const publicKeyHex = secp.utils.bytesToHex(publicKeyBytes);
  console.log("=== Derived Keys ===");
  console.log("Private Key:", privateKeyHex);
  console.log("Public Key (Hex):", publicKeyHex);
} catch (error) {
  console.error("Error deriving public key:", error);
}
