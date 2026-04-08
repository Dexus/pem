'use strict'

var chai = require('chai')
var expect = chai.expect
var fs = require('fs')
var path = require('path')
var {spawnSync} = require('child_process')
var pem = require('../lib/pem.js')

var DAY_MS = 24 * 60 * 60 * 1000

function loadCsrFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name)).toString().replace(/(?:\r\n|\r|\n)/g, "\n").trim()
}

function certificateText(certificate) {
  return spawnSync(process.env.OPENSSL_BIN || 'openssl', ['x509', '-noout', '-text'], {
    input: certificate,
    encoding: 'utf8'
  }).stdout
}

describe('CertificateAuthority', function () {
  this.timeout(60000)

  var rootCA
  var intermediateCA

  before(async function () {
    rootCA = await pem.createCertificate({
      commonName: 'Test Root CA',
      selfSigned: true,
      days: 365,
      CA: true
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

  it('fails when issuing with an invalid altName', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    try {
      await ca.issueCertificate({
        commonName: 'altname-injection.example',
        altNames: ['ok.example\nDNS.2 = evil.example']
      })
      throw new Error('Expected issuing certificate to fail for an invalid altName')
    } catch (err) {
      expect(err).to.be.an('error')
    }
  })

  it('does not copy SANs from submitted CSRs by default', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var result = await ca.issueCertificate({
      csr: loadCsrFixture('hostile_san.csr')
    })

    var info = await pem.readCertificateInfo(result.certificate)
    expect(info.san).to.equal(undefined)
  })

  it('never propagates $ENV:: references from submitted CSRs by default', async function () {
    process.env.SUPER_SECRET = 'pwned-marker-12345'
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var result = await ca.issueCertificate({
      csr: loadCsrFixture('hostile_san_env.csr')
    })

    expect(result.certificate).to.not.have.string('pwned-marker-12345')

    var info = await pem.readCertificateInfo(result.certificate)
    expect(info.san).to.equal(undefined)
  })

  it('never promotes CSR basicConstraints that request CA privileges', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var result = await ca.issueCertificate({
      csr: loadCsrFixture('hostile_ca_csr.csr')
    })

    var text = certificateText(result.certificate)
    expect(text).to.have.string('CA:FALSE')
    expect(text).to.not.have.string('CA:TRUE')
  })

  it('copies CSR extensions only when copyExtensions is requested', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var sanResult = await ca.issueCertificate({
      csr: loadCsrFixture('hostile_san.csr'),
      copyExtensions: true
    })
    var sanInfo = await pem.readCertificateInfo(sanResult.certificate)
    expect(sanInfo.san).to.be.an('object')
    expect(sanInfo.san.dns).to.include('app.legit.example', '*.victim-bank.com')

    var caResult = await ca.issueCertificate({
      csr: loadCsrFixture('hostile_ca_csr.csr'),
      copyExtensions: true
    })
    var text = certificateText(caResult.certificate)
    // copying is limited to extensions the CA does not control itself:
    // the pem_ca_extensions floor (CA:FALSE) always supersedes CSR requests
    expect(text).to.have.string('CA:FALSE')
    expect(text).to.not.have.string('CA:TRUE')
  })
})
