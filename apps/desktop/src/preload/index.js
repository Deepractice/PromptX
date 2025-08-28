"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
// 暴露安全的API到渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getGroupedResources: function () { return electron_1.ipcRenderer.invoke('resources:getGrouped'); },
    searchResources: function (query) { return electron_1.ipcRenderer.invoke('resources:search', query); },
    getStatistics: function () { return electron_1.ipcRenderer.invoke('resources:getStatistics'); },
    activateRole: function (roleId) { return electron_1.ipcRenderer.invoke('resources:activateRole', roleId); },
    executeTool: function (toolId, parameters) { return electron_1.ipcRenderer.invoke('resources:executeTool', toolId, parameters); },
    log: function (level, message, args) { return electron_1.ipcRenderer.send('log', level, message, args); }
});
