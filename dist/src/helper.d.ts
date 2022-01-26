/// <reference types="node" />
export declare const name: string;
/**
 * pem helper module
 *
 * @module helper
 */
/**
 * helper function to check is the string a number or not
 * @param {String} str String that should be checked to be a number
 */
export declare function isNumber(str: any): boolean;
/**
 * helper function to check is the string a hexaceximal value
 * @param {String} hex String that should be checked to be a hexaceximal
 */
export declare function isHex(hex: string): boolean;
/**
 * helper function to convert a string to a hexaceximal value
 * @param {String} str String that should be converted to a hexaceximal
 */
export declare function toHex(str: string): string;
/**
 * list of supported ciphers
 * @type {Array}
 */
export declare const ciphers: string[];
/**
 * Creates a PasswordFile to hide the password form process infos via `ps auxf` etc.
 * @param {Object} options object of cipher, password and passType, mustPass, {cipher:'aes128', password:'xxxx', passType:"in/out/word"}, if the object empty we do nothing
 * @param {String} options.cipher cipher like 'aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea'
 * @param {String} options.password password can be empty or at last 4 to 1023 chars
 * @param {String} options.passType passType: can be in/out/word for passIN/passOUT/passWORD
 * @param {Boolean} options.mustPass mustPass is used when you need to set the pass like as "-password pass:" most needed when empty password
 * @param {Array<string>} params params will be extended with the data that need for the openssl command. IS USED AS POINTER!
 * @param {Array<string>} PasswordFileArray PasswordFileArray is an array of filePaths that later need to deleted ,after the openssl command. IS USED AS POINTER!
 * @return {Boolean} result
 */
export declare function createPasswordFile(options: {
    cipher: string;
    password: string;
    passType: string;
    mustPass: boolean;
}, params: string[], PasswordFileArray: string[]): boolean;
/**
 * Deletes a file or an array of files
 * @param {Array} files array of files that shoudld be deleted
 * @param {errorCallback} callback Callback function with an error object
 */
export declare function deleteTempFiles(files: string[], callback: Function): any;
/**
 * @param error the error object.
 * @returns if given error object is a NodeJS error.
 */
export declare function isError(error: Error): error is NodeJS.ErrnoException;
//# sourceMappingURL=helper.d.ts.map