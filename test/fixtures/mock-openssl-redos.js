#!/usr/bin/env node
'use strict'
// Deterministic stand-in for "openssl -text" used by the ReDoS regression
// tests (GHSA-qjfp-29fv-wmf8). pem passes the requested subcommand as the
// first argument, so the payload is selected on argv[2]:
//
//  - "x509": Subject:/Issuer: headers followed by whitespace-only lines that
//    run to EOF. The pre-fix block regexes backtracked quadratically on this
//    shape (the trailing \s*\b can only fail at EOF), the fixed ones parse
//    it in linear time.
//  - "req": an Issuer: block with no fields followed by a word character.
//    The pre-fix block regex matched it with zero fields and fetchCertificateData
//    then crashed with a TypeError on the missing matchAll result.
//
// stderr must stay empty: readCertificateInfo treats any stderr as fatal.
if (process.argv[2] === 'req') {
  process.stdout.write(
    'Certificate:\n' +
    '    Request:\n' +
    '        Subject: C = US, ST = CA, CN = hostile.example\n' +
    '        Issuer:\n' +
    ' \n'.repeat(20000) +
    '        Subject Public Key Info:\n'
  )
} else {
  process.stdout.write(
    'Certificate:\n' +
    '    Data:\n' +
    '        Version: 3 (0x2)\n' +
    '        Serial Number:\n' +
    '            1a:2b:3c:4d\n' +
    '        Issuer:\n' +
    ' \n'.repeat(50000) +
    '        Subject:\n' +
    ' \n'.repeat(50000)
  )
}
