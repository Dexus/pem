/// <reference types="node" />
export declare const name: string;
import { CallbackErrCodeStdoutSdrerr, CallbackErrStdout } from './interfaces';
/**
 * pem openssl module
 *
 * @module openssl
 */
/**
 * configue this openssl module
 *
 * @static
 * @param {String} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {*} value value
 */
export declare function set(option: string, value: any): void;
/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
export declare function get(option: string): any;
/**
 * Spawn an openssl command
 *
 * @static
 * @param {CallbackErrStdout} callback Called with (error, stdout-substring)
 * @param {Array<string>} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array<string>} [tmpfiles] list of temporary files
 */
export declare function exec(callback: CallbackErrStdout, params: string[], searchStr: string): void;
/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {CallbackErrStdout} callback Called with (error, stdout)
 * @param {Array<string>} params Array of openssl command line parameters
 * @param {Array<string>} [tmpfiles] list of temporary files
 */
export declare function execBinary(callback: CallbackErrStdout, params: string[]): void;
/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {CallbackErrCodeStdoutSdrerr}     callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 */
export declare function spawn(callback: CallbackErrCodeStdoutSdrerr, params: string[], binary: boolean): void;
/**
 * Wrapper for spawn method
 *
 * @static
 * @param {CallbackErrCodeStdoutSdrerr} callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>} params The parameters to pass to openssl
 * @param {Array<string>} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 */
export declare function spawnWrapper(callback: CallbackErrCodeStdoutSdrerr, params: string[], tmpfiles?: Array<string | NodeJS.ArrayBufferView>, binary?: boolean): void;
