"use strict"

import fs from "fs"
import path_lib from "path"
import {env} from "process"
import {debug} from "../src/debug"
import * as openssl from "../src/openssl"
import type {Hash} from "../src/types"

env.PEMJS_TMPDIR = path_lib.resolve("./tmp")
debug("ENVs:", env)
if ((env.TRAVIS === "true" || env.CI === "true") && "OPENSSL_DIR" in env && !("OPENSSL_BIN" in env)) {
  env.OPENSSL_BIN = env.GITHUB_WORKSPACE + "/openssl/bin/openssl"
}

/**
 *
 */
function checkTmpEmpty() {
  expect(fs.readdirSync(env.PEMJS_TMPDIR !)).toBeEmpty()
}

/**
 * @param {Error} error thrown error
 * @param {boolean|Object} [expectError] use true or an object of to checked keys
 */
function checkError(error: Error, expectError?: boolean | object) {
  if (expectError) {
    expect(error).toEqual(expect.anything())
    expect(error).toBeInstanceOf(Error)
    if (expectError !== true) { // object
      Object.keys(expectError).forEach(function (k: string) {
        expect((error as any)[k]).toEqual((expectError as any)[k]) // code, message, ...
      })
    }
  } else {
    expect(error).not.toEqual(expect.anything())
    expect(error).not.toBeInstanceOf(Error)
  }
}

/**
 * @param {Object} data Elliptic Curve param Object
 * @param {string} data.ecpaam EC param content
 * @param {number} min Min Length
 * @param {number} max Max Length
 */
function checkEcparam(data: any, min: number, max: number) {
  expect(data).toBeObject()
  expect(data).toHaveProperty("ecparam")
  expect(data.ecparam).toBeType("string")
  expect(/^\r?\n*-----BEGIN EC PARAMETERS-----\r?\n/.test(data.ecparam)).toBeTrue()
  expect(/\r?\n-----END EC PARAMETERS-----\r?\n/.test(data.ecparam)).toBeTrue()
  expect(/\r?\n-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).toBeTrue()
  expect(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).toBeTrue()
  const match = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam)
  expect(match![0].trim().length).toBeWithin(min + 1, max - 1)
}

/**
 * @param {Object} data Ecparam Object
 * @param {string} data.ecpaam Ecparam content
 * @param {number} min Min Length
 * @param {number} max Max Length
 */
function checkEcparamNoOut(data: any, min: number, max: number) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("ecparam")
  expect(data.ecparam).toBeType("string")
  expect(/^\r?\n*-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).toBeTrue()
  expect(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).toBeTrue()
  const match = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam)
  expect(match![0].trim().length).toBeWithin(min + 1, max - 1)
}

/**
 * @param {Object} data Dhparam Object
 * @param {string} data.dhpaam Dhparam content
 * @param {number} min Min Length
 * @param {number} max Max Length
 */
function checkDhparam(data: any, min: number, max: number) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("dhparam")
  expect(data.dhparam).toBeType("string")
  expect(/^\r?\n*-----BEGIN DH PARAMETERS-----\r?\n/.test(data.dhparam)).toBeTrue()
  expect(/\r?\n-----END DH PARAMETERS-----\r?\n*$/.test(data.dhparam)).toBeTrue()
  expect(data.dhparam.trim().length).toBeWithin(min + 1, max - 1)
}

/**
 * @param {Object} data PrivateKey Object
 * @param {string} data.key private key content
 * @param {number} min Min Length
 * @param {number} max Max Length
 * @param {boolean} [encrypted] true if the private key should be encrypted
 */
function checkPrivateKey(data: any, min: number, max: number, encrypted?: boolean) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("key")
  expect(data.key).toBeType("string")
  if (encrypted) {
    expect(/ENCRYPTED(\r?\n|)/.test(data.key)).toBeTrue()
  }
  expect(/^\r?\n*-----BEGIN (RSA |ENCRYPTED |)PRIVATE KEY-----\r?\n/.test(data.key)).toBeTrue()
  expect(/\r?\n-----END (RSA |ENCRYPTED |)PRIVATE KEY-----\r?\n*$/.test(data.key)).toBeTrue()

  expect(data.key.trim().length).toBeWithin(min + 1, max - 1)
}

/**
 * @param {Object} data CSR Object
 * @param {string} data.csr certificate singing request content
 * @param {string} data.clientKey used Private Key for CSR
 * @param {string} [expectClientKey] if you need to check against an already known clientKey
 */
function checkCSR(data: any, expectClientKey?: string) {
  expect(data).toBeType("object");
  ["clientKey", "csr"].forEach(function (k) {
    expect(data).toHaveProperty(k)
    expect(data[k]).toBeType("string")
  })
  if (expectClientKey) {
    expect(data.clientKey).toEqual(expectClientKey)
  }
  expect(/^\r?\n*-----BEGIN CERTIFICATE REQUEST-----\r?\n/.test(data.csr)).toBeTrue()
  expect(/\r?\n-----END CERTIFICATE REQUEST-----\r?\n*$/.test(data.csr)).toBeTrue()
}

/**
 * @param {Object} data CSR Object
 * @param {string} data.certificate certificate  content
 * @param {string} data.clientKey used Private Key for the certificate
 * @param {string} data.serviceKey used Private Key to sign the certificate
 * @param {boolean} [self_signed]  if self-signed certificate use true
 */
function checkCertificate(data: any, self_signed?: boolean) {
  expect(data).toBeType("object");
  ["certificate", "clientKey", "serviceKey", "csr"].forEach(function (k) {
    expect(data).toHaveProperty(k)
    expect(data[k]).toBeType("string")
  })
  expect(/^\r?\n*-----BEGIN CERTIFICATE-----\r?\n/.test(data.certificate)).toBeTrue()
  expect(/\r?\n-----END CERTIFICATE-----\r?\n*$/.test(data.certificate)).toBeTrue()
  if (self_signed) {
    expect(data.clientKey).toEqual(data.serviceKey)
  } else {
    expect(data.clientKey).not.toEqual(data.serviceKey)
  }
}

/**
 * @param {Object} data certificate data
 * @param {Object} info check data that should match the certificate data
 */
function checkCertificateData(data: any, info: any) {
  expect(data).toMatchObject(info)
}

/**
 * @param {Object} data PublicKey data
 * @param {string} data.publicKey publicKey content
 */
function checkPublicKey(data: any) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("publicKey")
  expect(data.publicKey).toBeType("string")
  expect(/^\r?\n*-----BEGIN PUBLIC KEY-----\r?\n/.test(data.publicKey)).toBeTrue()
  expect(/\r?\n-----END PUBLIC KEY-----\r?\n*$/.test(data.publicKey)).toBeTrue()
}

/**
 * @param {Object} data FingerPrint data
 * @param {string} data.fingerprint fingerprint content
 */
function checkFingerprint(data: any) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("fingerprint")
  expect(data.fingerprint).toBeType("string")
  expect(/^[0-9A-F]{2}(:[0-9A-F]{2}){19}$/.test(data.fingerprint)).toBeTrue()
}

/**
 * @param {Object} data Modulus data
 * @param {string} data.modulus modulus content
 * @param {Hash} hashType  which Hash Algorithm should check
 */
function checkModulus(data: any, hashType: Hash) {
  expect(data).toBeType("object")
  expect(data).toHaveProperty("modulus")
  expect(data.modulus).toBeType("string")
  switch (hashType) {
    case "md5":
      expect(/^[a-f0-9]{32}$/i.test(data.modulus)).toBeTrue()
      break
    default:
      expect(/^[0-9A-F]*$/.test(data.modulus)).toBeTrue()
      break
  }
}

export {
  checkTmpEmpty,
  checkError,
  checkDhparam,
  checkEcparam,
  checkEcparamNoOut,
  checkPrivateKey,
  checkCSR,
  checkCertificate,
  checkCertificateData,
  checkPublicKey,
  checkFingerprint,
  checkModulus,
  openssl
}
