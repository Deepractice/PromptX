export * from './types'
export * from './StateMachine'
export * from './ElectronUpdater'

import { ElectronUpdater } from './ElectronUpdater'
import { UpdaterOptions } from './types'

let updaterInstance: ElectronUpdater | null = null

export function createUpdater(options?: UpdaterOptions): ElectronUpdater {
  if (updaterInstance) {
    updaterInstance.destroy()
  }
  updaterInstance = new ElectronUpdater(options)
  return updaterInstance
}

export function getUpdater(): ElectronUpdater | null {
  return updaterInstance
}