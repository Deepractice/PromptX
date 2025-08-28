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
exports.PromptXServerAdapter = void 0;
var Result_1 = require("~/shared/Result");
var ServerErrors_1 = require("~/main/domain/errors/ServerErrors");
var ServerStatus_1 = require("~/main/domain/valueObjects/ServerStatus");
var logger_1 = require("~/shared/logger");
var FastMCPServer_js_1 = require("./FastMCPServer.js");
var PromptXServerAdapter = /** @class */ (function () {
    function PromptXServerAdapter() {
        this.server = null;
        this.statusListeners = new Set();
        this.currentStatus = ServerStatus_1.ServerStatus.STOPPED;
    }
    PromptXServerAdapter.prototype.start = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if ((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning()) {
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.alreadyRunning())];
                        }
                        this.updateStatus(ServerStatus_1.ServerStatus.STARTING);
                        // Create and start the FastMCP server
                        this.server = new FastMCPServer_js_1.FastMCPServer({
                            host: config.host,
                            port: config.port,
                            debug: config.debug || false,
                            stateless: config.stateless || false
                        });
                        return [4 /*yield*/, this.server.start()];
                    case 1:
                        _b.sent();
                        this.updateStatus(ServerStatus_1.ServerStatus.RUNNING);
                        logger_1.logger.info("Server running at ".concat(this.server.getMCPEndpoint()));
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                    case 2:
                        error_1 = _b.sent();
                        this.updateStatus(ServerStatus_1.ServerStatus.ERROR);
                        if (error_1 instanceof Error) {
                            if (error_1.message.includes('EADDRINUSE')) {
                                return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.portInUse(config.port))];
                            }
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.initializationFailed(error_1.message, error_1))];
                        }
                        return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.unknown('Failed to start server', error_1))];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PromptXServerAdapter.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.notRunning())];
                        }
                        this.updateStatus(ServerStatus_1.ServerStatus.STOPPING);
                        return [4 /*yield*/, this.server.stop()];
                    case 1:
                        _b.sent();
                        this.server = null;
                        this.updateStatus(ServerStatus_1.ServerStatus.STOPPED);
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                    case 2:
                        error_2 = _b.sent();
                        this.updateStatus(ServerStatus_1.ServerStatus.ERROR);
                        if (error_2 instanceof Error) {
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.shutdownFailed(error_2.message, error_2))];
                        }
                        return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.unknown('Failed to stop server', error_2))];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PromptXServerAdapter.prototype.restart = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var stopResult;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning())) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.stop()];
                    case 1:
                        stopResult = _b.sent();
                        if (!stopResult.ok) {
                            return [2 /*return*/, stopResult];
                        }
                        _b.label = 2;
                    case 2: return [2 /*return*/, this.start(config)];
                }
            });
        });
    };
    PromptXServerAdapter.prototype.getStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.server) {
                    return [2 /*return*/, Result_1.ResultUtil.ok(ServerStatus_1.ServerStatus.STOPPED)];
                }
                if (this.server.isRunning()) {
                    return [2 /*return*/, Result_1.ResultUtil.ok(ServerStatus_1.ServerStatus.RUNNING)];
                }
                if (this.server.isStarting()) {
                    return [2 /*return*/, Result_1.ResultUtil.ok(ServerStatus_1.ServerStatus.STARTING)];
                }
                if (this.server.isStopping()) {
                    return [2 /*return*/, Result_1.ResultUtil.ok(ServerStatus_1.ServerStatus.STOPPING)];
                }
                return [2 /*return*/, Result_1.ResultUtil.ok(ServerStatus_1.ServerStatus.ERROR)];
            });
        });
    };
    PromptXServerAdapter.prototype.getAddress = function () {
        return __awaiter(this, void 0, void 0, function () {
            var address;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                    return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.notRunning())];
                }
                address = this.server.getAddress();
                return [2 /*return*/, Result_1.ResultUtil.ok(address)];
            });
        });
    };
    PromptXServerAdapter.prototype.getMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metrics;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                    return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.notRunning())];
                }
                metrics = {
                    uptime: this.server.getUptime(),
                    requestCount: this.server.getRequestCount(),
                    activeConnections: this.server.getActiveConnections(),
                    memoryUsage: process.memoryUsage()
                };
                return [2 /*return*/, Result_1.ResultUtil.ok(metrics)];
            });
        });
    };
    PromptXServerAdapter.prototype.updateConfig = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = this.server) === null || _a === void 0 ? void 0 : _a.isRunning())) {
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.notRunning())];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.server.updateConfig(config)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                    case 3:
                        error_3 = _b.sent();
                        if (error_3 instanceof Error) {
                            return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.configInvalid(error_3.message))];
                        }
                        return [2 /*return*/, Result_1.ResultUtil.fail(ServerErrors_1.ServerError.unknown('Failed to update config', error_3))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PromptXServerAdapter.prototype.onStatusChange = function (callback) {
        this.statusListeners.add(callback);
    };
    PromptXServerAdapter.prototype.removeStatusListener = function (callback) {
        this.statusListeners.delete(callback);
    };
    PromptXServerAdapter.prototype.updateStatus = function (status) {
        this.currentStatus = status;
        this.statusListeners.forEach(function (listener) {
            try {
                listener(status);
            }
            catch (error) {
                logger_1.logger.error('Error in status listener:', error);
            }
        });
    };
    return PromptXServerAdapter;
}());
exports.PromptXServerAdapter = PromptXServerAdapter;
