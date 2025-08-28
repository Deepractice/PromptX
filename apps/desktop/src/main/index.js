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
// Import polyfills first, before any other modules
require("~/main/polyfills");
var electron_1 = require("electron");
var TrayPresenter_1 = require("~/main/tray/TrayPresenter");
var ResourceManager_1 = require("~/main/ResourceManager");
var PromptXServerAdapter_1 = require("~/main/infrastructure/adapters/PromptXServerAdapter");
var FileConfigAdapter_1 = require("~/main/infrastructure/adapters/FileConfigAdapter");
var ElectronNotificationAdapter_1 = require("~/main/infrastructure/adapters/ElectronNotificationAdapter");
var StartServerUseCase_1 = require("~/main/application/useCases/StartServerUseCase");
var StopServerUseCase_1 = require("~/main/application/useCases/StopServerUseCase");
var logger_1 = require("~/shared/logger");
var path = require("node:path");
var PromptXDesktopApp = /** @class */ (function () {
    function PromptXDesktopApp() {
        this.trayPresenter = null;
        this.resourceManager = null;
        this.serverPort = null;
        this.configPort = null;
        this.notificationPort = null;
    }
    PromptXDesktopApp.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, startUseCase, stopUseCase, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_1.logger.info('Initializing PromptX Desktop...');
                        // Setup renderer logging - properly format and write to file
                        electron_1.ipcMain.on('log', function (event, level, message, args) {
                            // Format the message with args properly
                            var formattedArgs = args && args.length > 0
                                ? (args.length === 1 && typeof args[0] === 'object'
                                    ? JSON.stringify(args[0], null, 2)
                                    : args.join(' '))
                                : '';
                            var logMessage = "[Renderer] ".concat(message).concat(formattedArgs ? ' ' + formattedArgs : '');
                            // Use the appropriate logger method to ensure file output
                            switch (level) {
                                case 'error':
                                    logger_1.logger.error(logMessage);
                                    break;
                                case 'warn':
                                    logger_1.logger.warn(logMessage);
                                    break;
                                case 'info':
                                    logger_1.logger.info(logMessage);
                                    break;
                                case 'debug':
                                    logger_1.logger.debug(logMessage);
                                    break;
                                default:
                                    logger_1.logger.log(logMessage);
                            }
                        });
                        // Wait for app to be ready
                        return [4 /*yield*/, electron_1.app.whenReady()];
                    case 1:
                        // Wait for app to be ready
                        _b.sent();
                        logger_1.logger.success('Electron app ready');
                        // Hide dock icon on macOS
                        if (process.platform === 'darwin') {
                            electron_1.app.dock.hide();
                            logger_1.logger.info('Dock icon hidden (macOS)');
                        }
                        // Setup infrastructure
                        logger_1.logger.step('Setting up infrastructure...');
                        this.setupInfrastructure();
                        // Setup application layer
                        logger_1.logger.step('Setting up application layer...');
                        _a = this.setupApplication(), startUseCase = _a.startUseCase, stopUseCase = _a.stopUseCase;
                        // Setup presentation layer
                        logger_1.logger.step('Setting up presentation layer...');
                        this.setupPresentation(startUseCase, stopUseCase);
                        // Setup ResourceManager for roles and tools
                        logger_1.logger.step('Setting up resource manager...');
                        this.resourceManager = new ResourceManager_1.ResourceManager();
                        logger_1.logger.success('Resource manager initialized');
                        // Handle app events
                        logger_1.logger.step('Setting up app events...');
                        this.setupAppEvents();
                        logger_1.logger.success('PromptX Desktop initialized successfully');
                        // Auto-start server on app launch
                        logger_1.logger.info('Auto-starting PromptX server...');
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, startUseCase.execute()];
                    case 3:
                        _b.sent();
                        logger_1.logger.success('PromptX server started automatically');
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        logger_1.logger.error('Failed to auto-start server:', error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PromptXDesktopApp.prototype.setupInfrastructure = function () {
        // Create adapters
        this.serverPort = new PromptXServerAdapter_1.PromptXServerAdapter();
        this.configPort = new FileConfigAdapter_1.FileConfigAdapter(path.join(electron_1.app.getPath('userData'), 'config.json'));
        this.notificationPort = new ElectronNotificationAdapter_1.ElectronNotificationAdapter();
    };
    PromptXDesktopApp.prototype.setupApplication = function () {
        if (!this.serverPort || !this.configPort || !this.notificationPort) {
            throw new Error('Infrastructure not initialized');
        }
        var startUseCase = new StartServerUseCase_1.StartServerUseCase(this.serverPort, this.configPort, this.notificationPort);
        var stopUseCase = new StopServerUseCase_1.StopServerUseCase(this.serverPort, this.notificationPort);
        return { startUseCase: startUseCase, stopUseCase: stopUseCase };
    };
    PromptXDesktopApp.prototype.setupPresentation = function (startUseCase, stopUseCase) {
        if (!this.serverPort) {
            throw new Error('Server port not initialized');
        }
        this.trayPresenter = new TrayPresenter_1.TrayPresenter(startUseCase, stopUseCase, this.serverPort);
    };
    PromptXDesktopApp.prototype.setupAppEvents = function () {
        var _this = this;
        // Prevent app from quitting when all windows are closed
        electron_1.app.on('window-all-closed', function () {
            // On macOS, keep app running in background
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
            // On macOS, do nothing - app stays in menu bar
        });
        // Handle app quit - use synchronous cleanup
        var isQuitting = false;
        electron_1.app.on('before-quit', function (event) {
            if (!isQuitting) {
                event.preventDefault();
                isQuitting = true;
                // Perform cleanup
                _this.performCleanup().then(function () {
                    logger_1.logger.info('Cleanup completed, exiting...');
                    electron_1.app.exit(0);
                }).catch(function (error) {
                    logger_1.logger.error('Error during cleanup:', error);
                    electron_1.app.exit(0);
                });
            }
        });
        // Handle activation (macOS)
        electron_1.app.on('activate', function () {
            // Show tray menu if needed
        });
    };
    PromptXDesktopApp.prototype.performCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var statusResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.serverPort) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.serverPort.getStatus()];
                    case 1:
                        statusResult = _a.sent();
                        if (!(statusResult.ok && statusResult.value === 'running')) return [3 /*break*/, 3];
                        logger_1.logger.info('Stopping server before quit...');
                        return [4 /*yield*/, this.serverPort.stop()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error stopping server:', error_2);
                        return [3 /*break*/, 5];
                    case 5:
                        // Cleanup UI components
                        this.cleanup();
                        return [2 /*return*/];
                }
            });
        });
    };
    PromptXDesktopApp.prototype.cleanup = function () {
        if (this.trayPresenter) {
            this.trayPresenter.destroy();
            this.trayPresenter = null;
        }
    };
    return PromptXDesktopApp;
}());
// Global error handlers for uncaught exceptions and rejections
process.on('uncaughtException', function (error) {
    var _a, _b;
    // Ignore EPIPE errors globally
    if (error.message && error.message.includes('EPIPE')) {
        logger_1.logger.debug('Ignoring EPIPE error:', error.message);
        return;
    }
    // Log other errors but don't crash
    logger_1.logger.error('Uncaught exception:', error);
    // For critical errors, show dialog
    if (!((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('write')) && !((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('stream'))) {
        electron_1.dialog.showErrorBox('Unexpected Error', error.message);
        electron_1.app.quit();
    }
});
process.on('unhandledRejection', function (reason, promise) {
    // Ignore EPIPE errors
    if ((reason === null || reason === void 0 ? void 0 : reason.message) && reason.message.includes('EPIPE')) {
        logger_1.logger.debug('Ignoring unhandled EPIPE rejection:', reason.message);
        return;
    }
    logger_1.logger.error('Unhandled promise rejection:', reason);
});
// Handle write stream errors specifically
process.stdout.on('error', function (error) {
    if (error.code === 'EPIPE') {
        // Ignore EPIPE on stdout
        return;
    }
    logger_1.logger.error('stdout error:', error);
});
process.stderr.on('error', function (error) {
    if (error.code === 'EPIPE') {
        // Ignore EPIPE on stderr
        return;
    }
    logger_1.logger.error('stderr error:', error);
});
// Application entry point
var application = new PromptXDesktopApp();
application.initialize().catch(function (error) {
    logger_1.logger.error('Failed to initialize application:', error);
    electron_1.app.quit();
});
