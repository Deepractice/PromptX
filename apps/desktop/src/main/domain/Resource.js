"use strict";
/**
 * Resource 领域模型 - 统一的资源（角色和工具）表示
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceStatus = void 0;
/**
 * Resource 值对象 - 资源状态
 */
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["AVAILABLE"] = "available";
    ResourceStatus["LOADING"] = "loading";
    ResourceStatus["ERROR"] = "error";
    ResourceStatus["DISABLED"] = "disabled";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
