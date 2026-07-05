// Basic XOR + Base64 Encryption for Local Storage Protection
// Not bank-grade AES, but sufficient for client-side obfuscation of API keys
const SECRET_KEY = "H3RM3S_Q0ANT_K3Y";

export const encryptData = (data: string): string => {
  try {
    const encoded = encodeURIComponent(data);
    let xor = "";
    for (let i = 0; i < encoded.length; i++) {
      xor += String.fromCharCode(encoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    // Hex encode instead of base64 to avoid btoa DOMException
    let hex = "";
    for (let i = 0; i < xor.length; i++) {
      hex += xor.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex;
  } catch (e) {
    console.error("Encryption failed", e);
    return data;
  }
};

export const decryptData = (data: string): string => {
  try {
    // If it's old base64 data, fallback to raw or clear it
    if (!/^[0-9a-fA-F]+$/.test(data)) {
      return data;
    }
    let xor = "";
    for (let i = 0; i < data.length; i += 2) {
      xor += String.fromCharCode(parseInt(data.substr(i, 2), 16));
    }
    let decoded = "";
    for (let i = 0; i < xor.length; i++) {
      decoded += String.fromCharCode(xor.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return decodeURIComponent(decoded);
  } catch (e) {
    return data;
  }
};
