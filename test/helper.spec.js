'use strict'

var fs = require('fs')
var helper = require('../lib/helper.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

// NOTE: we cover here only the test cases left in coverage report
describe('helper.js tests', function () {
  describe('#.createPasswordFile()', function () {
    it('invalid options [not sufficient object keys]', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        {},
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })

    it('invalid options [no password and passType option]', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        { cipher: '', bla: true, blub: true },
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })

    it('mustPass option', function (done) {
      var tmpfiles = []
      var bufferOrPath = fs.readFileSync('./test/fixtures/idsrv3test.pfx')
      helper.createPasswordFile(
        { cipher: '', password: 'gregegegeg', passType: 'in', mustPass: 'password' },
        ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes'],
        tmpfiles
      )
      helper.deleteTempFiles(tmpfiles, function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
  })

  describe('#.deleteTempFiles()', function () {
    it('files argument typeof string', function (done) {
      helper.deleteTempFiles('404.pem', function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })

    it('files argument invalid type', function (done) {
      helper.deleteTempFiles(true, function (fsErr) {
        hlp.checkError(fsErr, true)
        done()
      })
    })

    it('files argument array contains non-string value', function (done) {
      helper.deleteTempFiles([true], function (fsErr) {
        hlp.checkError(fsErr)
        done()
      })
    })
  })
})

// Which openssl binary the suite runs against is owned by lib/openssl.js
// (DEBUG=true + LIBRARY + VERSION + existing ./openssl/${LIBRARY}_v${VERSION}
// layout). test/pem.helper.js must not set OPENSSL_BIN itself: its former
// OPENSSL_DIR-based block computed a stale, never-valid path. These tests
// reload test/pem.helper.js with a controlled environment to guard against
// that logic coming back.
describe('pem.helper.js env handling', function () {
  var ENV_KEYS = ['TRAVIS', 'DEBUG', 'OPENSSL_DIR', 'OPENSSL_BIN', 'GITHUB_WORKSPACE']
  var savedEnv = {}

  beforeEach(function () {
    ENV_KEYS.forEach(function (key) {
      savedEnv[key] = process.env[key]
    })
  })

  afterEach(function () {
    ENV_KEYS.forEach(function (key) {
      if (typeof savedEnv[key] === 'undefined') {
        delete process.env[key]
      } else {
        process.env[key] = savedEnv[key]
      }
    })
    delete require.cache[require.resolve('./pem.helper.js')]
  })

  it('does not derive OPENSSL_BIN from OPENSSL_DIR', function () {
    process.env.TRAVIS = 'true'
    process.env.OPENSSL_DIR = '/usr/local/openssl'
    delete process.env.OPENSSL_BIN
    delete process.env.GITHUB_WORKSPACE
    delete require.cache[require.resolve('./pem.helper.js')]
    require('./pem.helper.js')
    expect(process.env).to.not.have.property('OPENSSL_BIN')
  })
})
