import type {Code, StdOutErr} from "./types"

export interface NodeCallback<T1, T2, T3> {
  (err: any, code?: T1 | undefined | null, stdout?: T2 | undefined | null, stderr?: T3 | undefined | null): void;

  (err: any, stdout?: StdOutErr | undefined | null): void;

  (err: undefined | null, result: T1): void;
}

export interface CallbackErrCodeStdoutStderr {
  (err: any, code?: Code, stdout?: StdOutErr, stderr?: StdOutErr): void;
}

export interface CallbackErrStdout {
  (err: any, stdout?: StdOutErr): void;
}

/**
 * Callback for return an error object.
 *
 * @callback CallbackError
 * @param {Error} err - An Error Object or null
 */

export interface CallbackError {
  (err: any): void;
}
