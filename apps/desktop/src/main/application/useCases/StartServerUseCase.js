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
exports.StartServerUseCase = void 0;
var Result_1 = require("~/shared/Result");
var ServerConfig_1 = require("~/main/domain/entities/ServerConfig");
var ServerErrors_1 = require("~/main/domain/errors/ServerErrors");
var StartServerUseCase = /** @class */ (function () {
    function StartServerUseCase(serverPort, configPort, notificationPort) {
        this.serverPort = serverPort;
        this.configPort = configPort;
        this.notificationPort = notificationPort;
    }
    StartServerUseCase.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configResult, config, startResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadOrCreateConfig()];
                    case 1:
                        configResult = _a.sent();
                        if (!configResult.ok) {
                            return [2 /*return*/, configResult];
                        }
                        config = configResult.value;
                        return [4 /*yield*/, this.serverPort.start(config)];
                    case 2:
                        startResult = _a.sent();
                        if (!!startResult.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.handleStartError(startResult.error)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, startResult];
                    case 4: 
                    // Config persistence disabled - using default config only
                    // await this.configPort.save(config)
                    // Show success notifications
                    return [4 /*yield*/, this.showSuccessNotifications()];
                    case 5:
                        // Config persistence disabled - using default config only
                        // await this.configPort.save(config)
                        // Show success notifications
                        _a.sent();
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                }
            });
        });
    };
    StartServerUseCase.prototype.executeWithCustomConfig = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var startResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.serverPort.start(config)];
                    case 1:
                        startResult = _a.sent();
                        if (!!startResult.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handleStartError(startResult.error)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, startResult];
                    case 3: 
                    // Config persistence disabled - using default config only
                    // await this.configPort.save(config)
                    // Show success notifications
                    return [4 /*yield*/, this.showSuccessNotifications()];
                    case 4:
                        // Config persistence disabled - using default config only
                        // await this.configPort.save(config)
                        // Show success notifications
                        _a.sent();
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                }
            });
        });
    };
    StartServerUseCase.prototype.loadOrCreateConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Config file persistence is disabled for now
                // Always use default config from code
                // This ensures users always get the latest configuration we ship
                // TODO: In the future, we can enable this for user preferences
                // const loadResult = await this.configPort.load()
                // 
                // if (loadResult.ok) {
                //   return ResultUtil.ok(loadResult.value)
                // }
                //
                // // Check if config doesn't exist
                // const exists = await this.configPort.exists()
                // if (!exists) {
                //   // Use default config
                //   return ResultUtil.ok(ServerConfig.default())
                // }
                //
                // // Config exists but failed to load
                // const error: UseCaseError = {
                //   code: 'USE_CASE_CONFIG_ERROR',
                //   message: loadResult.error.message,
                //   cause: loadResult.error
                // }
                //
                // await this.notificationPort.showError(
                //   `Failed to load configuration: ${loadResult.error.message}`,
                //   'Configuration Error'
                // )
                //
                // return ResultUtil.fail(error)
                return [2 /*return*/, Result_1.ResultUtil.ok(ServerConfig_1.ServerConfig.default())];
            });
        });
    };
    StartServerUseCase.prototype.handleStartError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.code;
                        switch (_a) {
                            case ServerErrors_1.ServerErrorCode.ALREADY_RUNNING: return [3 /*break*/, 1];
                            case ServerErrors_1.ServerErrorCode.PORT_IN_USE: return [3 /*break*/, 3];
                            case ServerErrors_1.ServerErrorCode.INITIALIZATION_FAILED: return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.notificationPort.showWarning('Server is already running', 'Server Status')];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 3: return [4 /*yield*/, this.notificationPort.showError(error.message, 'Server Error')];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, this.notificationPort.showError(error.message, 'Server Error')];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.notificationPort.showError("Failed to start server: ".concat(error.message), 'Server Error')];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    StartServerUseCase.prototype.showSuccessNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addressResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.notificationPort.showSuccess('PromptX server started successfully', 'Server Running')
                        // Get and show server address
                    ];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.serverPort.getAddress()];
                    case 2:
                        addressResult = _a.sent();
                        if (!addressResult.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.notificationPort.showInfo("Server available at: ".concat(addressResult.value), 'Server Address')];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return StartServerUseCase;
}());
exports.StartServerUseCase = StartServerUseCase;
