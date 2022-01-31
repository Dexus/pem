/// <reference types="node" />
export declare const name: string;
export declare function isNumber(str: any): boolean;
export declare function isHex(hex: string): boolean;
export declare function toHex(str: string): string;
export declare const ciphers: string[];
export declare function createPasswordFile(options: {
    cipher: string;
    password: string;
    passType: string;
    mustPass: boolean;
}, params: string[], PasswordFileArray: string[]): boolean;
export declare function deleteTempFiles(files: string[], callback: Function): any;
export declare function isError(error: Error): error is NodeJS.ErrnoException;
