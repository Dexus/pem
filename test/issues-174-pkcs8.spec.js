'use strict'

// Issue #174: support for PKCS#8 — convert an existing PEM private key to
// PKCS#8 format (openssl pkcs8 -topk8), optionally encrypted, optionally
// DER-encoded. Use case: verify/read any pkcs8 file or produce one from the
// keys the library already creates.

var pem = require('../lib/pem')
var openssl = require('../lib/openssl.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)
var spawnSync = require('child_process').spawnSync

function opensslPath () {
  return openssl.get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'
}

// Read a key (PEM string or DER Buffer) via stdin — no temp files are
// created, keeping PEMJS_TMPDIR clean for the suite's tmp-empty check.
function opensslReads (args, input) {
  var res = spawnSync(opensslPath(), args, { encoding: 'utf8', input: input })
  if (res.error) {
    throw res.error
  }
  return res.status
}

describe('Issue #174 — createPkcs8 (PKCS#8 support)', function () {
  this.timeout(300000)// 5 minutes
  this.slow(5000)

  // each test creates its own key — no shared before() fixtures
  function makePrivateKey (cb) {
    pem.createPrivateKey(function (err, key) {
      hlp.checkError(err)
      cb(key.key)
    })
  }

  it('is exposed as a function on the pem module', function () {
    expect(pem.createPkcs8).to.be.a('function')
  })

  it('is exposed and working on the deprecated promisified wrapper (types/pem.d.ts promises it)', async function () {
    expect(pem.promisified.createPkcs8).to.be.a('function')
    const key = await pem.createPrivateKey()
    const result = await pem.promisified.createPkcs8(key.key, { outform: 'DER' })
    expect(result.pkcs8).to.be.an.instanceof(Buffer)
    expect(opensslReads(['pkey', '-inform', 'DER', '-noout'], result.pkcs8)).to.equal(0)
  })

  it('converts an unencrypted private key to unencrypted PKCS#8 PEM', function (done) {
    makePrivateKey(function (key) {
      pem.createPkcs8(key, function (err, result) {
        hlp.checkError(err)
        expect(result).to.exist()
        expect(result.pkcs8).to.be.a('string')
        expect(result.pkcs8).to.match(/-+BEGIN PRIVATE KEY-+/)
        expect(result.pkcs8).to.not.match(/-+BEGIN RSA PRIVATE KEY-+/)
        // openssl must be able to read the output back as a private key
        expect(opensslReads(['pkey', '-noout'], result.pkcs8)).to.equal(0)
        done()
      })
    })
  })

  it('converts to an encrypted PKCS#8 PEM when cipher and password are given', function (done) {
    makePrivateKey(function (key) {
      pem.createPkcs8(key, { cipher: 'aes256', password: 'issue174pw' }, function (err, result) {
        hlp.checkError(err)
        expect(result.pkcs8).to.match(/-+BEGIN ENCRYPTED PRIVATE KEY-+/)

        // readable with the password
        expect(opensslReads(['pkey', '-passin', 'pass:issue174pw', '-noout'], result.pkcs8)).to.equal(0)
        // and NOT readable without it — proves encryption was actually applied
        expect(opensslReads(['pkey', '-noout'], result.pkcs8)).to.not.equal(0)
        done()
      })
    })
  })

  it('decrypts an encrypted source key via clientKeyPassword while converting', function (done) {
    makePrivateKey(function (key) {
      pem.createPkcs8(key, { cipher: 'aes256', password: 'issue174pw2' }, function (err, encrypted) {
        hlp.checkError(err)
        pem.createPkcs8(encrypted.pkcs8, { clientKeyPassword: 'issue174pw2' }, function (err, result) {
          hlp.checkError(err)
          expect(result.pkcs8).to.match(/-+BEGIN PRIVATE KEY-+/)
          done()
        })
      })
    })
  })

  it('returns DER binary when outform is DER', function (done) {
    makePrivateKey(function (key) {
      pem.createPkcs8(key, { outform: 'DER' }, function (err, result) {
        hlp.checkError(err)
        expect(result.pkcs8).to.be.an.instanceof(Buffer)

        expect(opensslReads(['pkey', '-inform', 'DER', '-noout'], result.pkcs8)).to.equal(0)
        done()
      })
    })
  })
})
