'use strict'

// Issue #406: PKCS#12 keystore produced by createPkcs12() is rejected by
// Node >= 17 ("Unsupported PKCS12 PFX data") when the openssl binary on PATH
// uses legacy default PBE algorithms. The issue asks for the -certpbe (and
// sibling -keypbe/-macalg) parameters to be settable via options.
//
// The discriminators are structural, not textual: error texts differ across
// the supported library matrix (OpenSSL 1.1.1/3.x/4.x, LibreSSL), and
// LibreSSL's `pkcs12 -info` does not even print the MAC algorithm, so the
// tests assert exit behavior instead:
// - a bogus certpbe value MUST make openssl fail — every supported library
//   rejects unknown PBE algorithms, so this proves the option really reaches
//   the openssl argv (pre-fix the options are dropped and the call succeeds)
// - real values must produce a PFX that Node's TLS stack accepts
// - the default path must keep producing a keystore (its legacy PBE output
//   is what Node rejects on old libraries — that IS issue #406, so no
//   Node-accepts assertion there; it depends on the local library defaults)

var pem = require('../lib/pem')
var tls = require('tls')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

describe('Issue #406 — createPkcs12 PBE options', function () {
  this.timeout(300000)// 5 minutes
  this.slow(5000)

  // each test creates its own certificate — no shared before() fixtures
  function makeSelfSignedCertificate (cb) {
    pem.createCertificate({ days: 1, selfSigned: true }, function (err, data) {
      hlp.checkError(err)
      cb(data)
    })
  }

  it('passes the PBE options to openssl (bogus certpbe value must fail)', function (done) {
    makeSelfSignedCertificate(function (keys) {
      pem.createPkcs12(keys.clientKey, keys.certificate, 'issue406pw', {
        certpbe: 'notarealcipher406',
        keypbe: 'AES-256-CBC',
        macalg: 'sha512'
      }, function (err) {
        expect(err).to.be.ok()
        done()
      })
    })
  })

  it('produces a PKCS#12 that Node TLS accepts when PBE options are set', function (done) {
    makeSelfSignedCertificate(function (keys) {
      pem.createPkcs12(keys.clientKey, keys.certificate, 'issue406pw2', {
        certpbe: 'AES-256-CBC',
        keypbe: 'AES-256-CBC',
        macalg: 'sha512'
      }, function (err, pkcs12) {
        hlp.checkError(err)
        // same code path as https.createServer({pfx, passphrase})
        expect(function () {
          tls.createSecureContext({ pfx: pkcs12.pkcs12, passphrase: 'issue406pw2' })
        }).to.not.throw()
        done()
      })
    })
  })

  it('still produces a PKCS#12 when no options are given (default path)', function (done) {
    makeSelfSignedCertificate(function (keys) {
      pem.createPkcs12(keys.clientKey, keys.certificate, 'issue406pw3', function (err, pkcs12) {
        hlp.checkError(err)
        expect(pkcs12.pkcs12).to.be.an.instanceof(Buffer)
        expect(pkcs12.pkcs12.length).to.be.above(0)
        done()
      })
    })
  })
})
