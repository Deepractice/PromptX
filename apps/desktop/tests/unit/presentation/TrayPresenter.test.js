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
var vitest_1 = require("vitest");
var TrayPresenter_js_1 = require("../../../src/presentation/tray/TrayPresenter.js");
var ServerStatus_js_1 = require("../../../src/domain/valueObjects/ServerStatus.js");
var Result_js_1 = require("../../../src/shared/Result.js");
// Mock Electron
vitest_1.vi.mock('electron', function () { return ({
    app: {
        getPath: vitest_1.vi.fn(function () { return '/mock/path'; }),
        getVersion: vitest_1.vi.fn(function () { return '0.1.0'; }),
        quit: vitest_1.vi.fn()
    },
    Tray: vitest_1.vi.fn().mockImplementation(function () { return ({
        setContextMenu: vitest_1.vi.fn(),
        setToolTip: vitest_1.vi.fn(),
        setImage: vitest_1.vi.fn(),
        destroy: vitest_1.vi.fn(),
        isDestroyed: vitest_1.vi.fn(function () { return false; })
    }); }),
    Menu: {
        buildFromTemplate: vitest_1.vi.fn(function () { return ({}); })
    },
    nativeImage: {
        createFromPath: vitest_1.vi.fn(function () { return ({}); })
    },
    clipboard: {
        writeText: vitest_1.vi.fn()
    },
    shell: {
        openExternal: vitest_1.vi.fn()
    },
    BrowserWindow: vitest_1.vi.fn().mockImplementation(function () { return ({
        loadURL: vitest_1.vi.fn(),
        on: vitest_1.vi.fn(),
        close: vitest_1.vi.fn(),
        destroy: vitest_1.vi.fn(),
        focus: vitest_1.vi.fn(),
        isDestroyed: vitest_1.vi.fn(function () { return false; })
    }); }),
    Notification: vitest_1.vi.fn().mockImplementation(function () { return ({
        show: vitest_1.vi.fn(),
        close: vitest_1.vi.fn()
    }); })
}); });
(0, vitest_1.describe)('TrayPresenter', function () {
    var presenter;
    var startServerUseCase;
    var stopServerUseCase;
    var serverPort;
    var mockTray;
    (0, vitest_1.beforeEach)(function () {
        // Reset modules to ensure clean state
        vitest_1.vi.resetModules();
        // Create mock use cases
        startServerUseCase = {
            execute: vitest_1.vi.fn(),
            executeWithCustomConfig: vitest_1.vi.fn()
        };
        stopServerUseCase = {
            execute: vitest_1.vi.fn()
        };
        serverPort = {
            start: vitest_1.vi.fn(),
            stop: vitest_1.vi.fn(),
            restart: vitest_1.vi.fn(),
            getStatus: vitest_1.vi.fn(),
            getAddress: vitest_1.vi.fn(),
            getMetrics: vitest_1.vi.fn(),
            updateConfig: vitest_1.vi.fn(),
            onStatusChange: vitest_1.vi.fn(),
            removeStatusListener: vitest_1.vi.fn()
        };
        presenter = new TrayPresenter_js_1.TrayPresenter(startServerUseCase, stopServerUseCase, serverPort);
        // Get reference to mock tray
        mockTray = presenter['tray'];
    });
    (0, vitest_1.afterEach)(function () {
        presenter.destroy();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('initialization', function () {
        (0, vitest_1.it)('should create tray with correct icon', function () {
            (0, vitest_1.expect)(mockTray).toBeDefined();
            (0, vitest_1.expect)(mockTray.setToolTip).toHaveBeenCalledWith('PromptX Desktop');
        });
        (0, vitest_1.it)('should register status change listener', function () {
            (0, vitest_1.expect)(serverPort.onStatusChange).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should build initial menu', function () {
            (0, vitest_1.expect)(mockTray.setContextMenu).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('menu actions', function () {
        (0, vitest_1.it)('should start server when clicking start', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STOPPED));
                        vitest_1.vi.mocked(startServerUseCase.execute).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, presenter.handleToggleServer()];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(startServerUseCase.execute).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should stop server when clicking stop', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.RUNNING));
                        vitest_1.vi.mocked(stopServerUseCase.execute).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, presenter.handleToggleServer()];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(stopServerUseCase.execute).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should copy server address to clipboard', function () { return __awaiter(void 0, void 0, void 0, function () {
            var clipboard;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('electron'); })];
                    case 1:
                        clipboard = (_a.sent()).clipboard;
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, presenter.handleCopyAddress()];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should open logs window', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, presenter.handleShowLogs()
                        // Should create or show logs window
                    ];
                    case 1:
                        _a.sent();
                        // Should create or show logs window
                        (0, vitest_1.expect)(presenter['logsWindow']).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should quit application', function () {
            var app = require('electron').app;
            presenter.handleQuit();
            (0, vitest_1.expect)(app.quit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('status updates', function () {
        (0, vitest_1.it)('should update icon when status changes to running', function () {
            presenter.updateStatus(ServerStatus_js_1.ServerStatus.RUNNING);
            (0, vitest_1.expect)(mockTray.setImage).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTray.setToolTip).toHaveBeenCalledWith('PromptX Desktop - Running');
        });
        (0, vitest_1.it)('should update icon when status changes to stopped', function () {
            presenter.updateStatus(ServerStatus_js_1.ServerStatus.STOPPED);
            (0, vitest_1.expect)(mockTray.setImage).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTray.setToolTip).toHaveBeenCalledWith('PromptX Desktop - Stopped');
        });
        (0, vitest_1.it)('should update icon when status changes to error', function () {
            presenter.updateStatus(ServerStatus_js_1.ServerStatus.ERROR);
            (0, vitest_1.expect)(mockTray.setImage).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTray.setToolTip).toHaveBeenCalledWith('PromptX Desktop - Error');
        });
        (0, vitest_1.it)('should rebuild menu when status changes', function () {
            var initialCallCount = mockTray.setContextMenu.mock.calls.length;
            presenter.updateStatus(ServerStatus_js_1.ServerStatus.RUNNING);
            (0, vitest_1.expect)(mockTray.setContextMenu).toHaveBeenCalledTimes(initialCallCount + 1);
        });
    });
    (0, vitest_1.describe)('menu structure', function () {
        (0, vitest_1.it)('should show "Start Server" when stopped', function () { return __awaiter(void 0, void 0, void 0, function () {
            var menu, toggleItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STOPPED));
                        return [4 /*yield*/, presenter.buildMenu()];
                    case 1:
                        menu = _a.sent();
                        toggleItem = menu.find(function (item) { return item.id === 'toggle'; });
                        (0, vitest_1.expect)(toggleItem === null || toggleItem === void 0 ? void 0 : toggleItem.label).toBe('Start Server');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should show "Stop Server" when running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var menu, toggleItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.RUNNING));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, presenter.buildMenu()];
                    case 1:
                        menu = _a.sent();
                        toggleItem = menu.find(function (item) { return item.id === 'toggle'; });
                        (0, vitest_1.expect)(toggleItem === null || toggleItem === void 0 ? void 0 : toggleItem.label).toBe('Stop Server');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should disable toggle during starting', function () { return __awaiter(void 0, void 0, void 0, function () {
            var menu, toggleItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STARTING));
                        return [4 /*yield*/, presenter.buildMenu()];
                    case 1:
                        menu = _a.sent();
                        toggleItem = menu.find(function (item) { return item.id === 'toggle'; });
                        (0, vitest_1.expect)(toggleItem === null || toggleItem === void 0 ? void 0 : toggleItem.enabled).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should show server address when running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var menu, addressItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.RUNNING));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, presenter.buildMenu()];
                    case 1:
                        menu = _a.sent();
                        addressItem = menu.find(function (item) { return item.id === 'address'; });
                        (0, vitest_1.expect)(addressItem === null || addressItem === void 0 ? void 0 : addressItem.label).toBe('http://localhost:3000');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should include separator items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var menu, separators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.getStatus).mockResolvedValue(Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STOPPED));
                        return [4 /*yield*/, presenter.buildMenu()];
                    case 1:
                        menu = _a.sent();
                        separators = menu.filter(function (item) { return item.type === 'separator'; });
                        (0, vitest_1.expect)(separators.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('cleanup', function () {
        (0, vitest_1.it)('should remove status listener on destroy', function () {
            presenter.destroy();
            (0, vitest_1.expect)(serverPort.removeStatusListener).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should destroy tray on cleanup', function () {
            presenter.destroy();
            (0, vitest_1.expect)(mockTray.destroy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should close logs window if open', function () {
            var _a;
            // Create a mock logs window
            presenter['logsWindow'] = {
                close: vitest_1.vi.fn(),
                destroy: vitest_1.vi.fn()
            };
            presenter.destroy();
            (0, vitest_1.expect)((_a = presenter['logsWindow']) === null || _a === void 0 ? void 0 : _a.close).toHaveBeenCalled();
        });
    });
});
