/* eslint-disable require-await */
/*
 * File: index.ts
 * Project: @xyo-network/app
 * File Created: Tuesday, 16th April 2019 9:19:05 am
 * Author: XYO Development Team (support@xyo.network)
 * -----
 * Last Modified: Friday, 13th November 2020 5:51:28 pm
 * Modified By: XYO Development Team (support@xyo.network>)
 * -----
 * Copyright 2017 - 2019 XY - The Persistent Company
 */

import { XyoBase } from '@xyo-network/sdk-base-js'
import { IXyoPluginWithConfig } from '@xyo-network/sdk-base-nodejs'
import { Command } from 'commander'
import fs from 'fs'
import http from 'http'
import https from 'https'
import os from 'os'
import { Transform } from 'stream'

import { XyoGraphQlEndpoint } from './graphql/graohql-delegate'
import { XyoMutexHandler } from './mutex'
import { XyoPackageManager } from './package-manager'
import { PluginResolver } from './plugin-resolver'

const configPath = `${os.homedir()}/.config/xyo`
const configName = 'xyo.json'
const defaultConfigPath = `${configPath}/${configName}`

const defaultPlugins: IXyoPluginWithConfig[] = [
  {
    config: {
      ip: 'localhost',
      name: 'unknown',
    },
    plugin: require('./plugins/base-graphql-types'),
  },
  {
    config: {},
    plugin: require('./plugins/origin-state'),
  },
]

const run = async (manager: XyoPackageManager) => {
  const config = await manager.getConfig()
  defaultPlugins[0].config.name = (config as any).name || 'unknown'
  const delegate = new XyoGraphQlEndpoint(config)
  const mutex = new XyoMutexHandler()
  const resolver = new PluginResolver(delegate, mutex)
  const plugins = (await manager.resolve()).concat(defaultPlugins)
  await resolver.resolve(plugins)
  const server = delegate.start(config.port)
  server.start()
  return
}

export class App extends XyoBase {
  public program: Command = new Command()
  public async main() {
    this.program.option('-i, --install', 'installs the plugins')
    this.program.option('-r, --run', 'runs node')
    this.program.option('-f, --fetch <string>', 'fetch from url')
    this.program.parse(process.argv)

    const manager = new XyoPackageManager(this.program.config || defaultConfigPath)

    await manager.makeConfigIfNotExist()

    this.log.info(`Using config at path: ${this.program.config || defaultConfigPath}`)

    if (this.program.install) {
      manager.install()
      return
    }

    if (this.program.run) {
      return await run(manager)
    }

    if (this.program.fetch) {
      this.fetch()
      return
    }

    this.program.outputHelp()
  }

  private async fetch() {
    console.log(`Downloading... ${this.program.fetch}`)
    const url = this.program.fetch as string

    const handler = (response: any) => {
      const data = new Transform()

      response.on('data', (chunk: any) => {
        data.push(chunk)
      })

      response.on('end', () => {
        fs.writeFileSync(this.program.config || defaultConfigPath, data.read())
        this.log.info(`Saved to ${this.program.config || defaultConfigPath}`)
      })
    }

    if (url.split(':')[0] === 'http') {
      http.request(url, handler).end()
      return
    }

    if (url.split(':')[0] === 'https') {
      https.request(url, handler).end()
    }
  }
}
