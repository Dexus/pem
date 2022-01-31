export const name: string = "debug"

/**
 * @param {string} title Debug headline
 * @param {*} content Debug content
 */
export function debug(title: string, content: any) {
  if (process.env.CI === "true") {
    console.info(`::group::${title}`)
    console.debug(JSON.stringify(content, null, 3))
    console.info("::endgroup::")
  }
}
