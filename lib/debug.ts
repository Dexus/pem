function debug (title: string, content: unknown): void {
  if (process.env.DEBUG === 'true') {
    console.log(`::group::${title}`)
    console.log(JSON.stringify(content, null, 3))
    console.log('::endgroup::')
  }
}

export = {
  debug: debug
}
