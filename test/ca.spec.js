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
      // long-lived so the custom validity windows used below sit inside the
      // CA certificate's own validity (the CA helper rejects windows beyond it)
      days: 3650,
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

  it('creates a working CA in a single call', async function () {
    var ca = await pem.createCA({
      commonName: 'One Call CA',
      days: 3650
    })

    expect(ca).to.be.an.instanceof(pem.CA)
    expect(ca.certificate).to.be.a('string')
    expect(ca.key).to.be.a('string')

    var text = certificateText(ca.certificate)
    expect(text).to.have.string('CA:TRUE')

    var result = await ca.issueCertificate({
      commonName: 'from-one-call.example'
    })
    expect(result.certificate).to.be.a('string')
    expect(result.caChain).to.deep.equal([ca.certificate])
    expect(result.caCertificate).to.equal(ca.certificate)
  })

  it('generates an encrypted CA key when cipher and keyPassword are given', async function () {
    var ca = await pem.createCA({
      commonName: 'Encrypted Root CA',
      cipher: 'aes256',
      keyPassword: 'secret-passphrase'
    })

    // the generated root signing key must actually be encrypted, otherwise
    // persisting ca.key exposes an unprotected CA key
    expect(ca.key).to.have.string('ENCRYPTED')

    // the stored passphrase keeps the encrypted key usable for issuing
    var result = await ca.issueCertificate({
      commonName: 'encrypted-issuer.example'
    })
    expect(result.certificate).to.have.string('BEGIN CERTIFICATE')
  })

  it('supports the callback interface for createCA', function (done) {
    pem.createCA({commonName: 'Callback CA', days: 3650}, function (err, ca) {
      expect(err).to.equal(null)
      expect(ca).to.be.an.instanceof(pem.CA)
      done()
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

  it('accepts notBefore/notAfter as aliases for startDate/endDate', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var notBefore = new Date(Date.UTC(2030, 0, 1, 0, 0, 0))
    var notAfter = new Date(Date.UTC(2030, 0, 8, 0, 0, 0))

    var result = await ca.issueCertificate({
      commonName: 'alias-window.example',
      notBefore: notBefore,
      notAfter: notAfter
    })

    expect(result.validity.start.getTime()).to.equal(notBefore.getTime())
    expect(result.validity.end.getTime()).to.equal(notAfter.getTime())

    var info = await pem.readCertificateInfo(result.certificate)
    expect(info.validity.start).to.equal(notBefore.getTime())
    expect(info.validity.end).to.equal(notAfter.getTime())
  })

  it('rejects a validity window starting before the CA certificate is valid', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var rootInfo = await pem.readCertificateInfo(rootCA.certificate)
    var before = new Date(rootInfo.validity.start - 60 * 60 * 1000)

    try {
      await ca.issueCertificate({
        commonName: 'before-ca.example',
        startDate: before,
        days: 5
      })
      throw new Error('Expected issuing to fail when startDate precedes CA validity')
    } catch (err) {
      expect(err.message).to.match(/CA certificate/i)
    }
  })

  it('rejects a validity window ending after the CA certificate expires', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var rootInfo = await pem.readCertificateInfo(rootCA.certificate)
    var after = new Date(rootInfo.validity.end + 24 * 60 * 60 * 1000)

    try {
      await ca.issueCertificate({
        commonName: 'after-ca.example',
        endDate: after,
        days: 5
      })
      throw new Error('Expected issuing to fail when endDate exceeds CA validity')
    } catch (err) {
      expect(err.message).to.match(/CA certificate/i)
    }
  })

  it('issues profile-specific key usage for server, client and codeSigning', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var server = await ca.issueCertificate({
      commonName: 'profile-server.example',
      profile: 'server'
    })
    var serverText = certificateText(server.certificate)
    expect(serverText).to.have.string('TLS Web Server Authentication')
    expect(serverText).to.not.have.string('TLS Web Client Authentication')
    expect(serverText).to.have.string('CA:FALSE')

    var client = await ca.issueCertificate({
      commonName: 'profile-client.example',
      profile: 'client'
    })
    var clientText = certificateText(client.certificate)
    expect(clientText).to.have.string('TLS Web Client Authentication')
    expect(clientText).to.not.have.string('TLS Web Server Authentication')
    expect(clientText).to.have.string('CA:FALSE')

    var code = await ca.issueCertificate({
      commonName: 'profile-code.example',
      profile: 'codeSigning'
    })
    var codeText = certificateText(code.certificate)
    expect(codeText).to.have.string('Code Signing')
    expect(codeText).to.have.string('CA:FALSE')
  })

  it('keeps the default profile as server plus client authentication', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    var result = await ca.issueCertificate({
      commonName: 'profile-default.example'
    })
    var text = certificateText(result.certificate)
    expect(text).to.have.string('TLS Web Server Authentication')
    expect(text).to.have.string('TLS Web Client Authentication')
  })

  it('rejects unknown profiles', async function () {
    var ca = new pem.CA({
      key: rootCA.serviceKey,
      certificate: rootCA.certificate
    })

    try {
      await ca.issueCertificate({
        commonName: 'profile-bogus.example',
        profile: 'worldDomination'
      })
      throw new Error('Expected issuing to fail for an unknown profile')
    } catch (err) {
      expect(err.message).to.match(/profile/i)
    }
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

  it('creates an intermediate CA that issues verifiable leaf certificates', async function () {
    var root = await pem.createCA({
      commonName: 'Inter Root CA',
      days: 3650
    })

    var intermediate = await root.createIntermediateCA({
      commonName: 'Inter Mid CA',
      pathlen: 0
    })

    expect(intermediate).to.be.an.instanceof(pem.CA)
    var intText = certificateText(intermediate.certificate)
    expect(intText).to.have.string('CA:TRUE')
    expect(intText).to.have.string('Certificate Sign')
    expect(intermediate.chain).to.deep.equal([root.certificate])

    var leaf = await intermediate.issueCertificate({
      commonName: 'inter-leaf.example'
    })
    expect(leaf.caChain).to.deep.equal([intermediate.certificate, root.certificate])

    var dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-inter-'))
    try {
      var rootPath = path.join(dir, 'root.pem')
      var intPath = path.join(dir, 'int.pem')
      var leafPath = path.join(dir, 'leaf.pem')
      fs.writeFileSync(rootPath, root.certificate)
      fs.writeFileSync(intPath, intermediate.certificate)
      fs.writeFileSync(leafPath, leaf.certificate)
      var verification = spawnSync(process.env.OPENSSL_BIN || 'openssl', [
        'verify', '-CAfile', rootPath, '-untrusted', intPath, leafPath
      ])
      expect(verification.status).to.equal(0)
    } finally {
      fs.rmSync(dir, {recursive: true, force: true})
    }
  })

  it('honors notBefore/notAfter on intermediates created with a custom window', async function () {
    var root = await pem.createCA({
      commonName: 'Window Root CA',
      days: 3650
    })

    var start = new Date(Math.floor(Date.now() / 1000) * 1000 + 60 * 60 * 1000)
    var end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)
    var intermediate = await root.createIntermediateCA({
      commonName: 'Window Mid CA',
      notBefore: start,
      notAfter: end
    })

    expect(intermediate.caValidity).to.equal(null)
    var info = await pem.readCertificateInfo(intermediate.certificate)
    expect(info.validity.start).to.equal(start.getTime())
    expect(info.validity.end).to.equal(end.getTime())

    // the intermediate's own window governs what it can issue
    var leaf = await intermediate.issueCertificate({
      commonName: 'window-leaf.example',
      notBefore: start,
      days: 30
    })
    var leafInfo = await pem.readCertificateInfo(leaf.certificate)
    expect(leafInfo.validity.start).to.equal(start.getTime())
    expect(leafInfo.validity.end).to.be.at.most(end.getTime())
  })

  it('creates sub-intermediates whose chains openssl refuses when pathlen is exceeded', async function () {
    var root = await pem.createCA({
      commonName: 'Pathlen Root CA',
      days: 3650
    })

    var mid = await root.createIntermediateCA({
      commonName: 'Pathlen Mid CA',
      pathlen: 0
    })

    // signing succeeds here; openssl ca does not enforce pathlen. The
    // enforcement happens at chain validation time, which is what we prove.
    var sub = await mid.createIntermediateCA({
      commonName: 'Pathlen Sub CA'
    })
    var leaf = await sub.issueCertificate({
      commonName: 'sub-leaf.example'
    })

    var dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-pathlen-'))
    try {
      var rootPath = path.join(dir, 'root.pem')
      var midPath = path.join(dir, 'mid.pem')
      var subPath = path.join(dir, 'sub.pem')
      var leafPath = path.join(dir, 'leaf.pem')
      fs.writeFileSync(rootPath, root.certificate)
      fs.writeFileSync(midPath, mid.certificate)
      fs.writeFileSync(subPath, sub.certificate)
      fs.writeFileSync(leafPath, leaf.certificate)
      var verification = spawnSync(process.env.OPENSSL_BIN || 'openssl', [
        'verify', '-CAfile', rootPath, '-untrusted', midPath, '-untrusted', subPath, leafPath
      ])
      expect(verification.status).to.not.equal(0)
    } finally {
      fs.rmSync(dir, {recursive: true, force: true})
    }
  })

  it('keeps the password alias usable on created intermediate authorities', function () {
    this.timeout(20000)
    return (async function () {
      var root = await pem.createCA({
        commonName: 'Alias Root CA',
        days: 3650
      })

      var intermediate = await root.createIntermediateCA({
        commonName: 'Alias Mid CA',
        cipher: 'aes256',
        password: 'intermediate-passphrase',
        days: 1825
      })

      // the intermediate key was generated encrypted with the password
      // alias; issuing with the returned authority must not hang at a
      // passphrase prompt or fail to decrypt the key
      var leaf = await intermediate.issueCertificate({
        commonName: 'alias-leaf.example'
      })
      expect(leaf.certificate).to.have.string('BEGIN CERTIFICATE')
    })()
  })

  it('rejects an intermediate CSR submission that lacks the private key', async function () {
    var root = await pem.createCA({
      commonName: 'Csr Root CA',
      days: 3650
    })

    var csrData = await pem.createCSR({commonName: 'keyless-mid.example'})

    // a CertificateAuthority cannot sign anything without its own private
    // key, so building one from a keyless CSR must be rejected up front —
    // not crash asynchronously after openssl already signed the certificate
    var failure = null
    try {
      await root.createIntermediateCA({csr: csrData.csr})
    } catch (err) {
      failure = err
    }
    expect(failure, 'expected createIntermediateCA to reject').to.exist
    expect(failure.message).to.have.string('key')
  })

  it('merges extension profiles with SANs from generated CSR altNames', async function () {
    var root = await pem.createCA({
      commonName: 'Profile SAN CA',
      days: 3650
    })

    // the SAN config is generated internally from altNames; it must not be
    // mistaken for a caller-owned config and trip the profile conflict check
    var leaf = await root.issueCertificate({
      commonName: 'profile-san.example',
      altNames: ['alt-one.example', 'alt-two.example'],
      profile: 'client'
    })

    var text = certificateText(leaf.certificate)
    expect(text).to.have.string('DNS:alt-one.example')
    expect(text).to.have.string('DNS:alt-two.example')
    // client profile floor is preserved next to the SANs
    expect(text).to.have.string('TLS Web Client Authentication')
    expect(text).to.not.have.string('CA:TRUE')

    // and the certificate must actually chain
    var workDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-profilesan-'))
    try {
      var caPath = path.join(workDir, 'ca.pem')
      var leafPath = path.join(workDir, 'leaf.pem')
      fs.writeFileSync(caPath, root.certificate)
      fs.writeFileSync(leafPath, leaf.certificate)
      expect(
        spawnSync(process.env.OPENSSL_BIN || 'openssl',
          ['verify', '-CAfile', caPath, leafPath]).status
      ).to.equal(0)
    } finally {
      fs.rmSync(workDir, {recursive: true})
    }
  })

  it('keeps CA constraints on intermediates created with altNames', async function () {
    var workDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-sanmid-'))
    try {
      var root = await pem.createCA({commonName: 'SAN Mid Root CA', days: 3650})

      // the generated SAN config must not replace the secure intermediate
      // config (previously this produced a CA:FALSE "intermediate" that
      // could not sign verifiable certificates)
      var intermediate = await root.createIntermediateCA({
        commonName: 'san-mid.example',
        altNames: ['san-mid-alt.example'],
        days: 1825
      })

      var midText = certificateText(intermediate.certificate)
      expect(midText).to.have.string('CA:TRUE')
      expect(midText).to.have.string('Certificate Sign')
      expect(midText).to.have.string('DNS:san-mid-alt.example')

      // a leaf issued through the intermediate must still verify across it
      var leaf = await intermediate.issueCertificate({commonName: 'san-leaf.example'})
      var rootPath = path.join(workDir, 'root.pem')
      var midPath = path.join(workDir, 'mid.pem')
      var leafPath = path.join(workDir, 'leaf.pem')
      fs.writeFileSync(rootPath, root.certificate)
      fs.writeFileSync(midPath, intermediate.certificate)
      fs.writeFileSync(leafPath, leaf.certificate)
      expect(
        spawnSync(process.env.OPENSSL_BIN || 'openssl',
          ['verify', '-CAfile', rootPath, '-untrusted', midPath, leafPath]).status
      ).to.equal(0)
    } finally {
      fs.rmSync(workDir, {recursive: true})
    }
  })

  it('issues certificates that openssl verifies inside their validity window', async function () {
    var ca = await pem.createCA({
      commonName: 'Verify Window CA',
      days: 3650
    })

    // the window opens at the current second boundary, so the plain verify
    // below is the portable acceptance proof that works on every supported
    // SSL library (the CA-validity guard allows start == the CA's notBefore)
    var start = new Date(Math.floor(Date.now() / 1000) * 1000)
    var end = new Date(start.getTime() + 48 * 60 * 60 * 1000)
    var result = await ca.issueCertificate({
      commonName: 'windowed.example',
      startDate: start,
      endDate: end
    })

    // a second certificate far in the future probes whether this library
    // enforces validity times at all (old libressl ignores them)
    var future = await ca.issueCertificate({
      commonName: 'future.example',
      notBefore: new Date(start.getTime() + 7 * DAY_MS),
      notAfter: new Date(start.getTime() + 8 * DAY_MS)
    })

    var dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-verify-'))
    try {
      var caPath = path.join(dir, 'ca.pem')
      var leafPath = path.join(dir, 'leaf.pem')
      var futurePath = path.join(dir, 'future.pem')
      fs.writeFileSync(caPath, ca.certificate)
      fs.writeFileSync(leafPath, result.certificate)
      fs.writeFileSync(futurePath, future.certificate)
      var verify = function (args) {
        return spawnSync(process.env.OPENSSL_BIN || 'openssl', args).status
      }

      // inside the window the signature and dates check out
      expect(verify(['verify', '-CAfile', caPath, leafPath])).to.equal(0)

      // -attime is honored by every supported library: the future certificate
      // is valid inside its own window and not yet valid at the current time
      // (measured on OpenSSL 1.1.1-4.x and LibreSSL 3.0.2-3.2.7)
      var futureMid = Math.floor((start.getTime() + 7.5 * DAY_MS) / 1000)
      expect(verify(['verify', '-CAfile', caPath, '-attime', String(futureMid), futurePath])).to.equal(0)
      expect(verify(['verify', '-CAfile', caPath, '-attime', String(Math.floor(Date.now() / 1000)), futurePath])).to.not.equal(0)

      // expiry enforcement at validation time is a library capability:
      // OpenSSL-family refuses expired certificates at -attime, LibreSSL
      // honors -attime for notBefore but accepts expired ones (measured
      // on 3.0.2-3.2.7) — both behaviors are asserted below
      var late = Math.floor((end.getTime() + 24 * 60 * 60 * 1000) / 1000)
      var versionText = spawnSync(process.env.OPENSSL_BIN || 'openssl', ['version']).stdout.toString()
      if (versionText.indexOf('LibreSSL') === -1) {
        expect(verify(['verify', '-CAfile', caPath, '-attime', String(late), leafPath])).to.not.equal(0)
      } else {
        expect(verify(['verify', '-CAfile', caPath, '-attime', String(late), leafPath])).to.equal(0)
      }
    } finally {
      fs.rmSync(dir, {recursive: true, force: true})
    }
  })

  it('issues intermediate CAs whose leaf certificates verify against the root', async function () {
    var root = await pem.createCA({
      commonName: 'Chain Root CA',
      days: 3650
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

    var intermediate = await root.issueCertificate({
      commonName: 'Chain Intermediate CA',
      days: 1825,
      config: intermediateConfig
    })

    var intCA = new pem.CA({
      key: intermediate.clientKey,
      certificate: intermediate.certificate,
      chain: [root.certificate]
    })

    var leaf = await intCA.issueCertificate({
      commonName: 'chained-verify.example'
    })

    var dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pem-ca-chain-'))
    try {
      var rootPath = path.join(dir, 'root.pem')
      var intPath = path.join(dir, 'intermediate.pem')
      var leafPath = path.join(dir, 'leaf.pem')
      fs.writeFileSync(rootPath, root.certificate)
      fs.writeFileSync(intPath, intermediate.certificate)
      fs.writeFileSync(leafPath, leaf.certificate)

      var verification = spawnSync(process.env.OPENSSL_BIN || 'openssl', [
        'verify', '-CAfile', rootPath, '-untrusted', intPath, leafPath
      ])
      expect(verification.status).to.equal(0)

      // pem's own chain check agrees with openssl about the same chain
      var chainCheck = await pem.verifySigningChain(leaf.certificate, [intermediate.certificate, root.certificate])
      expect(chainCheck).to.equal(true)
    } finally {
      fs.rmSync(dir, {recursive: true, force: true})
    }
  })
})
