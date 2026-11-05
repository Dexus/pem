declare module 'which' {
  export function sync (path: string, options?: { nothrow?: boolean }): string | null | undefined
}
