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
var StopServerUseCase_js_1 = require("../../../src/application/useCases/StopServerUseCase.js");
var ServerErrors_js_1 = require("../../../src/domain/errors/ServerErrors.js");
var Result_js_1 = require("../../../src/shared/Result.js");
(0, vitest_1.describe)('StopServerUseCase', function () {
    var useCase;
    var serverPort;
    var notificationPort;
    (0, vitest_1.beforeEach)(function () {
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
        notificationPort = {
            show: vitest_1.vi.fn(),
            showInfo: vitest_1.vi.fn(),
            showSuccess: vitest_1.vi.fn(),
            showWarning: vitest_1.vi.fn(),
            showError: vitest_1.vi.fn()
        };
        useCase = new StopServerUseCase_js_1.StopServerUseCase(serverPort, notificationPort);
    });
    (0, vitest_1.describe)('execute', function () {
        (0, vitest_1.it)('should stop server successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.stop).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(serverPort.stop).toHaveBeenCalled();
                        (0, vitest_1.expect)(notificationPort.showSuccess).toHaveBeenCalledWith('PromptX server stopped successfully', 'Server Stopped');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle server not running', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.stop).mockResolvedValue(Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.notRunning()));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.NOT_RUNNING);
                        }
                        (0, vitest_1.expect)(notificationPort.showWarning).toHaveBeenCalledWith('Server is not running', 'Server Status');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle shutdown failure', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.stop).mockResolvedValue(Result_js_1.ResultUtil.fail(ServerErrors_js_1.ServerError.shutdownFailed('Timeout')));
                        return [4 /*yield*/, useCase.execute()];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(false);
                        if (!result.ok) {
                            (0, vitest_1.expect)(result.error.code).toBe(ServerErrors_js_1.ServerErrorCode.SHUTDOWN_FAILED);
                        }
                        (0, vitest_1.expect)(notificationPort.showError).toHaveBeenCalledWith('Failed to shutdown server: Timeout', 'Server Error');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle graceful shutdown option', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.stop).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, useCase.execute({ graceful: true })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(notificationPort.showInfo).toHaveBeenCalledWith('Gracefully shutting down server...', 'Server Shutdown');
                        (0, vitest_1.expect)(notificationPort.showSuccess).toHaveBeenCalledWith('PromptX server stopped successfully', 'Server Stopped');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)('should handle force shutdown option', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vitest_1.vi.mocked(serverPort.stop).mockResolvedValue(Result_js_1.ResultUtil.ok(undefined));
                        return [4 /*yield*/, useCase.execute({ force: true })];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.ok).toBe(true);
                        (0, vitest_1.expect)(notificationPort.showWarning).toHaveBeenCalledWith('Force stopping server...', 'Server Shutdown');
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
