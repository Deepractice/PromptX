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
exports.ResourceService = void 0;
/**
 * Resource Service - 应用层服务
 * 负责资源的业务逻辑
 */
var ResourceService = /** @class */ (function () {
    function ResourceService(repository, activationAdapter) {
        this.repository = repository;
        this.activationAdapter = activationAdapter;
    }
    /**
     * 获取所有资源
     */
    ResourceService.prototype.getAllResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.findAll()];
            });
        });
    };
    /**
     * 按类型获取资源
     */
    ResourceService.prototype.getResourcesByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.findByType(type)];
            });
        });
    };
    /**
     * 按来源获取资源
     */
    ResourceService.prototype.getResourcesBySource = function (source) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.findBySource(source)];
            });
        });
    };
    /**
     * 获取分组资源（用于UI展示）
     */
    ResourceService.prototype.getGroupedResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.getGroupedBySource()];
            });
        });
    };
    /**
     * 获取资源统计
     */
    ResourceService.prototype.getStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.getStatistics()];
            });
        });
    };
    /**
     * 搜索资源
     */
    ResourceService.prototype.searchResources = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.repository.search(query)];
            });
        });
    };
    /**
     * 激活角色
     */
    ResourceService.prototype.activateRole = function (roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var resource, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.repository.findById(roleId)];
                    case 1:
                        resource = _a.sent();
                        if (!resource) {
                            return [2 /*return*/, { success: false, message: '角色不存在' }];
                        }
                        if (resource.type !== 'role') {
                            return [2 /*return*/, { success: false, message: '只能激活角色类型的资源' }];
                        }
                        return [4 /*yield*/, this.activationAdapter.activate(roleId)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, { success: false, message: error_1.message || '激活失败' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 执行工具
     */
    ResourceService.prototype.executeTool = function (toolId, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var resource, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.repository.findById(toolId)];
                    case 1:
                        resource = _a.sent();
                        if (!resource) {
                            return [2 /*return*/, { success: false, message: '工具不存在' }];
                        }
                        if (resource.type !== 'tool') {
                            return [2 /*return*/, { success: false, message: '只能执行工具类型的资源' }];
                        }
                        // TODO: 实现工具执行逻辑
                        return [2 /*return*/, { success: true, message: '工具执行功能待实现' }];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, { success: false, message: error_2.message || '执行失败' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ResourceService;
}());
exports.ResourceService = ResourceService;
