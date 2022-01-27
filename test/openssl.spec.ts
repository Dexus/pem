'use strict'
import {debug} from '../src/debug'
import * as openssl from '../src/openssl'
import * as chai from 'chai'

var hlp = require('./pem.helper.js')
var dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

// NOTE: we cover here only the test cases left in coverage report
describe('openssl.js tests', function () {
    this.timeout(300000)// 5 minutes
    this.slow(2000)// 2 seconds

    describe('#.exec()', function () {
        it('search string not found', function (done) {
            openssl.exec(function (error) {
                hlp.checkError(error, true)
                done()
            }, [
                'dhparam',
                '-outform',
                'PEM',
                1024
            ], 'DH PARAMETERS 1024')
        })
    })

    describe('#.get("openSslVersion")', function () {
        it('get Version', function (done) {
            debug('Settings', openssl.get())
            if (process.env.LIBRARY && process.env.VERSION) {
                expect(process.env.LIBRARY.toUpperCase()).to.equal(openssl.get('Vendor'))
                expect(process.env.VERSION).to.equal(openssl.get('VendorVersion') + (openssl.get('VendorVersionBuildChar') || ''))
            }
            done()
        })
    })

    describe('#.execBinary()', function () {
        it('no tmpfiles parameter', function (done) {
            openssl.execBinary(function (error, result) {
                hlp.checkError(error)
                expect(result).to.be.ok()
                done()
            }, [
                'dhparam',
                '-outform',
                'PEM',
                1024
            ])
        })
    })


    describe('#.spawn()', function () {
        it.skip('error case [openssl return code 2]', function (done) {
            // TODO; couldn't figure an example out
            done()
        })
        // TODO; I expect some more cases in here or code cleanup required
    })

})
