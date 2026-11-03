'use strict'
const {debug} = require('../lib/debug.js')
var fs = require('fs')
var openssl = require('../lib/openssl.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

const fipsEnabled = require('node:crypto').getFips()

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
        (fipsEnabled ? 2048 : 1024)
      ], 'DH PARAMETERS ' + (fipsEnabled ? 2048 : 1024), function (error) {
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
        (fipsEnabled ? 2048 : 1024)
      ], function (error, result) {
        hlp.checkError(error)
        expect(result).to.be.ok()
        done()
      })
    })
  })

  describe('#.spawnWrapper() tmpfile permissions', function () {
    it('writes private key tmpfiles readable only by the owner', function (done) {
      var key = fs.readFileSync('./test/fixtures/cn_openssl.key')
      var params = ['pkey', '-in', '--TMPFILE--']
      var writes = []
      var origWrite = fs.writeFileSync
      fs.writeFileSync = function (path, contents, options) {
        writes.push({ path: path, mode: options && options.mode })
        return origWrite.call(fs, path, contents, options)
      }
      openssl.spawnWrapper(params, [key], function (error) {
        fs.writeFileSync = origWrite
        hlp.checkError(error)
        // private key material must not land world-readable in the tmpdir
        expect(writes).to.have.lengthOf(1)
        expect(writes[0].path).to.equal(params[2])
        expect(writes[0].mode & 0o777).to.equal(0o600)
        expect(fs.existsSync(writes[0].path)).to.be.false()
        done()
      })
    })
  })

})
