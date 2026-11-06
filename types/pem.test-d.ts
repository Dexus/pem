import {expectType} from 'tsd'
import pem = require('./pem')

expectType<Promise<pem.PrivateKeyResult>>(pem.createPrivateKey())

pem.createPrivateKey(2048, (err, result) => {
  if (result) {
    expectType<string>(result.key)
  }
})

expectType<Promise<pem.CSRResult>>(pem.createCSR({ commonName: 'example.com' }))
expectType<Promise<pem.CertificateCreationResult>>(pem.createCertificate({ selfSigned: true, copyExtensions: true }))

pem.getFingerprint('-----BEGIN CERTIFICATE-----\n...', (err, result) => {
  if (result) {
    expectType<string>(result.fingerprint)
  }
})

expectType<Promise<pem.ModulusResult>>(pem.getModulus('-----BEGIN CERTIFICATE-----\n...'))
expectType<Promise<boolean>>(pem.verifySigningChain('-----BEGIN CERTIFICATE-----\n...'))

const ca = new pem.CA({
  key: '-----BEGIN PRIVATE KEY-----\n...',
  certificate: '-----BEGIN CERTIFICATE-----\n...'
})

expectType<Promise<pem.IssuedCertificate>>(ca.issueCertificate({ commonName: 'example.com' }))
expectType<Promise<pem.IssuedCertificate>>(ca.issueCertificate({ commonName: 'example.com', copyExtensions: true }))
expectType<Promise<pem.IssuedCertificate>>(ca.issueCertificate({
  commonName: 'example.com',
  profile: 'server',
  notBefore: new Date('2030-01-01T00:00:00Z'),
  notAfter: new Date('2030-01-31T00:00:00Z')
}))

expectType<Promise<pem.CA>>(ca.createIntermediateCA({ commonName: 'Sub CA', pathlen: 0 }))
ca.createIntermediateCA({ commonName: 'Sub CA' }, (err, sub) => {
  if (sub) {
    expectType<pem.CA>(sub)
  }
})

expectType<Promise<pem.CA>>(pem.createCA({ commonName: 'example.com' }))
expectType<Promise<pem.CA>>(pem.CA.createCA({ commonName: 'example.com' }))

pem.createCA((err, created) => {
  if (created) {
    expectType<pem.CA>(created)
  }
})

ca.issueCertificate((err, issued) => {
  if (issued) {
    expectType<string>(issued.certificate)
  }
})

expectType<Promise<pem.ReadPkcs12Result>>(pem.promisified.readPkcs12('bundle.p12'))
expectType<Promise<pem.CreateDhparamResult>>(pem.promisified.createDhparam())

pem.convert.PEM2DER('input.pem', 'output.der', (err, success) => {
  expectType<boolean>(success)
})
