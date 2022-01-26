

export interface Func4WithError {
    (err: Error|null, code?: number|string, stdout?: string|NodeJS.ArrayBufferView, stderr?: string|NodeJS.ArrayBufferView): void;
}
