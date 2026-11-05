'use strict'

// Issue #406: PKCS#12 keystore produced by createPkcs12() is rejected by
// Node >= 17 ("Unsupported PKCS12 PFX data") when the openssl binary on PATH
// uses legacy default PBE algorithms. The issue asks for the -certpbe (and
// sibling -keypbe/-macalg) parameters to be settable via options.
//
// Discriminating assertion: passing macalg: 'sha512' must show up as
// "MAC: sha512" in `openssl pkcs12 -info`. OpenSSL >= 3.0 defaults to sha256,
// so if the options are dropped (pre-fix) this fails even on OpenSSL 3.

var pem = require('../lib/pem')
var openssl = require('../lib/openssl.js')
var fs = require('fs')
var path = require('path')
var tls = require('tls')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)
var spawnSync = require('child_process').spawnSync

function opensslPath () {
  return openssl.get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'
}

// Parse a PFX buffer with `openssl pkcs12 -info` and return the full text
// output (stdout + stderr — openssl prints the info lines to stderr).
function pkcs12Info (pfxBuffer, password, tmpName) {
  var infoFile = path.join(process.env.PEMJS_TMPDIR, tmpName)
  fs.writeFileSync(infoFile, pfxBuffer)
  try {
    var res = spawnSync(opensslPath(), [
      'pkcs12', '-info', '-in', infoFile, '-passin', 'pass:' + password, '-noout'
    ], { encoding: 'utf8' })
    if (res.error) {
      throw res.error
    }
    if (res.status !== 0) {
      throw new Error('openssl pkcs12 -info exited ' + res.status + ': ' + res.stderr)
    }
    return res.stdout + '\n' + res.stderr
  } finally {
    fs.unlinkSync(infoFile)
  }
}

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

  it('applies certpbe/keypbe/macalg options to the generated PKCS#12', function (done) {
    makeSelfSignedCertificate(function (keys) {
      pem.createPkcs12(keys.clientKey, keys.certificate, 'issue406pw', {
        certpbe: 'AES-256-CBC',
        keypbe: 'AES-256-CBC',
        macalg: 'sha512'
      }, function (err, pkcs12) {
        hlp.checkError(err)
        expect(pkcs12).to.exist()
        expect(pkcs12.pkcs12).to.be.an.instanceof(Buffer)

        var info = pkcs12Info(pkcs12.pkcs12, 'issue406pw', 'issue406-options.p12')
        // MAC algorithm comes straight from -macalg (default would be sha256)
        expect(info).to.match(/MAC:\s*sha512/i)
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

  it('still produces a valid PKCS#12 when no options are given (default path)', function (done) {
    makeSelfSignedCertificate(function (keys) {
      pem.createPkcs12(keys.clientKey, keys.certificate, 'issue406pw3', function (err, pkcs12) {
        hlp.checkError(err)
        expect(function () {
          tls.createSecureContext({ pfx: pkcs12.pkcs12, passphrase: 'issue406pw3' })
        }).to.not.throw()
        done()
      })
    })
  })
})
