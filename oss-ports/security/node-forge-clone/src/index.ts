/**
 * @elide/forge - Production-ready Cryptography Toolkit
 * Complete cryptographic operations for Elide applications
 *
 * @module @elide/forge
 * @author Elide Security Team
 * @license MIT
 */

// RSA
export {
  generateKeyPair,
  generateKeyPairSync,
  publicKeyFromPrivateKey,
  getKeyInfo,
  type RSAKeyPair,
  type RSAKeyPairOptions
} from './rsa/keypair';

export {
  publicEncrypt,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  encryptString as rsaEncryptString,
  decryptString as rsaDecryptString,
  type RSAPadding,
  type RSAEncryptOptions
} from './rsa/encrypt';

export {
  sign as rsaSign,
  verify as rsaVerify,
  signString as rsaSignString,
  verifyString as rsaVerifyString,
  type SignatureAlgorithm,
  type RSASignOptions
} from './rsa/sign';

// PKI
export {
  createSelfSignedCertificate,
  parseCertificate,
  verifyCertificate,
  createCSR,
  type Certificate,
  type CertificateAttributes,
  type CertificateOptions,
  type CertificateExtension
} from './pki/certificate';

// Cipher
export {
  encrypt as aesEncrypt,
  decrypt as aesDecrypt,
  encryptString as aesEncryptString,
  decryptString as aesDecryptString,
  type AESMode,
  type AESKeySize,
  type AESEncryptOptions,
  type AESEncryptResult
} from './cipher/aes';

// Hash
export {
  MessageDigest,
  hash,
  hashHex,
  hashBase64,
  md5,
  sha1,
  sha256,
  sha384,
  sha512,
  HMAC,
  createHMAC,
  createHMACHex,
  type HashAlgorithm
} from './hash/md';

// Random
export {
  randomBytes,
  randomBytesHex,
  randomBytesBase64,
  randomInt,
  randomUUID,
  randomPassword,
  randomToken,
  shuffle,
  randomElement,
  randomString
} from './random/random';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Forge namespace (for backward compatibility)
 */
import * as rsa from './rsa/keypair';
import * as cipher from './cipher/aes';
import * as md from './hash/md';
import * as random from './random/random';
import * as pki from './pki/certificate';

export const forge = {
  rsa,
  cipher,
  md,
  random,
  pki
};

export default forge;
