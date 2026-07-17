/* eslint-disable no-bitwise */
import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── UTF-8 String & Uint8Array Conversion Helpers ──────────────────────────────
const utf8Encode = (str: string): Uint8Array => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
};

const utf8Decode = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  let out = '', i = 0;
  const len = bytes.length;
  while (i < len) {
    const c = bytes[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        const char2 = bytes[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        const char2_3 = bytes[i++];
        const char3 = bytes[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2_3 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }
  return out;
};

// ── Base64 & Uint8Array Conversion Helpers ────────────────────────────────────
const encodeUint8ArrayToBase64 = (arr: Uint8Array): string => {
  if (arr.byteOffset === 0 && arr.byteLength === arr.buffer.byteLength) {
    return encodeBase64(arr.buffer as ArrayBuffer);
  }
  return encodeBase64(arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer);
};

const decodeBase64ToUint8Array = (base64Str: string): Uint8Array => {
  return new Uint8Array(decodeBase64(base64Str));
};

// ── Storage Keys ─────────────────────────────────────────────────────────────
const PRIVATE_KEY_STORAGE_KEY_PREFIX = 'nimbusx_private_key:';
const PUBLIC_KEY_STORAGE_KEY_PREFIX = 'nimbusx_public_key:';

export interface E2EEKeyPair {
  publicKey: string;  // Base64 public key
  privateKey: string; // Base64 private key
}

export const cryptoService = {
  /**
   * Generates a new Curve25519 keypair
   */
  generateKeyPair(): E2EEKeyPair {
    const keyPair = nacl.box.keyPair();
    return {
      publicKey: encodeUint8ArrayToBase64(keyPair.publicKey),
      privateKey: encodeUint8ArrayToBase64(keyPair.secretKey),
    };
  },

  /**
   * Retrieves or generates a keypair for the logged-in user
   */
  async getOrCreateKeyPair(userId: string): Promise<string> {
    const privateKeyKey = `${PRIVATE_KEY_STORAGE_KEY_PREFIX}${userId}`;
    const publicKeyKey = `${PUBLIC_KEY_STORAGE_KEY_PREFIX}${userId}`;

    try {
      const storedPublicKey = await AsyncStorage.getItem(publicKeyKey);
      const storedPrivateKey = await AsyncStorage.getItem(privateKeyKey);

      if (storedPublicKey && storedPrivateKey) {
        return storedPublicKey;
      }

      // Generate a new keypair
      const keypair = this.generateKeyPair();
      await AsyncStorage.setItem(publicKeyKey, keypair.publicKey);
      await AsyncStorage.setItem(privateKeyKey, keypair.privateKey);
      return keypair.publicKey;
    } catch (e) {
      console.error('cryptoService: failed to get/create key pair:', e);
      // Fallback: generate ephemeral keypair
      const keypair = this.generateKeyPair();
      return keypair.publicKey;
    }
  },

  /**
   * Get the saved private key of the current user
   */
  async getPrivateKey(userId: string): Promise<string | null> {
    const privateKeyKey = `${PRIVATE_KEY_STORAGE_KEY_PREFIX}${userId}`;
    return AsyncStorage.getItem(privateKeyKey);
  },

  /**
   * Encrypts a message for a recipient using Curve25519 ECDH + Salsa20-Poly1305
   */
  encryptMessage(text: string, recipientPublicKeyBase64: string, senderPrivateKeyBase64: string): string {
    try {
      if (!recipientPublicKeyBase64 || !senderPrivateKeyBase64) {
        return text; // Fallback to plain if keys are missing
      }

      const recipientPublicKey = decodeBase64ToUint8Array(recipientPublicKeyBase64);
      const senderPrivateKey = decodeBase64ToUint8Array(senderPrivateKeyBase64);

      // Compute shared secret key via ECDH Diffie-Hellman
      const sharedSecret = nacl.box.before(recipientPublicKey, senderPrivateKey);

      // Generate random 24-byte nonce
      const nonce = nacl.randomBytes(nacl.box.nonceLength);

      // Encode and encrypt text
      const messageBytes = utf8Encode(text);
      const ciphertext = nacl.box.after(messageBytes, nonce, sharedSecret);

      // Combine nonce and ciphertext: "nonceBase64:ciphertextBase64"
      return `${encodeUint8ArrayToBase64(nonce)}:${encodeUint8ArrayToBase64(ciphertext)}`;
    } catch (e) {
      console.error('cryptoService: Encryption failed:', e);
      return text; // Fallback to plain
    }
  },

  /**
   * Decrypts an incoming message using Curve25519 ECDH + Salsa20-Poly1305
   */
  decryptMessage(encryptedPayload: string, senderPublicKeyBase64: string, recipientPrivateKeyBase64: string): string {
    try {
      if (!encryptedPayload || !senderPublicKeyBase64 || !recipientPrivateKeyBase64) {
        return encryptedPayload; // Not encrypted or missing keys
      }

      // Check if it matches the format "nonce:ciphertext"
      const parts = encryptedPayload.split(':');
      if (parts.length !== 2) {
        return encryptedPayload; // Not encrypted or malformed
      }

      const [nonceBase64, ciphertextBase64] = parts;
      const nonce = decodeBase64ToUint8Array(nonceBase64);
      const ciphertext = decodeBase64ToUint8Array(ciphertextBase64);

      const senderPublicKey = decodeBase64ToUint8Array(senderPublicKeyBase64);
      const recipientPrivateKey = decodeBase64ToUint8Array(recipientPrivateKeyBase64);

      // Compute shared secret key via ECDH Diffie-Hellman
      const sharedSecret = nacl.box.before(senderPublicKey, recipientPrivateKey);

      // Decrypt
      const decryptedBytes = nacl.box.open.after(ciphertext, nonce, sharedSecret);
      if (!decryptedBytes) {
        console.warn('cryptoService: Decryption opened but failed (signature mismatch).');
        return encryptedPayload; // Decryption failed, return ciphertext
      }

      return utf8Decode(decryptedBytes);
    } catch (e) {
      console.error('cryptoService: Decryption failed:', e);
      return encryptedPayload;
    }
  },

  /**
   * Generates a 25-digit WhatsApp-style numeric Safety Code from public keys
   */
  generateSafetyCode(publicKeyA: string, publicKeyB: string): string {
    if (!publicKeyA || !publicKeyB) return '—';

    // Sort key strings alphabetically for determinism (so both users see the same safety code)
    const sorted = [publicKeyA, publicKeyB].sort().join('');

    // FNV-1a hash algorithm
    let h1 = 0x811c9dc5;
    let h2 = 0xcbf29ce4;

    for (let i = 0; i < sorted.length; i++) {
      h1 ^= sorted.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= sorted.charCodeAt(i);
      h2 = Math.imul(h2, 0x01000193);
    }

    const abs1 = Math.abs(h1).toString().padStart(10, '0');
    const abs2 = Math.abs(h2).toString().padStart(10, '0');
    const abs3 = Math.abs(h1 + h2).toString().padStart(5, '0');

    const combinedDigits = (abs1 + abs2 + abs3).substring(0, 25);

    // Group into 5-digit chunks
    const chunks = [];
    for (let i = 0; i < 25; i += 5) {
      chunks.push(combinedDigits.substring(i, i + 5));
    }
    return chunks.join(' ');
  },
};
