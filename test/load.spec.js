var Promise = require('bluebird')
var util = require('util')
var pem = require('..')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var expect = chai.expect

const createCertificateAsync = util.promisify(pem.createCertificate)
const verifySigningChainAsync = util.promisify(pem.verifySigningChain)
const createPkcs12Async = util.promisify(pem.createPkcs12)
const readPkcs12Async = util.promisify(pem.readPkcs12)

async function runOne (ca, cert) {
  const valid = await verifySigningChainAsync(cert.certificate, ca.certificate)
  expect(valid).to.be.true()

  const d = await createPkcs12Async(
    cert.clientKey,
    cert.certificate, '', {
      certFiles: [ca.certificate]
    })
  expect(d).to.be.ok()
  hlp.checkTmpEmpty()

  const keystore = await readPkcs12Async(d.pkcs12)
  expect(keystore).to.be.an('object')
  expect(keystore).to.have.property('ca')
  expect(keystore).to.have.property('cert')
  expect(keystore).to.have.property('key')
  expect(keystore.ca).to.be.an('array')
  expect(keystore.cert).to.be.an('string')
  expect(keystore.key).to.be.an('string')
  expect(keystore.ca[0]).to.equal(ca.certificate)
  expect(keystore.cert).to.equal(cert.certificate)
  expect(keystore.key).to.equal(cert.clientKey)
}

describe('load test', () => {

  it('is fast', async function () {
    this.timeout(300000)
    const RUNS = 500
    const ca = await createCertificateAsync({
      commonName: 'CA Certificate'
    })
    hlp.checkCertificate(ca)
    const certs = []
    for (var i = 0; i < RUNS; i++) {
      const cert = await createCertificateAsync({
        serviceKey: ca.serviceKey,
        serviceCertificate: ca.certificate,
        serial: Date.now()
      })
      hlp.checkCertificate(cert)
      hlp.checkTmpEmpty()
      certs.push(cert)
    }
    console.time('verify')
    const verifications = []
    for (var j = 0; j < RUNS; j++) {
      verifications.push(runOne(ca, certs[j]))
    }
    await Promise.all(verifications)
    console.timeEnd('verify')
  })
})
