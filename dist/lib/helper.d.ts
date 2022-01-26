export function isNumber(str: string): boolean;
export function isHex(hex: string): boolean;
export function toHex(str: string): string;
export var ciphers: any[];
export function createPasswordFile(options: {
    cipher: string;
    password: string;
    passType: string;
    mustPass: boolean;
}, params: Object, PasswordFileArray: string): boolean;
export function deleteTempFiles(files: any[], callback: errorCallback): any;
/**
 * Callback for return an error object.
 */
export type errorCallback = (err: Error) => any;
//# sourceMappingURL=helper.d.ts.map