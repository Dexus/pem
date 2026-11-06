'use strict'

// Issue #305: users need a way to add custom OpenSSL command line parameters
// (engines, providers, propquery...) without patching the library. The agreed
// shape is a list of extra params merged into every openssl invocation:
//
//   pem.config({ openSslParams: ['-provider', 'default'] })
//
// Discriminating assertion: an unknown flag set via openSslParams MUST make
// openssl exit non-zero — proving the params really reached the openssl argv
// (pre-fix they are silently dropped and the call succeeds). The assertion is
// deliberately on the exit behavior, not on the message text: diagnostics
// differ across the supported library matrix (OpenSSL 1.1.1: "Unrecognized
// flag", 3.0: "Unknown cipher", 3.4+: "Unknown option or cipher", LibreSSL:
// usage dump), so no single text matches everywhere.

var pem = require('../lib/pem')
var openssl = require('../lib/openssl.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

describe('Issue #305 — openSslParams (custom OpenSSL parameters)', function () {
  this.timeout(300000)// 5 minutes
  this.slow(5000)

  afterEach(function () {
    openssl.set('openSslParams', [])
  })

  it('injects openSslParams into the openssl argv (unknown flag surfaces as error)', function (done) {
    openssl.set('openSslParams', ['-notarealflag305'])
    pem.createPrivateKey(function (err) {
      expect(err).to.be.ok()
      done()
    })
  })

  it('does not alter calls when openSslParams is empty', function (done) {
    openssl.set('openSslParams', [])
    pem.createPrivateKey(function (err, key) {
      hlp.checkError(err)
      expect(key).to.exist()
      expect(key.key).to.be.a('string')
      done()
    })
  })

  it('is reachable through the public pem.config() idiom', function (done) {
    pem.config({ openSslParams: ['-notarealflag305'] })
    pem.createPrivateKey(function (err) {
      expect(err).to.be.ok()
      pem.config({ openSslParams: [] })
      done()
    })
  })

  it('applies real params: -outform PEM keeps calls working', function (done) {
    // -outform PEM is accepted by every supported library (providers via
    // -provider are OpenSSL >= 3.0 only, so they cannot serve as a
    // matrix-wide benign control) and genpkey's default output is PEM
    // anyway, so a benign real param keeps the call working.
    openssl.set('openSslParams', ['-outform', 'PEM'])
    pem.createPrivateKey(function (err, key) {
      hlp.checkError(err)
      expect(key.key).to.be.a('string')
      done()
    })
  })
})
