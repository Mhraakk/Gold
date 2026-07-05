const SECRET_KEY = "H3RM3S_Q0ANT_K3Y";
const encryptData = (data) => {
  try {
    const encoded = encodeURIComponent(data);
    let xor = "";
    for (let i = 0; i < encoded.length; i++) {
      xor += String.fromCharCode(encoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(xor);
  } catch (e) {
    console.error("Encryption failed", e);
    return data;
  }
};
const decryptData = (data) => {
  try {
    const decoded = atob(data);
    let xor = "";
    for (let i = 0; i < decoded.length; i++) {
      xor += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return decodeURIComponent(xor);
  } catch (e) {
    return data;
  }
};
const sessionUser = { name: "تست", email: "test@example.com" };
const encrypted = encryptData(JSON.stringify(sessionUser));
console.log("Encrypted:", encrypted);
const decrypted = decryptData(encrypted);
console.log("Decrypted:", decrypted);
console.log("Parsed:", JSON.parse(decrypted));
