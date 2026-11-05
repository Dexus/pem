'use strict'

// Issue #305: users need a way to add custom OpenSSL command line parameters
// (engines, providers, propquery...) without patching the library. The agreed
// shape is a list of extra params merged into every openssl invocation:
//
//   pem.config({ openSslParams: ['-provider', 'default'] })
//
// Discriminating assertion: an unknown flag set via openSslParams MUST make
// openssl fail with "Unknown option" — proving the params really reached the
// openssl argv (pre-fix they are silently dropped and the call succeeds).

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
      expect(String((err && err.message) || err)).to.match(/unknown option/i)
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
      expect(String((err && err.message) || err)).to.match(/unknown option/i)
      pem.config({ openSslParams: [] })
      done()
    })
  })

  it('applies real params: -provider default keeps calls working', function (done) {
    openssl.set('openSslParams', ['-provider', 'default'])
    pem.createPrivateKey(function (err, key) {
      hlp.checkError(err)
      expect(key.key).to.be.a('string')
      done()
    })
  })
})
