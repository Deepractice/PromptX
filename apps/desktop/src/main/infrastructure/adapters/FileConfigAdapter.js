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
exports.FileConfigAdapter = void 0;
var fs = require("node:fs/promises");
var fsSync = require("node:fs");
var path = require("node:path");
var Result_1 = require("~/shared/Result");
var ServerConfig_1 = require("~/main/domain/entities/ServerConfig");
var FileConfigAdapter = /** @class */ (function () {
    function FileConfigAdapter(configPath) {
        this.configPath = configPath;
        this.watchers = new Set();
        this.fileWatcher = null;
        // Ensure config directory exists
        this.ensureConfigDir();
    }
    FileConfigAdapter.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, parsed, configResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(this.configPath, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        parsed = JSON.parse(data);
                        configResult = ServerConfig_1.ServerConfig.create(parsed);
                        if (!configResult.ok) {
                            return [2 /*return*/, Result_1.ResultUtil.fail({
                                    code: 'CONFIG_PARSE_ERROR',
                                    message: 'Invalid configuration format',
                                    cause: configResult.error
                                })];
                        }
                        return [2 /*return*/, Result_1.ResultUtil.ok(configResult.value)];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1.code === 'ENOENT') {
                            return [2 /*return*/, Result_1.ResultUtil.fail({
                                    code: 'CONFIG_LOAD_FAILED',
                                    message: 'Configuration file not found',
                                    cause: error_1
                                })];
                        }
                        return [2 /*return*/, Result_1.ResultUtil.fail({
                                code: 'CONFIG_LOAD_FAILED',
                                message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                                cause: error_1
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FileConfigAdapter.prototype.save = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureConfigDir()];
                    case 1:
                        _a.sent();
                        data = JSON.stringify(config.toJSON(), null, 2);
                        return [4 /*yield*/, fs.writeFile(this.configPath, data, 'utf-8')
                            // Notify watchers
                        ];
                    case 2:
                        _a.sent();
                        // Notify watchers
                        this.notifyWatchers(config);
                        return [2 /*return*/, Result_1.ResultUtil.ok(undefined)];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, Result_1.ResultUtil.fail({
                                code: 'CONFIG_SAVE_FAILED',
                                message: error_2 instanceof Error ? error_2.message : 'Failed to save configuration',
                                cause: error_2
                            })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileConfigAdapter.prototype.exists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.access(this.configPath)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FileConfigAdapter.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var defaultConfig, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        defaultConfig = ServerConfig_1.ServerConfig.default();
                        return [4 /*yield*/, this.save(defaultConfig)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, Result_1.ResultUtil.fail({
                                code: 'CONFIG_SAVE_FAILED',
                                message: 'Failed to reset configuration',
                                cause: error_3
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FileConfigAdapter.prototype.watch = function (callback) {
        this.watchers.add(callback);
        // Setup file watcher if not already watching
        if (!this.fileWatcher) {
            this.setupFileWatcher();
        }
    };
    FileConfigAdapter.prototype.unwatch = function (callback) {
        this.watchers.delete(callback);
        // Stop watching if no more watchers
        if (this.watchers.size === 0 && this.fileWatcher) {
            fsSync.unwatchFile(this.configPath);
            this.fileWatcher = null;
        }
    };
    FileConfigAdapter.prototype.ensureConfigDir = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dir, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dir = path.dirname(this.configPath);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileConfigAdapter.prototype.setupFileWatcher = function () {
        var _this = this;
        try {
            // Using fs.watchFile as it's more reliable for single files
            fsSync.watchFile(this.configPath, function () { return __awaiter(_this, void 0, void 0, function () {
                var configResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.load()];
                        case 1:
                            configResult = _a.sent();
                            if (configResult.ok) {
                                this.notifyWatchers(configResult.value);
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            this.fileWatcher = true;
        }
        catch (_a) {
            // File might not exist yet
        }
    };
    FileConfigAdapter.prototype.notifyWatchers = function (config) {
        this.watchers.forEach(function (callback) {
            try {
                callback(config);
            }
            catch (error) {
                console.error('Error in config watcher:', error);
            }
        });
    };
    return FileConfigAdapter;
}());
exports.FileConfigAdapter = FileConfigAdapter;
