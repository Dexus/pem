'use strict'

var chai = require('chai')
var expect = chai.expect
var pem = require('../lib/pem.js')

var DAY_MS = 24 * 60 * 60 * 1000

describe('CertificateAuthority', function () {
  this.timeout(60000)

  var rootCA
  var intermediateCA

  before(async function () {
    rootCA = await pem.createCertificate({
      commonName: 'Test Root CA',
      selfSigned: true,
      days: 365
    })

    var intermediateConfig = [
      '[req]',
      'req_extensions = v3_req',
      'distinguished_name = req_distinguished_name',
      '[req_distinguished_name]',
      'commonName = Common Name',
      'commonName_max = 64',
      '[v3_req]',
      'basicConstraints = critical,CA:TRUE,pathlen:0',
      'keyUsage = critical,keyCertSign,cRLSign'
    ].join('\n')

    intermediateCA = await pem.createCertificate({
      commonName: 'Intermediate CA',
      serviceCertificate: rootCA.certificate,
      serviceKey: rootCA.serviceKey,
      days: 365,
      serial: Date.now(),
      config: intermediateConfig
    })
  })

  it('creates certificates with a 7 day default validity', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var result = await ca.issueCertificate({
      commonName: 'seven-day.example'
    })

    expect(result).to.have.property('certificate')
    expect(result.validity).to.be.an('object')

    var info = await pem.readCertificateInfo(result.certificate)
    expect(info.validity).to.be.an('object')
    expect(result.validity.start.getTime()).to.equal(info.validity.start)
    expect(result.validity.end.getTime()).to.equal(info.validity.end)
    var diffDays = (info.validity.end - info.validity.start) / DAY_MS
    expect(diffDays).to.be.closeTo(7, 0.01)
  })

  it('allows issuing certificates with custom validity window', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var start = new Date(Date.UTC(2030, 0, 1, 0, 0, 0))
    var end = new Date(Date.UTC(2030, 0, 8, 0, 0, 0))

    var result = await ca.issueCertificate({
      commonName: 'custom-validity.example',
      startDate: start,
      endDate: end
    })

    expect(result.validity.start.getTime()).to.equal(start.getTime())
    expect(result.validity.end.getTime()).to.equal(end.getTime())

    var info = await pem.readCertificateInfo(result.certificate)
    expect(info.validity.start).to.equal(start.getTime())
    expect(info.validity.end).to.equal(end.getTime())
  })

  it('supports existing intermediate chains when issuing certificates', async function () {
    var ca = new pem.CA({
      key: intermediateCA.clientKey,
      certificate: intermediateCA.certificate,
      chain: [rootCA.certificate]
    })

    var result = await ca.issueCertificate({
      commonName: 'chained.example'
    })

    expect(result.caChain).to.be.an('array')
    expect(result.caChain).to.have.length(2)
    expect(result.caChain[0]).to.equal(intermediateCA.certificate)
    expect(result.caChain[1]).to.equal(rootCA.certificate)

    var info = await pem.readCertificateInfo(result.certificate)
    if (Array.isArray(info.issuer.commonName)) {
      expect(info.issuer.commonName).to.include('Intermediate CA')
    } else {
      expect(info.issuer.commonName).to.equal('Intermediate CA')
    }

    var verification = await pem.verifySigningChain(result.certificate, result.caChain)
    expect(verification).to.equal(true)
  })

  it('fails when the end date is before the start date', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var start = new Date(Date.UTC(2030, 0, 2))
    var end = new Date(Date.UTC(2030, 0, 1))

    try {
      await ca.issueCertificate({
        commonName: 'invalid-validity.example',
        startDate: start,
        endDate: end
      })
      throw new Error('Expected issuing certificate to fail when end date is before start date')
    } catch (err) {
      expect(err).to.be.an('error')
    }
  })
})
