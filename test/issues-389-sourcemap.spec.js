'use strict'

// Issue #389: the bundled dist entry (ncc) installs a global source-map
// handler (`require('./sourcemap-register.js')` → source-map-support
// overriding Error.prepareStackTrace). Because that handler applies to every
// error in the host process, Jest (and other test runners) report wrong line
// numbers and stack traces once `pem` is imported.
//
// The library must not mutate process-global error formatting as an
// import side effect. The .map file may still ship for consumers who opt in.

var fs = require('fs')
var path = require('path')
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var expect = chai.expect
chai.use(dirtyChai)
var spawnSync = require('child_process').spawnSync

var distEntry = path.join(__dirname, '..', 'dist', 'index.js')

describe('Issue #389 — dist entry must not install a global source-map handler', function () {
  this.timeout(30000)
  this.slow(2000)

  it('does not alter Error.prepareStackTrace when required', function () {
    // measured in a child process: deleting the in-process require cache for
    // dist/index.js would break the ESM/CJS single-instance invariant that
    // index.mjs relies on (esm.default === require('pem'))
    var probe = [
      'const before = Error.prepareStackTrace',
      'require(' + JSON.stringify(distEntry) + ')',
      'if (Error.prepareStackTrace !== before) { process.exit(1) }'
    ].join('\n')
    var res = spawnSync(process.execPath, ['-e', probe], { encoding: 'utf8' })
    expect(res.error, res.stderr).to.not.exist()
    expect(res.status, res.stderr).to.equal(0)
  })

  it('does not contain a sourcemap-register require in the bundle', function () {
    var bundle = fs.readFileSync(distEntry, 'utf8')
    expect(bundle).to.not.match(/require\(['"]\.\/sourcemap-register/)
    expect(bundle).to.not.match(/source-map-support/)
  })

  it('the stale sourcemap-register.js file is no longer shipped', function () {
    expect(fs.existsSync(path.join(__dirname, '..', 'dist', 'sourcemap-register.js'))).to.equal(false)
  })
})
