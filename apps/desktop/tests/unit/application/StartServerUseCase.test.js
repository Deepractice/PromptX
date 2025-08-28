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
var StartServerUseCase_js_1 = require("../../../src/application/useCases/StartServerUseCase.js");
var ServerConfig_js_1 = require("../../../src/domain/entities/ServerConfig.js");
var ServerErrors_js_1 = require("../../../src/domain/errors/ServerErrors.js");
var Result_js_1 = require("../../../src/shared/Result.js");
(0, vitest_1.describe)('StartServerUseCase', function () {
    var useCase;
    var serverPort;
    var configPort;
    var notificationPort;
    (0, vitest_1.beforeEach)(function () {
        // Create mocks for ports
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
        configPort = {
            load: vitest_1.vi.fn(),
            save: vitest_1.vi.fn(),
            exists: vitest_1.vi.fn(),
            reset: vitest_1.vi.fn(),
            watch: vitest_1.vi.fn(),
            unwatch: vitest_1.vi.fn()
        };
        notificationPort = {
            show: vitest_1.vi.fn(),
            showInfo: vitest_1.vi.fn(),
            showSuccess: vitest_1.vi.fn(),
            showWarning: vitest_1.vi.fn(),
            showError: vitest_1.vi.fn()
        };
        useCase = new StartServerUseCase_js_1.StartServerUseCase(serverPort, configPort, notificationPort);
    });
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('should start server successfully with loaded config', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(configPort.load).toHaveBeenCalled();
                        (0, vitest_1.expect)(serverPort.start).toHaveBeenCalledWith(config);
                        (0, vitest_1.expect)(notificationPort.showSuccess).toHaveBeenCalledWith('PromptX server started successfully', 'Server Running');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle config load failure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var configError, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configError = {
                            code: 'CONFIG_LOAD_FAILED',
                            message: 'Config file corrupted'
                        };
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.fail(configError));
                        vitest_1.vi.mocked(configPort.exists).mockResolvedValue(true); // Config exists but corrupted
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe('USE_CASE_CONFIG_ERROR');
                            (0, vitest_1.expect)(result.error.message).toContain('Config file corrupted');
                        }
                        (0, vitest_1.expect)(serverPort.start).not.toHaveBeenCalled();
                        (0, vitest_1.expect)(notificationPort.showError).toHaveBeenCalledWith('Failed to load configuration: Config file corrupted', 'Configuration Error');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle server already running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.alreadyRunning()));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.ALREADY_RUNNING);
                        }
                        (0, vitest_1.expect)(notificationPort.showWarning).toHaveBeenCalledWith('Server is already running', 'Server Status');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle port in use error', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.portInUse(3000)));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.PORT_IN_USE);
                        }
                        (0, vitest_1.expect)(notificationPort.showError).toHaveBeenCalledWith('Port 3000 is already in use', 'Server Error');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle initialization failure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.initializationFailed('Missing dependencies')));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.INITIALIZATION_FAILED);
                        }
                        (0, vitest_1.expect)(notificationPort.showError).toHaveBeenCalledWith('Failed to initialize server: Missing dependencies', 'Server Error');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should use default config when none exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result, startCall, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.fail({
                            code: 'CONFIG_LOAD_FAILED',
                            message: 'Config not found'
                        }));
                        vitest_1.vi.mocked(configPort.exists).mockResolvedValue(false);
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        startCall = vitest_1.vi.mocked(serverPort.start).mock.calls[0];
                        if (startCall) {
                            config = startCall[0];
                            (0, vitest_1.expect)(config.port).toBe(3000);
                            (0, vitest_1.expect)(config.host).toBe('localhost');
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should save config after successful start', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        vitest_1.vi.mocked(configPort.save).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(configPort.save).toHaveBeenCalledWith(config);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should provide server address in success message', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(configPort.load).mockResolvedValue(Result_js_1.ResultUtil.ok(config));
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:4000'));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(notificationPort.showInfo).toHaveBeenCalledWith('Server available at: http://localhost:4000', 'Server Address');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)('executeWithCustomConfig', function () {
        (0, vitest_1.it)('should start server with custom config', function () { return __awaiter(void 0, void 0, void 0, function () {
            var customConfig, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        customConfig = ServerConfig_js_1.ServerConfig.create({
                            port: 5000,
                            host: '0.0.0.0',
                            workspace: '/custom/path'
                        });
                        if (!customConfig.ok) {
                            throw new Error('Config creation failed');
                        }
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://0.0.0.0:5000'));
                        return [4 /*yield*/, useCase.executeWithCustomConfig(customConfig.value)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(serverPort.start).toHaveBeenCalledWith(customConfig.value);
                        (0, vitest_1.expect)(configPort.save).toHaveBeenCalledWith(customConfig.value);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should not load config when using custom config', function () { return __awaiter(void 0, void 0, void 0, function () {
            var customConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        customConfig = ServerConfig_js_1.ServerConfig.default();
                        vitest_1.vi.mocked(serverPort.start).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        vitest_1.vi.mocked(serverPort.getAddress).mockResolvedValue(Result_js_1.ResultUtil.ok('http://localhost:3000'));
                        return [4 /*yield*/, useCase.executeWithCustomConfig(customConfig)];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(configPort.load).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
