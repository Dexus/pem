export const name: string = "debug"
export function debug(title: string, content: any) {
    if (process.env.CI === 'true') {
        console.info(`::group::${title}`)
        console.debug(JSON.stringify(content, null, 3));
        console.info('::endgroup::')
    }
}
