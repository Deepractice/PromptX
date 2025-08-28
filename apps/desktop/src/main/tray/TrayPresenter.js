"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrayPresenter = void 0;
var electron_1 = require("electron");
var ServerStatus_1 = require("~/main/domain/valueObjects/ServerStatus");
var path = require("node:path");
var logger_1 = require("~/shared/logger");
var createPIcon_1 = require("~/utils/createPIcon");
var ResourceManager_1 = require("~/main/ResourceManager");
var TrayPresenter = /** @class */ (function () {
    function TrayPresenter(startServerUseCase, stopServerUseCase, serverPort) {
        var _this = this;
        this.startServerUseCase = startServerUseCase;
        this.stopServerUseCase = stopServerUseCase;
        this.serverPort = serverPort;
        this.currentStatus = ServerStatus_1.ServerStatus.STOPPED;
        this.logsWindow = null;
        // Initialize resource manager
        this.resourceManager = new ResourceManager_1.ResourceManager();
        // Create tray icon
        this.tray = this.createTray();
        // Setup status listener
        this.statusListener = function (status) { return _this.updateStatus(status); };
        this.serverPort.onStatusChange(this.statusListener);
        // Initialize menu
        this.initializeMenu();
    }
    TrayPresenter.prototype.createTray = function () {
        logger_1.logger.debug('Creating tray icon...');
        // Create P icon programmatically
        logger_1.logger.info('Creating P icon for tray');
        var icon = (0, createPIcon_1.createPIcon)();
        var tray = new electron_1.Tray(icon);
        tray.setToolTip('PromptX Desktop');
        logger_1.logger.success('Tray created with P icon');
        return tray;
    };
    TrayPresenter.prototype.getIconPath = function (status) {
        // TODO: Add actual icon paths
        var iconName = this.getIconName(status);
        return path.join(__dirname, '..', '..', '..', 'assets', 'icons', iconName);
    };
    TrayPresenter.prototype.getIconName = function (status) {
        switch (status) {
            case ServerStatus_1.ServerStatus.RUNNING:
                return 'tray-running.png';
            case ServerStatus_1.ServerStatus.STOPPED:
                return 'tray-stopped.png';
            case ServerStatus_1.ServerStatus.STARTING:
            case ServerStatus_1.ServerStatus.STOPPING:
                return 'tray-loading.png';
            case ServerStatus_1.ServerStatus.ERROR:
                return 'tray-error.png';
            default:
                return 'tray-default.png';
        }
    };
    TrayPresenter.prototype.initializeMenu = function () {
        return __awaiter(this, void 0, void 0, function () {
            var menuItems, menu;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.buildMenu()];
                    case 1:
                        menuItems = _a.sent();
                        menu = electron_1.Menu.buildFromTemplate(menuItems);
                        this.tray.setContextMenu(menu);
                        return [2 /*return*/];
                }
            });
        });
    };
    TrayPresenter.prototype.buildMenu = function () {
        return __awaiter(this, void 0, void 0, function () {
            var statusResult, status, menuItems, addressResult;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.serverPort.getStatus()];
                    case 1:
                        statusResult = _a.sent();
                        status = statusResult.ok ? statusResult.value : ServerStatus_1.ServerStatus.ERROR;
                        menuItems = [];
                        if (!(status === ServerStatus_1.ServerStatus.RUNNING)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.serverPort.getAddress()];
                    case 2:
                        addressResult = _a.sent();
                        if (addressResult.ok) {
                            menuItems.push({
                                id: 'address',
                                label: addressResult.value,
                                enabled: false
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        menuItems.push({
                            id: 'status',
                            label: "Status: ".concat(this.getStatusLabel(status)),
                            enabled: false
                        });
                        _a.label = 4;
                    case 4:
                        menuItems.push({ type: 'separator' });
                        // Toggle server
                        menuItems.push({
                            id: 'toggle',
                            label: this.getToggleLabel(status),
                            enabled: this.canToggle(status),
                            click: function () { return _this.handleToggleServer(); }
                        });
                        // Copy address (only when running)
                        if (status === ServerStatus_1.ServerStatus.RUNNING) {
                            menuItems.push({
                                id: 'copy',
                                label: 'Copy Server Address',
                                click: function () { return _this.handleCopyAddress(); }
                            });
                        }
                        menuItems.push({ type: 'separator' });
                        // Resource management (roles and tools)
                        menuItems.push({
                            id: 'resources',
                            label: 'Manage Resources',
                            click: function () { return _this.handleShowResources(); }
                        });
                        menuItems.push({ type: 'separator' });
                        // Show logs
                        menuItems.push({
                            id: 'logs',
                            label: 'Show Logs',
                            click: function () { return _this.handleShowLogs(); }
                        });
                        // Settings (future)
                        menuItems.push({
                            id: 'settings',
                            label: 'Settings...',
                            enabled: false // TODO: Implement settings window
                        });
                        menuItems.push({ type: 'separator' });
                        // Quit
                        menuItems.push({
                            id: 'quit',
                            label: 'Quit PromptX',
                            click: function () { return _this.handleQuit(); }
                        });
                        return [2 /*return*/, menuItems];
                }
            });
        });
    };
    TrayPresenter.prototype.getStatusLabel = function (status) {
        switch (status) {
            case ServerStatus_1.ServerStatus.RUNNING:
                return 'Running';
            case ServerStatus_1.ServerStatus.STOPPED:
                return 'Stopped';
            case ServerStatus_1.ServerStatus.STARTING:
                return 'Starting...';
            case ServerStatus_1.ServerStatus.STOPPING:
                return 'Stopping...';
            case ServerStatus_1.ServerStatus.ERROR:
                return 'Error';
            default:
                return 'Unknown';
        }
    };
    TrayPresenter.prototype.getToggleLabel = function (status) {
        switch (status) {
            case ServerStatus_1.ServerStatus.RUNNING:
                return 'Stop Server';
            case ServerStatus_1.ServerStatus.STOPPED:
            case ServerStatus_1.ServerStatus.ERROR:
                return 'Start Server';
            case ServerStatus_1.ServerStatus.STARTING:
                return 'Starting...';
            case ServerStatus_1.ServerStatus.STOPPING:
                return 'Stopping...';
            default:
                return 'Toggle Server';
        }
    };
    TrayPresenter.prototype.canToggle = function (status) {
        return status === ServerStatus_1.ServerStatus.RUNNING ||
            status === ServerStatus_1.ServerStatus.STOPPED ||
            status === ServerStatus_1.ServerStatus.ERROR;
    };
    TrayPresenter.prototype.handleToggleServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var statusResult, status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.serverPort.getStatus()];
                    case 1:
                        statusResult = _a.sent();
                        if (!statusResult.ok)
                            return [2 /*return*/];
                        status = statusResult.value;
                        if (!(status === ServerStatus_1.ServerStatus.RUNNING)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.stopServerUseCase.execute()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(status === ServerStatus_1.ServerStatus.STOPPED || status === ServerStatus_1.ServerStatus.ERROR)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.startServerUseCase.execute()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    TrayPresenter.prototype.handleCopyAddress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addressResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.serverPort.getAddress()];
                    case 1:
                        addressResult = _a.sent();
                        if (addressResult.ok) {
                            electron_1.clipboard.writeText(addressResult.value);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    TrayPresenter.prototype.handleShowResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.resourceManager.showResourceList();
                return [2 /*return*/];
            });
        });
    };
    TrayPresenter.prototype.handleShowLogs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.logsWindow && !this.logsWindow.isDestroyed()) {
                    this.logsWindow.focus();
                    return [2 /*return*/];
                }
                this.logsWindow = new electron_1.BrowserWindow({
                    width: 800,
                    height: 600,
                    title: 'PromptX Logs',
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true
                    }
                });
                // TODO: Load actual logs content
                this.logsWindow.loadURL('data:text/html,<h1>Logs Window (TODO)</h1>');
                this.logsWindow.on('closed', function () {
                    _this.logsWindow = null;
                });
                return [2 /*return*/];
            });
        });
    };
    TrayPresenter.prototype.handleQuit = function () {
        electron_1.app.quit();
    };
    TrayPresenter.prototype.updateStatus = function (status) {
        this.currentStatus = status;
        // For now, keep the same icon for all statuses
        // TODO: Create different colored versions of the logo for different statuses
        // Update tooltip
        var statusLabel = this.getStatusLabel(status);
        this.tray.setToolTip("PromptX Desktop - ".concat(statusLabel));
        // Rebuild menu
        this.initializeMenu();
    };
    TrayPresenter.prototype.destroy = function () {
        // Remove status listener
        if (this.statusListener) {
            this.serverPort.removeStatusListener(this.statusListener);
        }
        // Close logs window if open
        if (this.logsWindow && !this.logsWindow.isDestroyed()) {
            this.logsWindow.close();
        }
        // Destroy resource manager
        if (this.resourceManager) {
            this.resourceManager.destroy();
        }
        // Destroy tray
        if (this.tray && !this.tray.isDestroyed()) {
            this.tray.destroy();
        }
    };
    return TrayPresenter;
}());
exports.TrayPresenter = TrayPresenter;
