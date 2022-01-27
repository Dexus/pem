import type { Code, ErrNull, StdOutErr } from './types';
export interface CallbackErrCodeStdoutSdrerr {
    (err: ErrNull, code?: Code, stdout?: StdOutErr, stderr?: StdOutErr): void;
}
export interface CallbackErrStdout {
    (err: ErrNull, stdout?: StdOutErr): void;
}
export interface CallbackErr {
    (err: ErrNull): void;
}
//# sourceMappingURL=interfaces.d.ts.map