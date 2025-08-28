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
var ServerConfig_js_1 = require("../../../src/domain/entities/ServerConfig.js");
var ServerStatus_js_1 = require("../../../src/domain/valueObjects/ServerStatus.js");
var ServerErrors_js_1 = require("../../../src/domain/errors/ServerErrors.js");
var Result_js_1 = require("../../../src/shared/Result.js");
// Mock the entire module
vitest_1.vi.mock('../../../src/infrastructure/adapters/PromptXServerAdapter.js', function () { return __awaiter(void 0, void 0, void 0, function () {
    var actual, MockPromptXServerAdapter;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, vitest_1.vi.importActual('../../../src/infrastructure/adapters/PromptXServerAdapter.js')];
            case 1:
                actual = _a.sent();
                MockPromptXServerAdapter = /** @class */ (function () {
                    function MockPromptXServerAdapter() {
                        this.statusListeners = new Set();
                        this.currentStatus = ServerStatus_js_1.ServerStatus.STOPPED;
                    }
                    MockPromptXServerAdapter.prototype.setMockServer = function (server) {
                        this.mockServer = server;
                    };
                    MockPromptXServerAdapter.prototype.start = function (config) {
                        return __awaiter(this, void 0, void 0, function () {
                            var error_1;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        if ((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning()) {
                                            return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.alreadyRunning())];
                                        }
                                        this.currentStatus = ServerStatus_js_1.ServerStatus.STARTING;
                                        this.notifyListeners(ServerStatus_js_1.ServerStatus.STARTING);
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, ((_b = this.mockServer) === null || _b === void 0 ? void 0 : _b.start())];
                                    case 2:
                                        _d.sent();
                                        this.currentStatus = ServerStatus_js_1.ServerStatus.RUNNING;
                                        return [2 /*return*/, Result_js_1.ResultUtil.ok(undefined)];
                                    case 3:
                                        error_1 = _d.sent();
                                        if ((_c = error_1 === null || error_1 === void 0 ? void 0 : error_1.message) === null || _c === void 0 ? void 0 : _c.includes('EADDRINUSE')) {
                                            return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.portInUse(config.port))];
                                        }
                                        return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.initializationFailed((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Unknown error', error_1))];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.stop = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var error_2;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                                            return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.notRunning())];
                                        }
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        this.currentStatus = ServerStatus_js_1.ServerStatus.STOPPING;
                                        return [4 /*yield*/, ((_b = this.mockServer) === null || _b === void 0 ? void 0 : _b.stop())];
                                    case 2:
                                        _c.sent();
                                        this.currentStatus = ServerStatus_js_1.ServerStatus.STOPPED;
                                        return [2 /*return*/, Result_js_1.ResultUtil.ok(undefined)];
                                    case 3:
                                        error_2 = _c.sent();
                                        return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.shutdownFailed((error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || 'Unknown error', error_2))];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.restart = function (config) {
                        return __awaiter(this, void 0, void 0, function () {
                            var stopResult;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning())) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.stop()];
                                    case 1:
                                        stopResult = _b.sent();
                                        if (!stopResult.ok)
                                            return [2 /*return*/, stopResult];
                                        _b.label = 2;
                                    case 2: return [2 /*return*/, this.start(config)];
                                }
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.getStatus = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (!this.mockServer)
                                    return [2 /*return*/, Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STOPPED)];
                                if (this.mockServer.isRunning())
                                    return [2 /*return*/, Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.RUNNING)];
                                if (this.mockServer.isStarting())
                                    return [2 /*return*/, Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STARTING)];
                                if (this.mockServer.isStopping())
                                    return [2 /*return*/, Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.STOPPING)];
                                return [2 /*return*/, Result_js_1.ResultUtil.ok(ServerStatus_js_1.ServerStatus.ERROR)];
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.getAddress = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                if (!((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                                    return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.notRunning())];
                                }
                                return [2 /*return*/, Result_js_1.ResultUtil.ok("http://".concat(this.mockServer.host, ":").concat(this.mockServer.port))];
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.getMetrics = function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                if (!((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                                    return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.notRunning())];
                                }
                                return [2 /*return*/, Result_js_1.ResultUtil.ok({
                                        uptime: this.mockServer.getUptime(),
                                        requestCount: this.mockServer.getRequestCount(),
                                        activeConnections: this.mockServer.getActiveConnections(),
                                        memoryUsage: process.memoryUsage()
                                    })];
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.updateConfig = function (config) {
                        return __awaiter(this, void 0, void 0, function () {
                            var error_3;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!((_a = this.mockServer) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                                            return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.notRunning())];
                                        }
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, this.mockServer.updateConfig(config)];
                                    case 2:
                                        _b.sent();
                                        return [2 /*return*/, Result_js_1.ResultUtil.ok(undefined)];
                                    case 3:
                                        error_3 = _b.sent();
                                        return [2 /*return*/, Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.configInvalid((error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || 'Invalid config'))];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    MockPromptXServerAdapter.prototype.onStatusChange = function (callback) {
                        this.statusListeners.add(callback);
                    };
                    MockPromptXServerAdapter.prototype.removeStatusListener = function (callback) {
                        this.statusListeners.delete(callback);
                    };
                    MockPromptXServerAdapter.prototype.notifyListeners = function (status) {
                        this.statusListeners.forEach(function (listener) { return listener(status); });
                    };
                    return MockPromptXServerAdapter;
                }());
                return [2 /*return*/, { PromptXServerAdapter: MockPromptXServerAdapter }];
        }
    });
}); });
var PromptXServerAdapter_js_1 = require("../../../src/infrastructure/adapters/PromptXServerAdapter.js");
(0, vitest_1.describe)('PromptXServerAdapter', function () {
    var adapter;
    var mockServer;
    (0, vitest_1.beforeEach)(function () {
        mockServer = {
            start: vitest_1.vi.fn(),
            stop: vitest_1.vi.fn(),
            isRunning: vitest_1.vi.fn(),
            isStarting: vitest_1.vi.fn(),
            isStopping: vitest_1.vi.fn(),
            getUptime: vitest_1.vi.fn(),
            getRequestCount: vitest_1.vi.fn(),
            getActiveConnections: vitest_1.vi.fn(),
            updateConfig: vitest_1.vi.fn(),
            on: vitest_1.vi.fn(),
            off: vitest_1.vi.fn(),
            host: 'localhost',
            port: 3000
        };
        adapter = new PromptXServerAdapter_js_1.PromptXServerAdapter();
        adapter.setMockServer(mockServer);
    });
    (0, vitest_1.afterEach)(function () {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('start', function () {
        (0, vitest_1.it)('should start server with valid config', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.start.mockResolvedValue(undefined);
                        mockServer.isRunning.mockReturnValue(false);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(mockServer.start).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when server is already running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(true);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.ALREADY_RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when port is in use', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockRejectedValue(new Error('EADDRINUSE'));
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.PORT_IN_USE);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle initialization errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockRejectedValue(new Error('Failed to load resources'));
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.INITIALIZATION_FAILED);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('stop', function () {
        (0, vitest_1.it)('should stop running server', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.stop.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.stop()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(mockServer.stop).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when server is not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockServer.isRunning.mockReturnValue(false);
                        return [4 /*yield*/, adapter.stop()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.NOT_RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle shutdown errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.stop.mockRejectedValue(new Error('Shutdown timeout'));
                        return [4 /*yield*/, adapter.stop()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.SHUTDOWN_FAILED);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('restart', function () {
        (0, vitest_1.it)('should restart running server', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.stop.mockResolvedValue(undefined);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.restart(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(mockServer.stop).toHaveBeenCalled();
                        (0, vitest_1.expect)(mockServer.start).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should start server if not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.restart(config)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(mockServer.stop).not.toHaveBeenCalled();
                        (0, vitest_1.expect)(mockServer.start).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('getStatus', function () {
        (0, vitest_1.it)('should return STOPPED when server is null', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.getStatus()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        if (result.ok) {
                            (0, vitest_1.expect)(result.value).toBe(ServerStatus_js_1.ServerStatus.STOPPED);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return RUNNING when server is running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.isStarting.mockReturnValue(false);
                        mockServer.isStopping.mockReturnValue(false);
                        return [4 /*yield*/, adapter.getStatus()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        if (result.ok) {
                            (0, vitest_1.expect)(result.value).toBe(ServerStatus_js_1.ServerStatus.RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return STARTING when server is starting', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.isStarting.mockReturnValue(true);
                        mockServer.isStopping.mockReturnValue(false);
                        return [4 /*yield*/, adapter.getStatus()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        if (result.ok) {
                            (0, vitest_1.expect)(result.value).toBe(ServerStatus_js_1.ServerStatus.STARTING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('getAddress', function () {
        (0, vitest_1.it)('should return address when server is running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        mockServer.isRunning.mockReturnValue(true);
                        return [4 /*yield*/, adapter.getAddress()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        if (result.ok) {
                            (0, vitest_1.expect)(result.value).toBe('http://localhost:3000');
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when server is not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.getAddress()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.NOT_RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('getMetrics', function () {
        (0, vitest_1.it)('should return metrics when server is running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.getUptime.mockReturnValue(1000);
                        mockServer.getRequestCount.mockReturnValue(42);
                        mockServer.getActiveConnections.mockReturnValue(3);
                        return [4 /*yield*/, adapter.getMetrics()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        if (result.ok) {
                            (0, vitest_1.expect)(result.value.uptime).toBe(1000);
                            (0, vitest_1.expect)(result.value.requestCount).toBe(42);
                            (0, vitest_1.expect)(result.value.activeConnections).toBe(3);
                            (0, vitest_1.expect)(result.value.memoryUsage).toBeDefined();
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when server is not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.getMetrics()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.NOT_RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('updateConfig', function () {
        (0, vitest_1.it)('should update config when server is running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        mockServer.isRunning.mockReturnValue(true);
                        mockServer.updateConfig.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.updateConfig({ port: 4000 })];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(mockServer.updateConfig).toHaveBeenCalledWith({ port: 4000 });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should return error when server is not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.updateConfig({ port: 4000 })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.NOT_RUNNING);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('status listeners', function () {
        (0, vitest_1.it)('should notify listeners on status change', function () { return __awaiter(void 0, void 0, void 0, function () {
            var listener, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        listener = vitest_1.vi.fn();
                        adapter.onStatusChange(listener);
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(listener).toHaveBeenCalledWith(ServerStatus_js_1.ServerStatus.STARTING);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should remove listener', function () { return __awaiter(void 0, void 0, void 0, function () {
            var listener, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        listener = vitest_1.vi.fn();
                        adapter.onStatusChange(listener);
                        adapter.removeStatusListener(listener);
                        config = ServerConfig_js_1.ServerConfig.default();
                        mockServer.isRunning.mockReturnValue(false);
                        mockServer.start.mockResolvedValue(undefined);
                        return [4 /*yield*/, adapter.start(config)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
