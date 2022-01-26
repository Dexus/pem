/// <reference types="node" />
export declare const name: string;
import { Func4WithError } from './interfaces';
export declare const settings: any;
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
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
export declare function exec(callback: Func4WithError, params: string[], searchStr: string): void;
/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
 */
export declare function execBinary(callback: Function, params: string[]): void;
/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 */
export declare function spawn(callback: Function, params: string[], binary: boolean): void;
/**
 * Wrapper for spawn method
 *
 * @static
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 */
export declare function spawnWrapper(callback: Function, params: string[], tmpfiles?: Array<string | NodeJS.ArrayBufferView>, binary?: boolean): void;
//# sourceMappingURL=openssl.d.ts.map