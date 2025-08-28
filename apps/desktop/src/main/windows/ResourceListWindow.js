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
exports.ResourceListWindow = void 0;
var electron_1 = require("electron");
var path = require("path");
/**
 * Resource List Window - 资源管理窗口
 */
var ResourceListWindow = /** @class */ (function () {
    function ResourceListWindow(resourceService) {
        this.resourceService = resourceService;
        this.window = null;
        this.setupIpcHandlers();
    }
    ResourceListWindow.prototype.setupIpcHandlers = function () {
        var _this = this;
        // 防止重复注册
        if (ResourceListWindow.handlersRegistered)
            return;
        ResourceListWindow.handlersRegistered = true;
        // 获取分组资源
        electron_1.ipcMain.handle('resources:getGrouped', function () { return __awaiter(_this, void 0, void 0, function () {
            var grouped, stats, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.resourceService.getGroupedResources()];
                    case 1:
                        grouped = _a.sent();
                        return [4 /*yield*/, this.resourceService.getStatistics()];
                    case 2:
                        stats = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: {
                                    grouped: grouped,
                                    statistics: stats
                                }
                            }];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to get grouped resources:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        // 搜索资源
        electron_1.ipcMain.handle('resources:search', function (_, query) { return __awaiter(_this, void 0, void 0, function () {
            var resources, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.resourceService.searchResources(query)];
                    case 1:
                        resources = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: resources
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Failed to search resources:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // 激活角色
        electron_1.ipcMain.handle('resources:activateRole', function (_, roleId) { return __awaiter(_this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.resourceService.activateRole(roleId)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Failed to activate role:', error_3);
                        return [2 /*return*/, {
                                success: false,
                                message: error_3.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // 执行工具
        electron_1.ipcMain.handle('resources:executeTool', function (_, toolId, parameters) { return __awaiter(_this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.resourceService.executeTool(toolId, parameters)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Failed to execute tool:', error_4);
                        return [2 /*return*/, {
                                success: false,
                                message: error_4.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // 获取资源统计
        electron_1.ipcMain.handle('resources:getStatistics', function () { return __awaiter(_this, void 0, void 0, function () {
            var stats, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.resourceService.getStatistics()];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: stats
                            }];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Failed to get statistics:', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: error_5.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    ResourceListWindow.prototype.show = function () {
        if (this.window && !this.window.isDestroyed()) {
            this.window.show();
            this.window.focus();
            return;
        }
        this.createWindow();
    };
    ResourceListWindow.prototype.hide = function () {
        var _a;
        (_a = this.window) === null || _a === void 0 ? void 0 : _a.hide();
    };
    ResourceListWindow.prototype.close = function () {
        if (this.window && !this.window.isDestroyed()) {
            this.window.close();
        }
        this.window = null;
    };
    ResourceListWindow.prototype.createWindow = function () {
        var _this = this;
        var preloadPath = path.join(__dirname, '../preload/preload.cjs');
        this.window = new electron_1.BrowserWindow({
            width: 900,
            height: 700,
            title: 'PromptX Resources - 资源管理',
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false
            },
            show: false,
            resizable: true,
            minimizable: true,
            maximizable: true,
            center: true
        });
        // 加载资源管理页面
        if (process.env.NODE_ENV === 'development') {
            this.window.loadURL('http://localhost:5173/resources.html');
        }
        else {
            this.window.loadFile(path.join(__dirname, '../renderer/resources.html'));
        }
        this.window.once('ready-to-show', function () {
            var _a;
            (_a = _this.window) === null || _a === void 0 ? void 0 : _a.show();
        });
        this.window.on('closed', function () {
            _this.window = null;
        });
    };
    ResourceListWindow.handlersRegistered = false;
    return ResourceListWindow;
}());
exports.ResourceListWindow = ResourceListWindow;
