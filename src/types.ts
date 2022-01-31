export type ErrNull = Error | null
export type Code = number | string | null | undefined
export type StdOutErr = string | NodeJS.ArrayBufferView
export type Params = Array<string | number>
export type TempFiles = Array<StdOutErr>
export type Cipher = typeof ciphers[number]
export type Hash = typeof hashes[number]


/**
 * list of supported ciphers
 *
 * @type {Array<Cipher>}
 */
export const ciphers = ["aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3", "idea"] as const

/**
 * list of supported hashes
 *
 * @type {Array<Hash>}
 */
export const hashes = ["md5", "sha1", "sha256", "sha386", "sha512", "sha3"] as const


/**
 * Options for Private Keys
 *
 * @type {PrivateKeyOptions} PrivateKeyOptions
 * @param {Object} [options] object of cipher and password {cipher:'aes128',password:'xxx'}, defaults empty object
 * @param {number} [options.pkKeyBitSize=2048] Size of the key, defaults to 2048bit
 * @param {Cipher} [options.pkCipher] string of the cipher for the encryption - needed with password
 * @param {string} [options.pkPassword] string of the cipher password for the encryption needed with cipher
 * @param {Function} callback Callback function with an error object and {key}
 */
export type PrivateKeyOptions = {
  pkKeyBitSize?: number,
  pkCipher?: Cipher,
  pkPassword?: string
}
