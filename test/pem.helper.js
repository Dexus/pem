'use strict'

var fs = require('fs')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)

function checkTmpEmpty () {
  expect(fs.readdirSync(process.env.PEMJS_TMPDIR)).to.be.empty()
}

function checkError (error, expectError) {
  if (expectError) {
    expect(error).to.be.ok()
    if (expectError !== true) { // object
      Object.keys(expectError).forEach(function (k) {
        expect(error[k]).to.equal(expectError[k]) // code, message, ...
      })
    }
  } else { expect(error).to.not.be.ok() }
}

function checkDhparam (data, min, max) {
  expect(data).to.be.an('object').that.has.property('dhparam')
  expect(data.dhparam).to.be.a('string')
  expect(/^\n*-----BEGIN DH PARAMETERS-----\n/.test(data.dhparam)).to.be.true()
  expect(/\n-----END DH PARAMETERS-----\n*$/.test(data.dhparam)).to.be.true()
  expect(data.dhparam.trim().length).to.be.within(min + 1, max - 1)
}

function checkPrivateKey (data, min, max, encrypted) {
  expect(data).to.be.an('object').that.has.property('key')
  expect(data.key).to.be.a('string')
  if (encrypted) { expect(/ENCRYPTED\n/.test(data.key)).to.be.true() }
  expect(/^\n*-----BEGIN RSA PRIVATE KEY-----\n/.test(data.key)).to.be.true()
  expect(/\n-----END RSA PRIVATE KEY-----\n*$/.test(data.key)).to.be.true()
  expect(data.key.trim().length).to.be.within(min + 1, max - 1)
}

function checkCSR (data, expectClientKey) {
  expect(data).to.be.an('object');
  ['clientKey', 'csr'].forEach(function (k) {
    expect(data).to.have.property(k)
    expect(data[k]).to.be.a('string')
  })
  if (expectClientKey) { expect(data.clientKey).to.equal(expectClientKey) }
  expect(/^\n*-----BEGIN CERTIFICATE REQUEST-----\n/.test(data.csr)).to.be.true()
  expect(/\n-----END CERTIFICATE REQUEST-----\n*$/.test(data.csr)).to.be.true()
}

function checkCertificate (data, selfsigned) {
  expect(data).to.be.an('object');
  ['certificate', 'clientKey', 'serviceKey', 'csr'].forEach(function (k) {
    expect(data).to.have.property(k)
    expect(data[k]).to.be.a('string')
  })
  expect(/^\n*-----BEGIN CERTIFICATE-----\n/.test(data.certificate)).to.be.true()
  expect(/\n-----END CERTIFICATE-----\n*$/.test(data.certificate)).to.be.true()
  if (selfsigned) { expect(data.clientKey).to.equal(data.serviceKey) } else { expect(data.clientKey).to.not.equal(data.serviceKey) }
}

function checkCertificateData (data, info) {
  expect(data).to.deep.equal(info)
}

function checkPublicKey (data) {
  expect(data).to.be.an('object').that.has.property('publicKey')
  expect(data.publicKey).to.be.a('string')
  expect(/^\n*-----BEGIN PUBLIC KEY-----\n/.test(data.publicKey)).to.be.true()
  expect(/\n-----END PUBLIC KEY-----\n*$/.test(data.publicKey)).to.be.true()
}

function checkFingerprint (data) {
  expect(data).to.be.an('object').that.has.property('fingerprint')
  expect(data.fingerprint).to.be.a('string')
  expect(/^[0-9A-F]{2}(:[0-9A-F]{2}){19}$/.test(data.fingerprint)).to.be.true()
}

function checkModulus (data, encryptAlgorithm) {
  expect(data).to.be.an('object').that.has.property('modulus')
  expect(data.modulus).to.be.a('string')
  switch (encryptAlgorithm) {
    case 'md5':
      expect(/^[a-f0-9]{32}$/i.test(data.modulus)).to.be.true()
      break
    default:
      expect(/^[0-9A-F]*$/.test(data.modulus)).to.be.true()
      break
  }
}

module.exports = {
  checkTmpEmpty: checkTmpEmpty,
  checkError: checkError,
  checkDhparam: checkDhparam,
  checkPrivateKey: checkPrivateKey,
  checkCSR: checkCSR,
  checkCertificate: checkCertificate,
  checkCertificateData: checkCertificateData,
  checkPublicKey: checkPublicKey,
  checkFingerprint: checkFingerprint,
  checkModulus: checkModulus
}
