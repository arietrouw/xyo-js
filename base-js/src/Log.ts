class Log {
  private prefix: string

  constructor(tag?: string) {
    this.prefix = tag ? `${tag}: ` : ''
  }

  public info(msg: string) {
    console.log(`${this.prefix}${msg}`)
  }

  public error(msg: string) {
    console.error(`${this.prefix}${msg}`)
  }

  public verbose(msg: string) {
    console.log(`${this.prefix}${msg}`)
  }

  public debug(msg: string) {
    console.debug(`${this.prefix}${msg}`)
  }

  public warn(msg: string) {
    console.warn(`${this.prefix}${msg}`)
  }

  static cache: Record<string, Log> = {}

  static get(tag = '') {
    if (!this.cache[tag]) {
      this.cache[tag] = new Log(tag)
    }
    return this.cache[tag]
  }
}

export default Log
