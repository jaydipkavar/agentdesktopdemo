const crypto = require("crypto");
const Fernet = require("fernet");

// Derive encryption key from access token
function deriveKeyFromToken(accessToken) {
  const publicPart = accessToken.substring(10, 22); // 12 chars
  const privatePart = accessToken.substring(15, 27); // 12 chars
  const keyMaterial = Buffer.from(publicPart + privatePart, "utf-8");

  const salt = Buffer.from("g5!>L$A->0y6VV?l%`n&B3E9jyC4!:", "utf-8");

  // Derive 32-byte key
  const derivedKey = crypto.pbkdf2Sync(keyMaterial, salt, 98434, 32, "sha256");

  // Fernet needs base64url encoding
  return derivedKey.toString("base64");
}

// Encrypt JSON string
function encryptJsonString(jsonData, key) {
  const secret = new Fernet.Secret(key);

  const token = new Fernet.Token({
    secret: secret,
    time: Date.now(),
    iv: crypto.randomBytes(16),
  });

  const jsonString =
    typeof jsonData === "string"
      ? jsonData
      : JSON.stringify(jsonData, null, 0);

  console.log(`Original JSON size: ${jsonString.length} characters`);

  const encrypted = token.encode(jsonString);
  console.log(`Encrypted size: ${encrypted.length} characters`);
  return encrypted;
}

// Decrypt JSON string
function decryptJsonString(encryptedData, key) {
  try {
    const secret = new Fernet.Secret(key);
    const token = new Fernet.Token({ secret: secret, token: encryptedData });
    const decryptedString = token.decode();

    console.log(`Decrypted JSON size: ${decryptedString.length} characters`);
    return JSON.parse(decryptedString);
  } catch (err) {
    throw new Error("Failed to decrypt data: " + err.message);
  }
}

// --------------------- DEMO ---------------------
(() => {
  const fakeAccessToken = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK"; 

  // Derive key
  const key = deriveKeyFromToken(fakeAccessToken);
  console.log("Derived Key:", key);

  // Sample data
  const reqJson = [{ name: "jaydeep", age: 27 }];

  // Encrypt
  const encryptedData = encryptJsonString(reqJson, key);
  console.log("Encrypted Data:", encryptedData);

  // Decrypt
  const decryptedData = decryptJsonString(encryptedData, key);
  console.log("Decrypted Data:", decryptedData);
})();