"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
// Expose protected methods that allow the renderer process
// to use selected Node.js and Electron APIs
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Currently no APIs needed for tray-only app
    // This will be expanded when we add windows
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    }
});
