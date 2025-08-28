"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = void 0;
var ResourceListWindow_1 = require("~/main/windows/ResourceListWindow");
var ResourceService_1 = require("~/main/application/ResourceService");
var PromptXResourceRepository_1 = require("~/main/infrastructure/PromptXResourceRepository");
var PromptXActivationAdapter_1 = require("~/main/infrastructure/PromptXActivationAdapter");
/**
 * Resource Manager - 主程序集成点
 * 负责组装和管理资源（角色和工具）相关组件
 */
var ResourceManager = /** @class */ (function () {
    function ResourceManager() {
        this.resourceListWindow = null;
        // 依赖注入，组装各层组件
        var repository = new PromptXResourceRepository_1.PromptXResourceRepository();
        var activationAdapter = new PromptXActivationAdapter_1.PromptXActivationAdapter();
        this.resourceService = new ResourceService_1.ResourceService(repository, activationAdapter);
        // 创建窗口管理器
        this.resourceListWindow = new ResourceListWindow_1.ResourceListWindow(this.resourceService);
    }
    ResourceManager.prototype.showResourceList = function () {
        var _a;
        (_a = this.resourceListWindow) === null || _a === void 0 ? void 0 : _a.show();
    };
    ResourceManager.prototype.hideResourceList = function () {
        var _a;
        (_a = this.resourceListWindow) === null || _a === void 0 ? void 0 : _a.hide();
    };
    ResourceManager.prototype.destroy = function () {
        var _a;
        (_a = this.resourceListWindow) === null || _a === void 0 ? void 0 : _a.close();
        this.resourceListWindow = null;
    };
    return ResourceManager;
}());
exports.ResourceManager = ResourceManager;
