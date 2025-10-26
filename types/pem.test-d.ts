import {expectType} from 'tsd'
import pem = require('pem')

expectType<Promise<pem.PrivateKeyResult>>(pem.createPrivateKey())

pem.createPrivateKey(2048, (err, result) => {
  if (result) {
    expectType<string>(result.key)
  }
})

expectType<Promise<pem.CSRResult>>(pem.createCSR({ commonName: 'example.com' }))
expectType<Promise<pem.CertificateCreationResult>>(pem.createCertificate({ selfSigned: true }))

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

ca.issueCertificate((err, issued) => {
  if (issued) {
    expectType<string>(issued.certificate)
  }
})

expectType<Promise<pem.ReadPkcs12Result>>(pem.promisified.readPkcs12('bundle.p12'))
expectType<Promise<pem.CreateDhparamResult>>(pem.promisified.createDhparam())

pem.convert.PEM2DER('input.pem', 'output.der', (err, success) => {
  if (success) {
    expectType<boolean>(success)
  }
})
