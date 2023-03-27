'use strict'
const {debug} = require('../lib/debug.js')
var openssl = require('../lib/openssl.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

// NOTE: we cover here only the test cases left in coverage report
describe('openssl.js tests', function () {
  this.timeout(300000)// 5 minutes
  this.slow(2000)// 2 seconds

  describe('#.exec()', function () {
    it('search string not found', function (done) {
      openssl.exec([
        'dhparam',
        '-outform',
        'PEM',
        1024
      ], 'DH PARAMETERS 1024', function (error) {
        hlp.checkError(error, true)
        done()
      })
    })
  })

  describe('#.get("openSslVersion")', function () {
    it('get Version', function (done) {
      debug('Settings', openssl.settings)
      if (process.env.LIBRARY && process.env.VERSION) {
        expect(process.env.LIBRARY.toUpperCase()).to.equal(openssl.get('Vendor'))
        expect(process.env.VERSION).to.equal(openssl.get('VendorVersion') + (openssl.get('VendorVersionBuildChar') || ''))
      }
      done()
    })
  })

  describe('#.execBinary()', function () {
    it('no tmpfiles parameter', function (done) {
      openssl.execBinary([
        'dhparam',
        '-outform',
        'PEM',
        1024
      ], function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
  })

})
