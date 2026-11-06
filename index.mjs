// ESM entry for pem.
// Imports the CJS bundle and re-exports the full public surface as named
// exports so `import pem from 'pem'` and `import { createCertificate } from 'pem'`
// both resolve to the same runtime object as `require('pem')`. Both modes share
// one module instance: Node caches ./dist/index.js as CJS, so the wrapper's
// import and a require() call see identical state (e.g. pem.config).
// The named list MUST stay in lockstep with the CJS surface — enforced by
// test/esm.spec.js and the esm-surface check.
import pem from './dist/index.js'

export default pem

export const createPrivateKey = pem.createPrivateKey
export const createDhparam = pem.createDhparam
export const createEcparam = pem.createEcparam
export const createCSR = pem.createCSR
export const createCertificate = pem.createCertificate
export const readCertificateInfo = pem.readCertificateInfo
export const getPublicKey = pem.getPublicKey
export const getFingerprint = pem.getFingerprint
export const getModulus = pem.getModulus
export const getDhparamInfo = pem.getDhparamInfo
export const createPkcs12 = pem.createPkcs12
export const readPkcs12 = pem.readPkcs12
export const createPkcs8 = pem.createPkcs8
export const verifySigningChain = pem.verifySigningChain
export const checkCertificate = pem.checkCertificate
export const checkPkcs12 = pem.checkPkcs12
export const config = pem.config
export const convert = pem.convert
export const CA = pem.CA
export const createCA = pem.createCA
export const promisified = pem.promisified
