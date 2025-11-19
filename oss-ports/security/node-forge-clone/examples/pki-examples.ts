/**
 * @elide/forge - PKI Examples
 * Public Key Infrastructure examples with certificates
 */

import {
  generateKeyPair,
  createSelfSignedCertificate,
  parseCertificate,
  verifyCertificate,
  createCSR,
  sha256,
  randomBytes,
  randomUUID
} from '@elide/forge';

/**
 * Example 1: Generate self-signed certificate
 */
export async function example1SelfSignedCertificate() {
  console.log('=== Example 1: Self-Signed Certificate ===\n');

  // Generate key pair
  console.log('Generating RSA key pair...');
  const keyPair = await generateKeyPair({ bits: 2048 });

  // Create certificate
  console.log('Creating self-signed certificate...');

  const cert = await createSelfSignedCertificate(keyPair, {
    subject: {
      commonName: 'example.com',
      countryName: 'US',
      stateOrProvinceName: 'California',
      localityName: 'San Francisco',
      organizationName: 'Example Corp',
      organizationalUnitName: 'IT Department',
      emailAddress: 'admin@example.com'
    },
    validityYears: 1,
    serialNumber: randomUUID()
  });

  console.log('\nCertificate created:');
  console.log('Subject:', cert.subject.commonName);
  console.log('Issuer:', cert.issuer.commonName);
  console.log('Serial:', cert.serialNumber);
  console.log('Valid from:', cert.validFrom.toISOString());
  console.log('Valid to:', cert.validTo.toISOString());
  console.log('Fingerprint:', cert.fingerprint);

  console.log('\nCertificate PEM:');
  console.log(cert.pem);

  return { keyPair, cert };
}

/**
 * Example 2: Certificate chain
 */
export async function example2CertificateChain() {
  console.log('\n=== Example 2: Certificate Chain ===\n');

  // Root CA
  console.log('Creating Root CA...');
  const rootKeys = await generateKeyPair({ bits: 4096 });
  const rootCert = await createSelfSignedCertificate(rootKeys, {
    subject: {
      commonName: 'Root CA',
      organizationName: 'Example Root CA'
    },
    validityYears: 10
  });

  console.log('Root CA created');
  console.log('  Common Name:', rootCert.subject.commonName);
  console.log('  Valid for:', '10 years');

  // Intermediate CA
  console.log('\nCreating Intermediate CA...');
  const intermediateKeys = await generateKeyPair({ bits: 2048 });
  const intermediateCert = await createSelfSignedCertificate(intermediateKeys, {
    subject: {
      commonName: 'Intermediate CA',
      organizationName: 'Example Intermediate CA'
    },
    issuer: rootCert.subject,
    validityYears: 5
  });

  console.log('Intermediate CA created');
  console.log('  Common Name:', intermediateCert.subject.commonName);
  console.log('  Issuer:', intermediateCert.issuer.commonName);

  // End-entity certificate
  console.log('\nCreating end-entity certificate...');
  const entityKeys = await generateKeyPair({ bits: 2048 });
  const entityCert = await createSelfSignedCertificate(entityKeys, {
    subject: {
      commonName: 'www.example.com',
      organizationName: 'Example Corp'
    },
    issuer: intermediateCert.subject,
    validityYears: 1
  });

  console.log('End-entity certificate created');
  console.log('  Common Name:', entityCert.subject.commonName);
  console.log('  Issuer:', entityCert.issuer.commonName);

  console.log('\nCertificate chain:');
  console.log('1. Root CA');
  console.log('   ↓');
  console.log('2. Intermediate CA');
  console.log('   ↓');
  console.log('3. www.example.com');

  return { rootKeys, rootCert, intermediateKeys, intermediateCert, entityKeys, entityCert };
}

/**
 * Example 3: Certificate signing request (CSR)
 */
export async function example3CSR() {
  console.log('\n=== Example 3: Certificate Signing Request ===\n');

  console.log('Generating key pair...');
  const keyPair = await generateKeyPair({ bits: 2048 });

  console.log('Creating CSR...');
  const csr = createCSR(keyPair, {
    commonName: 'api.example.com',
    countryName: 'US',
    stateOrProvinceName: 'California',
    localityName: 'San Francisco',
    organizationName: 'Example Corp',
    organizationalUnitName: 'API Services',
    emailAddress: 'api@example.com'
  });

  console.log('\nCSR created for:');
  console.log('  Common Name: api.example.com');
  console.log('  Organization: Example Corp');
  console.log('  Country: US');

  console.log('\nCSR:');
  console.log(csr);

  return { keyPair, csr };
}

/**
 * Example 4: Certificate verification
 */
export async function example4Verification() {
  console.log('\n=== Example 4: Certificate Verification ===\n');

  // Create CA certificate
  const caKeys = await generateKeyPair({ bits: 2048 });
  const caCert = await createSelfSignedCertificate(caKeys, {
    subject: {
      commonName: 'Example CA',
      organizationName: 'Example CA'
    },
    validityYears: 5
  });

  console.log('CA Certificate created');

  // Create end-entity certificate
  const entityKeys = await generateKeyPair({ bits: 2048 });
  const entityCert = await createSelfSignedCertificate(entityKeys, {
    subject: {
      commonName: 'secure.example.com',
      organizationName: 'Example Corp'
    },
    issuer: caCert.subject,
    validityYears: 1
  });

  console.log('End-entity certificate created');

  // Verify certificate
  console.log('\nVerifying certificate...');
  const isValid = verifyCertificate(entityCert, caKeys.publicKey);

  console.log('Certificate verification:', isValid ? 'VALID' : 'INVALID');

  return { caKeys, caCert, entityKeys, entityCert };
}

/**
 * Example 5: Multi-domain certificate (SAN)
 */
export async function example5MultiDomainCertificate() {
  console.log('\n=== Example 5: Multi-Domain Certificate (SAN) ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  const domains = [
    'example.com',
    'www.example.com',
    'api.example.com',
    'blog.example.com'
  ];

  console.log('Creating certificate for multiple domains:');
  domains.forEach(domain => console.log('  -', domain));

  const cert = await createSelfSignedCertificate(keyPair, {
    subject: {
      commonName: 'example.com',
      organizationName: 'Example Corp'
    },
    validityYears: 1,
    extensions: [
      {
        name: 'subjectAltName',
        value: domains.map(domain => ({ type: 'dns', value: domain }))
      }
    ]
  });

  console.log('\nCertificate created');
  console.log('Primary domain:', cert.subject.commonName);
  console.log('Additional domains:', domains.length - 1);

  return cert;
}

/**
 * Example 6: Code signing certificate
 */
export async function example6CodeSigningCertificate() {
  console.log('\n=== Example 6: Code Signing Certificate ===\n');

  const keyPair = await generateKeyPair({ bits: 3072 });

  const cert = await createSelfSignedCertificate(keyPair, {
    subject: {
      commonName: 'Example Software Publisher',
      organizationName: 'Example Corp',
      countryName: 'US'
    },
    validityYears: 3,
    extensions: [
      {
        name: 'keyUsage',
        value: ['digitalSignature'],
        critical: true
      },
      {
        name: 'extKeyUsage',
        value: ['codeSigning']
      }
    ]
  });

  console.log('Code signing certificate created');
  console.log('Publisher:', cert.subject.commonName);
  console.log('Valid for:', '3 years');

  return { keyPair, cert };
}

/**
 * Example 7: Client certificate authentication
 */
export async function example7ClientCertificate() {
  console.log('\n=== Example 7: Client Certificate Authentication ===\n');

  // Server CA
  const caKeys = await generateKeyPair({ bits: 2048 });
  const caCert = await createSelfSignedCertificate(caKeys, {
    subject: {
      commonName: 'Server CA',
      organizationName: 'Example Server CA'
    },
    validityYears: 5
  });

  console.log('Server CA created');

  // Client certificate
  const clientKeys = await generateKeyPair({ bits: 2048 });
  const clientCert = await createSelfSignedCertificate(clientKeys, {
    subject: {
      commonName: 'client@example.com',
      organizationName: 'Example Corp',
      emailAddress: 'client@example.com'
    },
    issuer: caCert.subject,
    validityYears: 1,
    extensions: [
      {
        name: 'keyUsage',
        value: ['digitalSignature', 'keyEncipherment'],
        critical: true
      },
      {
        name: 'extKeyUsage',
        value: ['clientAuth']
      }
    ]
  });

  console.log('Client certificate created');
  console.log('Client:', clientCert.subject.commonName);
  console.log('Email:', clientCert.subject.emailAddress);

  return { caKeys, caCert, clientKeys, clientCert };
}

/**
 * Example 8: Certificate fingerprinting
 */
export async function example8CertificateFingerprinting() {
  console.log('\n=== Example 8: Certificate Fingerprinting ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });
  const cert = await createSelfSignedCertificate(keyPair, {
    subject: {
      commonName: 'example.com',
      organizationName: 'Example Corp'
    },
    validityYears: 1
  });

  console.log('Certificate created');

  // Calculate different fingerprints
  const sha256Fingerprint = sha256(cert.pem).toString('hex');

  console.log('\nFingerprints:');
  console.log('SHA-256:', sha256Fingerprint);

  // Format as colon-separated
  const formatted = sha256Fingerprint.match(/.{1,2}/g)?.join(':').toUpperCase();
  console.log('Formatted:', formatted);

  return cert;
}

/**
 * Example 9: Certificate renewal
 */
export async function example9CertificateRenewal() {
  console.log('\n=== Example 9: Certificate Renewal ===\n');

  // Original certificate
  const keyPair = await generateKeyPair({ bits: 2048 });
  const oldCert = await createSelfSignedCertificate(keyPair, {
    subject: {
      commonName: 'example.com',
      organizationName: 'Example Corp'
    },
    validityYears: 1,
    serialNumber: '1000'
  });

  console.log('Original certificate:');
  console.log('  Serial:', oldCert.serialNumber);
  console.log('  Valid from:', oldCert.validFrom.toISOString());
  console.log('  Valid to:', oldCert.validTo.toISOString());

  // Renew certificate (new serial, extended validity)
  const newCert = await createSelfSignedCertificate(keyPair, {
    subject: oldCert.subject,
    validityYears: 2,
    serialNumber: '2000'
  });

  console.log('\nRenewed certificate:');
  console.log('  Serial:', newCert.serialNumber);
  console.log('  Valid from:', newCert.validFrom.toISOString());
  console.log('  Valid to:', newCert.validTo.toISOString());

  return { oldCert, newCert };
}

/**
 * Example 10: Certificate revocation list (CRL)
 */
export async function example10CRL() {
  console.log('\n=== Example 10: Certificate Revocation List ===\n');

  // CA certificate
  const caKeys = await generateKeyPair({ bits: 2048 });
  const caCert = await createSelfSignedCertificate(caKeys, {
    subject: {
      commonName: 'Example CA',
      organizationName: 'Example CA'
    },
    validityYears: 5
  });

  console.log('CA created');

  // Revoked certificates
  const revokedCerts = [
    {
      serialNumber: '1001',
      revocationDate: new Date('2023-01-15'),
      reason: 'keyCompromise'
    },
    {
      serialNumber: '1002',
      revocationDate: new Date('2023-02-20'),
      reason: 'superseded'
    },
    {
      serialNumber: '1003',
      revocationDate: new Date('2023-03-10'),
      reason: 'cessationOfOperation'
    }
  ];

  console.log('\nCertificate Revocation List:');
  console.log('Issuer:', caCert.subject.commonName);
  console.log('Last update:', new Date().toISOString());
  console.log('\nRevoked certificates:');

  revokedCerts.forEach(cert => {
    console.log(`  Serial: ${cert.serialNumber}`);
    console.log(`  Revoked: ${cert.revocationDate.toISOString()}`);
    console.log(`  Reason: ${cert.reason}`);
    console.log('');
  });

  return { caCert, revokedCerts };
}

// Run all examples
if (require.main === module) {
  (async () => {
    await example1SelfSignedCertificate();
    await example2CertificateChain();
    await example3CSR();
    await example4Verification();
    await example5MultiDomainCertificate();
    await example6CodeSigningCertificate();
    await example7ClientCertificate();
    await example8CertificateFingerprinting();
    await example9CertificateRenewal();
    await example10CRL();
  })();
}
