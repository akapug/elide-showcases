/**
 * @elide/forge - RSA Digital Signatures
 * Sign and verify data with RSA
 */

import * as crypto from 'crypto';

export type SignatureAlgorithm = 'sha1' | 'sha256' | 'sha384' | 'sha512';

export interface RSASignOptions {
  algorithm?: SignatureAlgorithm;
  saltLength?: number;
  padding?: 'pss' | 'pkcs1';
}

/**
 * Sign data with RSA private key
 */
export function sign(
  privateKey: string,
  data: Buffer | string,
  options: RSASignOptions = {}
): Buffer {
  const { algorithm = 'sha256', padding = 'pss', saltLength } = options;

  const buffer = typeof data === 'string' ? Buffer.from(data) : data;

  const paddingScheme = padding === 'pss'
    ? crypto.constants.RSA_PKCS1_PSS_PADDING
    : crypto.constants.RSA_PKCS1_PADDING;

  const signOptions: any = {
    key: privateKey,
    padding: paddingScheme
  };

  if (saltLength !== undefined) {
    signOptions.saltLength = saltLength;
  }

  const signer = crypto.createSign(algorithm);
  signer.update(buffer);
  signer.end();

  return signer.sign(signOptions);
}

/**
 * Verify signature with RSA public key
 */
export function verify(
  publicKey: string,
  data: Buffer | string,
  signature: Buffer,
  options: RSASignOptions = {}
): boolean {
  const { algorithm = 'sha256', padding = 'pss', saltLength } = options;

  const buffer = typeof data === 'string' ? Buffer.from(data) : data;

  const paddingScheme = padding === 'pss'
    ? crypto.constants.RSA_PKCS1_PSS_PADDING
    : crypto.constants.RSA_PKCS1_PADDING;

  const verifyOptions: any = {
    key: publicKey,
    padding: paddingScheme
  };

  if (saltLength !== undefined) {
    verifyOptions.saltLength = saltLength;
  }

  const verifier = crypto.createVerify(algorithm);
  verifier.update(buffer);
  verifier.end();

  return verifier.verify(verifyOptions, signature);
}

/**
 * Sign string and return base64
 */
export function signString(
  privateKey: string,
  message: string,
  options?: RSASignOptions
): string {
  const signature = sign(privateKey, message, options);
  return signature.toString('base64');
}

/**
 * Verify base64 signature
 */
export function verifyString(
  publicKey: string,
  message: string,
  signatureBase64: string,
  options?: RSASignOptions
): boolean {
  const signature = Buffer.from(signatureBase64, 'base64');
  return verify(publicKey, message, signature, options);
}
