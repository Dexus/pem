'use strict'

import pem from '../lib/pem'
import pemHelper from '../lib/helper.js'

import fs from 'fs'
import * as hlp from './pem.helper.js'
import {debug} from '../lib/debug.js'

describe('convert.js tests', function () {
  afterAll(function (done) {
    let temp_files;
    temp_files = [
      './test/fixtures/tmp.der',
      './test/fixtures/tmp.pem',
      './test/fixtures/tmp.p7b',
      './test/fixtures/tmp.pfx'
    ]
    pemHelper.deleteTempFiles(temp_files, function (fsErr) {
      hlp.checkError(fsErr)
      done()
    })
  })

  describe('trigger error case', function () {
    beforeAll(function () {
      pem.config({
        pathOpenSSL: 'zzzzzzzzzzz'
      })
    })
    it('#.PEM2DER()', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.DER2PEM()', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.PEM2P7B()', function (done) {
      pem.convert.PEM2P7B({cert: './test/fixtures/nopkey.pem'}, './test/fixtures/tmp.p7b', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.P7B2PEM()', function (done) {
      pem.convert.P7B2PEM('./test/fixtures/tmp.p7b', './test/fixtures/tmp.pem', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.PEM2PFX()', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/testnopw.key'
      }
      // password is required to encrypt the .pfx file; enforced by openssl
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.PFX2PEM()', function (done) {
      pem.convert.PFX2PEM('./test/fixtures/tmp.pfx', './test/fixtures/tmp.pem', 'password', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.P7B2PFX() [error in 1st step]', function (done) {
      pem.convert.P7B2PFX({
        cert: './test/fixtures/test.p7b',
        key: './test/fixtures/test.key',
        ca: './test/fixtures/GeoTrust_Primary_CA.pem'
      }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    it('#.P7B2PFX() [error in 2nd step]', function (done) {
      pem.config({
        pathOpenSSL: process.env.OPENSSL_BIN || 'openssl'
      })
      pem.convert.P7B2PFX({
        cert: './test/fixtures/test.p7b',
        key: './test/fixtures/test404.key',
        ca: './test/fixtures/ca404.pem'
      }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          debug("TEST pem.convert.PEM2DER", {error, result})
          hlp.checkError(error, true)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  describe('check all success cases', function () {
    it('#.PEM2DER() [not providing type]', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2DER() [providing type]', function (done) {
      pem.convert.PEM2DER('./test/fixtures/nopkey.pem', './test/fixtures/tmp.der', 'x509', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.DER2PEM() [not providing type]', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
          var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
          expect(f1).toEqual(f2)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.DER2PEM() [providing type]', function (done) {
      pem.convert.DER2PEM('./test/fixtures/tmp.der', './test/fixtures/tmp.pem', 'x509', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
          var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
          expect(f1).toEqual(f2)
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2P7B() [providing a CA cert; no array format]', function (done) {
      pem.convert.PEM2P7B({
        cert: './test/fixtures/nopkey.pem',
        ca: './test/fixtures/GeoTrust_Primary_CA.pem'
      }, './test/fixtures/tmp.p7b', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2P7B() [providing a CA cert; array format]', function (done) {
      pem.convert.PEM2P7B({
        cert: './test/fixtures/nopkey.pem',
        ca: ['./test/fixtures/GeoTrust_Primary_CA.pem']
      }, './test/fixtures/tmp.p7b', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2P7B() [not providing a CA cert]', function (done) {
      pem.convert.PEM2P7B({cert: './test/fixtures/nopkey.pem'}, './test/fixtures/tmp.p7b', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.P7B2PEM()', function (done) {
      pem.convert.P7B2PEM('./test/fixtures/tmp.p7b', './test/fixtures/tmp.pem', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          var f1 = fs.readFileSync('./test/fixtures/nopkey.pem').toString()
          var f2 = fs.readFileSync('./test/fixtures/tmp.pem').toString()
          // can't directly compare as f2 comes with x509v3 header which might not be included in source file
          pem.readCertificateInfo(f1, function (error, d1) {
            hlp.checkError(error)
            pem.readCertificateInfo(f2, function (error, d2) {
              hlp.checkError(error)
              expect(d1).to.eql(d2)
            })
            done()
          })
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2PFX() [no password protected key file]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/testnopw.key'
      }
      // password is required to encrypt the .pfx file; enforced by openssl
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2PFX() [password protected key file]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key'
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2PFX() [providing CA cert; no array format]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key',
        ca: './test/fixtures/GeoTrust_Primary_CA.pem'
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PEM2PFX() [providing CA cert; array format]', function (done) {
      var pathIN = {
        cert: './test/fixtures/test.crt',
        key: './test/fixtures/test.key',
        ca: ['./test/fixtures/GeoTrust_Primary_CA.pem']
      }
      pem.convert.PEM2PFX(pathIN, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.PFX2PEM()', function (done) {
      pem.convert.PFX2PEM('./test/fixtures/tmp.pfx', './test/fixtures/tmp.pem', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.P7B2PFX() [providing ca cert; no array format]', function (done) {
      pem.convert.P7B2PFX({
        cert: './test/fixtures/test.p7b',
        key: './test/fixtures/test.key',
        ca: './test/fixtures/GeoTrust_Primary_CA.pem'
      }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.P7B2PFX() [providing ca cert; array format]', function (done) {
      pem.convert.P7B2PFX({
        cert: './test/fixtures/test.p7b',
        key: './test/fixtures/test.key',
        ca: ['./test/fixtures/GeoTrust_Primary_CA.pem']
      }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })

    it('#.P7B2PFX() [not providing ca cert]', function (done) {
      pem.convert.P7B2PFX({
        cert: './test/fixtures/test.p7b',
        key: './test/fixtures/test.key'
      }, './test/fixtures/tmp.pfx', 'password', function (error, result) {
        try {
          hlp.checkError(error)
          expect(result).toBeTruthy()
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
})
