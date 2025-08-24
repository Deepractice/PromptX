import { contextBridge } from 'electron'

// Expose protected methods that allow the renderer process
// to use selected Node.js and Electron APIs
contextBridge.exposeInMainWorld('electronAPI', {
  // Currently no APIs needed for tray-only app
  // This will be expanded when we add windows
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})