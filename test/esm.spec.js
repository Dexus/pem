'use strict'

var fs = require('fs')
var pemCJS = require('pem')
var pemHelper = require('../lib/helper.js')
var hlp = require('./pem.helper.js')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

describe('ESM interop', function () {
  after(function (done) {
    var tmpfiles = [
      './test/fixtures/tmp.esm.der',
      './test/fixtures/tmp.esm.pem'
    ]
    pemHelper.deleteTempFiles(tmpfiles, function (fsErr) {
      hlp.checkError(fsErr)
      done()
    })
  })

  it('exposes the full public surface through import()', async function () {
    // eslint-disable-next-line import/no-unresolved -- self-reference via the exports map; eslint's resolver cannot resolve a package by its own name
    const esm = await import('pem')
    expect(esm.default).to.equal(pemCJS)
    const keys = Object.keys(pemCJS).sort()
    for (const key of keys) {
      expect(esm[key], 'named export ' + key).to.equal(pemCJS[key])
    }
    expect(Object.keys(esm).filter(function (k) { return k !== 'default' }).sort()).to.deep.equal(keys)
  })

  it('converts PEM to DER and back through the ESM entry', async function () {
    // eslint-disable-next-line import/no-unresolved -- self-reference via the exports map; eslint's resolver cannot resolve a package by its own name
    const { convert } = await import('pem')
    const pemPath = './test/fixtures/nopkey.pem'
    const pemString = fs.readFileSync(pemPath, 'utf8')
    const der = await new Promise(function (resolve, reject) {
      convert.PEM2DER(pemPath, './test/fixtures/tmp.esm.der', function (error, result) {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
    expect(der).to.be.true()
    // probed on this repo: PEM2DER(nopkey.pem) is byte-identical to the committed DER fixture
    expect(fs.readFileSync('./test/fixtures/tmp.esm.der').equals(fs.readFileSync('./test/fixtures/nopkey.der'))).to.be.true()
    const back = await new Promise(function (resolve, reject) {
      convert.DER2PEM('./test/fixtures/tmp.esm.der', './test/fixtures/tmp.esm.pem', function (error, result) {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
    expect(back).to.be.true()
    expect(fs.readFileSync('./test/fixtures/tmp.esm.pem', 'utf8')).to.equal(pemString)
  })
})
