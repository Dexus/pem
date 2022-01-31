"use strict"
import {env} from "process"
import {debug} from "../src"
import {exec, execBinary, getConfig as getConfig, spawn, spawn_async} from "../src/openssl"
import {Code, ErrNull, StdOutErr} from "../src/types"
import versions from "../versions.json"
import * as hlp from "./pem.helper"


// NOTE: we cover here only the test cases left in coverage report
describe("openssl.js tests", function () {
  describe("#.exec()", function () {
    test("search string not found", function () {
      return new Promise((resolve, reject) => {
        exec(function (error) {
          hlp.checkError(error, true)
          error && resolve(true)
          reject(error)
        }, [
          "dhparam",
          "-outform",
          "PEM",
          256
        ], "DH PARAMETERS 1024")
      })
    })
  })

  describe("#.exec_async()", function () {
    test.skip("search string not found", function () {
      return new Promise((resolve, reject) => {
        exec(function (error) {
          hlp.checkError(error, true)
          error && resolve(true)
          reject(error)

        }, [
          "dhparam",
          "-outform",
          "PEM",
          1024
        ], "DH PARAMETERS 1024")
      })
    })
  })

  describe("#.get(\"openSslVersion\")", function () {
    test("get Version", function (done) {
      debug("Settings", getConfig())
      if (!("LIBRARY" as string in env && "VERSION" as string in env)) {
        done()
        return
      }
      expect(env.LIBRARY!.toUpperCase()).toEqual(getConfig("Vendor"))
      expect(env.VERSION).toEqual(getConfig("VendorVersion") + (getConfig("VendorVersionBuildChar") || ""))
      done()
    })
  })

  describe("#.execBinary()", function () {
    test("no tmpfiles parameter", function () {
      return new Promise((resolve, reject) => {
        execBinary(function (error, result) {
          hlp.checkError(error)
          if (error) reject(error)
          expect(result).toBeDefined()
          resolve(true)
        }, [
          "dhparam",
          "-outform",
          "PEM",
          128
        ])
      })
    })
  })


  describe("#.execBinary_async()", function () {
    it.skip("no tmpfiles parameter", function () {
      return new Promise((resolve, reject) => {
        execBinary(function (error, result) {
          hlp.checkError(error)
          expect(result).toEqual(expect.anything())
          error && reject(error)
          resolve(true)
        }, [
          "dhparam",
          "-outform",
          "PEM",
          1024
        ])
      })
    })
  })


  describe("#.spawn()", function () {

    const versionRegEx = new RegExp("^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?")
    test("get version", function () {
      return new Promise((resolve, reject) => {

        /* Once PEM is imported, the openSslVersion is set with this function. */
        spawn(function (err: ErrNull, _code?: Code, stdout?: StdOutErr, stderr?: StdOutErr): void {
          try {
            const Vendors = ["OPENSSL", "LIBRESSL"]

            const text = String(stdout) + "\n" + String(stderr) + "\n" + String(err)
            const version = versionRegEx.exec(text)
            expect(version).not.toBeNull()
            expect(version!.length).toBeGreaterThanOrEqual(6)

            const testVendor = version![1].toUpperCase()
            expect(Vendors).toContain(testVendor)

            const testVersion = (versions as any)[testVendor][version![2]]
            expect(testVersion).not.toBeUndefined()
            expect(testVersion).toBeTrue()

            resolve(true)
          } catch (error: any) {
            reject(error)
          }
        }, ["version"], false)
      })
    })
    test("get version (async)", async function () {

      /* Once PEM is imported, the openSslVersion is set with this function. */
      return spawn_async(["version"], false).then(({err, stdout, stderr}) => {
        try {
          const Vendors = ["OPENSSL", "LIBRESSL"]

          const text = String(stdout) + "\n" + String(stderr) + "\n" + String(err)
          const version = versionRegEx.exec(text)
          expect(version).not.toBeNull()
          expect(version!.length).toBeGreaterThanOrEqual(6)

          const testVendor = version![1].toUpperCase()
          expect(Vendors).toContain(testVendor)

          const testVersion = (versions as any)[testVendor][version![2]]
          expect(testVersion).not.toBeUndefined()
          expect(testVersion).toBeTrue()
          return
        } catch (e) {
          throw e
        }
      })
    })
    test("get '_version' - typo failure (async)", function () {

      /* Once PEM is imported, the openSslVersion is set with this function. */
      return expect(spawn_async(["_version"], false)).toReject()


    })
    test("get 'pkeyparam' - failure - timeout (async)", function () {

      const run = spawn_async(["pkeyparam"], false)
      run.catch((e) => {
        console.log(e)
        return e
      })
      /* Once PEM is imported, the openSslVersion is set with this function. */
      return expect(run).toReject()


    })
    it.skip("error case [openssl return code 2]", function (): Promise<boolean> {
      return new Promise((resolve) => {
        expect(1).toEqual(1)
        // TODO; couldn't figure an example out
        resolve(true)
      })
    })
    // TODO; I expect some more cases in here or code cleanup required
    /**
     *
     *
     * The exit codes for smime are as follows:
     *
     * 0   The operation was completely successful.
     * 1   An error occurred parsing the command options.
     * 2   One of the input files could not be read.
     * 3   An error occurred creating the file or when reading the message.
     * 4   An error occurred decrypting or verifying the message.
     * 5   An error occurred writing certificates.
     *
     * The exit codes for cms are as follows:
     *
     * 0   The operation was completely successful.
     * 1   An error occurred parsing the command options.
     * 2   One of the input files could not be read.
     * 3   An error occurred creating the CMS file or when reading the MIME message.
     * 4   An error occurred decrypting or verifying the message.
     * 5   The message was verified correctly but an error occurred writing out the signer's certificates.
     * 6   An error occurred writing the output file.
     * 32+ A verify error occurred while -verify_retcode is specified.
     *
     *
     */
  })

})
