export declare const name: string;
import { CallbackErrCodeStdoutSdrerr, CallbackErrStdout } from './interfaces';
import type { Params, TempFiles } from './types';
export declare function set(option: string, value: any): void;
export declare function get(option?: string): any;
export declare function exec(callback: CallbackErrStdout, params: Params, searchStr: string): void;
export declare function execBinary(callback: CallbackErrStdout, params: Params): void;
export declare function spawn(callback: CallbackErrCodeStdoutSdrerr, params: Params, binary: boolean): void;
export declare function spawnWrapper(callback: CallbackErrCodeStdoutSdrerr, params: Params, tmpfiles?: TempFiles, binary?: boolean): void;
