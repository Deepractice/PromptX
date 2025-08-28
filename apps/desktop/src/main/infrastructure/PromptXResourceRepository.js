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
exports.PromptXResourceRepository = void 0;
var node_module_1 = require("node:module");
var require = (0, node_module_1.createRequire)(import.meta.url);
/**
 * PromptX Resource Repository - 基础设施层实现
 * 直接使用 WelcomeCommand 获取完整的资源数据
 */
var PromptXResourceRepository = /** @class */ (function () {
    function PromptXResourceRepository() {
        this.resourcesCache = null;
        this.cacheTimestamp = 0;
        this.CACHE_TTL = 5000; // 5秒缓存
        this.welcomeCommand = null;
    }
    PromptXResourceRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getResourcesWithCache()];
            });
        });
    };
    PromptXResourceRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var resources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getResourcesWithCache()];
                    case 1:
                        resources = _a.sent();
                        return [2 /*return*/, resources.find(function (r) { return r.id === id; }) || null];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.findByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var resources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getResourcesWithCache()];
                    case 1:
                        resources = _a.sent();
                        return [2 /*return*/, resources.filter(function (r) { return r.type === type; })];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.findBySource = function (source) {
        return __awaiter(this, void 0, void 0, function () {
            var resources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getResourcesWithCache()];
                    case 1:
                        resources = _a.sent();
                        return [2 /*return*/, resources.filter(function (r) { return r.source === source; })];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.search = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var resources, lowerQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getResourcesWithCache()];
                    case 1:
                        resources = _a.sent();
                        lowerQuery = query.toLowerCase();
                        return [2 /*return*/, resources.filter(function (resource) {
                                return resource.name.toLowerCase().includes(lowerQuery) ||
                                    resource.description.toLowerCase().includes(lowerQuery) ||
                                    resource.tags.some(function (tag) { return tag.toLowerCase().includes(lowerQuery); });
                            })];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.getGroupedBySource = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resources, grouped;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getResourcesWithCache()];
                    case 1:
                        resources = _a.sent();
                        grouped = {
                            system: { roles: [], tools: [] },
                            project: { roles: [], tools: [] },
                            user: { roles: [], tools: [] }
                        };
                        resources.forEach(function (resource) {
                            var sourceGroup = grouped[resource.source];
                            if (resource.type === 'role') {
                                sourceGroup.roles.push(resource);
                            }
                            else {
                                sourceGroup.tools.push(resource);
                            }
                        });
                        return [2 /*return*/, grouped];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.getStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var grouped;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGroupedBySource()];
                    case 1:
                        grouped = _a.sent();
                        return [2 /*return*/, {
                                totalRoles: grouped.system.roles.length + grouped.project.roles.length + grouped.user.roles.length,
                                totalTools: grouped.system.tools.length + grouped.project.tools.length + grouped.user.tools.length,
                                systemRoles: grouped.system.roles.length,
                                systemTools: grouped.system.tools.length,
                                projectRoles: grouped.project.roles.length,
                                projectTools: grouped.project.tools.length,
                                userRoles: grouped.user.roles.length,
                                userTools: grouped.user.tools.length
                            }];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.getResourcesWithCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        now = Date.now();
                        if (this.resourcesCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
                            return [2 /*return*/, this.resourcesCache];
                        }
                        _a = this;
                        return [4 /*yield*/, this.fetchResourcesFromPromptX()];
                    case 1:
                        _a.resourcesCache = _b.sent();
                        this.cacheTimestamp = now;
                        return [2 /*return*/, this.resourcesCache];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.getWelcomeCommand = function () {
        if (!this.welcomeCommand) {
            // 动态导入 WelcomeCommand
            var WelcomeCommand = require('@promptx/cli/src/lib/core/pouch/commands/WelcomeCommand');
            this.welcomeCommand = new WelcomeCommand();
        }
        return this.welcomeCommand;
    };
    PromptXResourceRepository.prototype.fetchResourcesFromPromptX = function () {
        return __awaiter(this, void 0, void 0, function () {
            var welcomeCommand, roleRegistry, toolRegistry, roleCategories, toolCategories, resources, error_1;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 4, , 5]);
                        welcomeCommand = this.getWelcomeCommand();
                        // 刷新所有资源
                        return [4 /*yield*/, welcomeCommand.refreshAllResources()
                            // 加载角色和工具注册表
                        ];
                    case 1:
                        // 刷新所有资源
                        _g.sent();
                        return [4 /*yield*/, welcomeCommand.loadRoleRegistry()];
                    case 2:
                        roleRegistry = _g.sent();
                        return [4 /*yield*/, welcomeCommand.loadToolRegistry()
                            // 按来源分组
                        ];
                    case 3:
                        toolRegistry = _g.sent();
                        roleCategories = welcomeCommand.categorizeBySource(roleRegistry);
                        toolCategories = welcomeCommand.categorizeBySource(toolRegistry);
                        console.log('roleCategories structure:', Object.keys(roleCategories), 'system:', Array.isArray(roleCategories.system), 'project:', Array.isArray(roleCategories.project), 'user:', Array.isArray(roleCategories.user));
                        resources = [];
                        // 处理角色
                        this.processRoles(roleCategories, resources);
                        // 处理工具
                        this.processTools(toolCategories, resources);
                        console.log("Loaded ".concat(resources.length, " resources from PromptX (roles: ").concat(((_a = roleCategories.system) === null || _a === void 0 ? void 0 : _a.length) + ((_b = roleCategories.project) === null || _b === void 0 ? void 0 : _b.length) + ((_c = roleCategories.user) === null || _c === void 0 ? void 0 : _c.length) || 0, ", tools: ").concat(((_d = toolCategories.system) === null || _d === void 0 ? void 0 : _d.length) + ((_e = toolCategories.project) === null || _e === void 0 ? void 0 : _e.length) + ((_f = toolCategories.user) === null || _f === void 0 ? void 0 : _f.length) || 0, ")"));
                        return [2 /*return*/, resources];
                    case 4:
                        error_1 = _g.sent();
                        console.error('Failed to fetch resources from PromptX:', error_1);
                        return [2 /*return*/, []]; // 返回空数组而不是 mock 数据
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PromptXResourceRepository.prototype.processRoles = function (categories, resources) {
        var _this = this;
        // 处理系统角色
        if (categories.system) {
            categories.system.forEach(function (role) {
                resources.push(_this.convertToResource(role, 'role', 'system'));
            });
        }
        // 处理项目角色
        if (categories.project) {
            categories.project.forEach(function (role) {
                resources.push(_this.convertToResource(role, 'role', 'project'));
            });
        }
        // 处理用户角色
        if (categories.user) {
            categories.user.forEach(function (role) {
                resources.push(_this.convertToResource(role, 'role', 'user'));
            });
        }
    };
    PromptXResourceRepository.prototype.processTools = function (categories, resources) {
        var _this = this;
        // 处理系统工具
        if (categories.system) {
            categories.system.forEach(function (tool) {
                resources.push(_this.convertToResource(tool, 'tool', 'system'));
            });
        }
        // 处理项目工具
        if (categories.project) {
            categories.project.forEach(function (tool) {
                resources.push(_this.convertToResource(tool, 'tool', 'project'));
            });
        }
        // 处理用户工具
        if (categories.user) {
            categories.user.forEach(function (tool) {
                resources.push(_this.convertToResource(tool, 'tool', 'user'));
            });
        }
    };
    PromptXResourceRepository.prototype.convertToResource = function (promptxResource, type, source) {
        var resource = {
            id: promptxResource.id || promptxResource.resourceId || 'unknown',
            name: promptxResource.name || promptxResource.title || promptxResource.id || 'Unknown',
            description: promptxResource.description || promptxResource.brief || '暂无描述',
            type: type,
            source: source,
            category: promptxResource.category || 'general',
            tags: promptxResource.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // 添加角色特有字段
        if (type === 'role' && promptxResource.personality) {
            resource.personality = promptxResource.personality;
        }
        // 添加工具特有字段
        if (type === 'tool') {
            if (promptxResource.manual) {
                resource.manual = promptxResource.manual;
            }
            if (promptxResource.parameters) {
                resource.parameters = promptxResource.parameters;
            }
        }
        return resource;
    };
    return PromptXResourceRepository;
}());
exports.PromptXResourceRepository = PromptXResourceRepository;
