/**
 * Spawn an openssl command
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
export function exec(params: any[], searchStr: string, tmpfiles?: any[] | undefined, callback: Function): void;
/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
 */
export function execBinary(params: any[], tmpfiles?: any[] | undefined, callback: Function): void;
/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
export function spawn(params: any[], binary: boolean, callback: Function): void;
/**
 * Wrapper for spawn method
 *
 * @static
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 */
export function spawnWrapper(params: any[], tmpfiles?: any[] | undefined, binary?: boolean | undefined, callback: Function): void;
export var settings: {};
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
export function set(option: string, value: any): void;
/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
export function get(option: string): any;
//# sourceMappingURL=openssl.d.ts.map