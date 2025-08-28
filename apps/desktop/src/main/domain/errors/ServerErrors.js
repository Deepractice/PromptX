"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.ServerErrorCode = void 0;
var ServerErrorCode;
(function (ServerErrorCode) {
    ServerErrorCode["ALREADY_RUNNING"] = "SERVER_ALREADY_RUNNING";
    ServerErrorCode["NOT_RUNNING"] = "SERVER_NOT_RUNNING";
    ServerErrorCode["PORT_IN_USE"] = "SERVER_PORT_IN_USE";
    ServerErrorCode["INITIALIZATION_FAILED"] = "SERVER_INITIALIZATION_FAILED";
    ServerErrorCode["SHUTDOWN_FAILED"] = "SERVER_SHUTDOWN_FAILED";
    ServerErrorCode["CONFIG_INVALID"] = "SERVER_CONFIG_INVALID";
    ServerErrorCode["RESOURCE_UNAVAILABLE"] = "SERVER_RESOURCE_UNAVAILABLE";
    ServerErrorCode["UNKNOWN"] = "SERVER_UNKNOWN_ERROR";
})(ServerErrorCode || (exports.ServerErrorCode = ServerErrorCode = {}));
var ServerError = /** @class */ (function (_super) {
    __extends(ServerError, _super);
    function ServerError(code, message, cause) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.cause = cause;
        _this.name = 'ServerError';
        return _this;
    }
    ServerError.alreadyRunning = function () {
        return new ServerError(ServerErrorCode.ALREADY_RUNNING, 'Server is already running');
    };
    ServerError.notRunning = function () {
        return new ServerError(ServerErrorCode.NOT_RUNNING, 'Server is not running');
    };
    ServerError.portInUse = function (port) {
        return new ServerError(ServerErrorCode.PORT_IN_USE, "Port ".concat(port, " is already in use"));
    };
    ServerError.initializationFailed = function (reason, cause) {
        return new ServerError(ServerErrorCode.INITIALIZATION_FAILED, "Failed to initialize server: ".concat(reason), cause);
    };
    ServerError.shutdownFailed = function (reason, cause) {
        return new ServerError(ServerErrorCode.SHUTDOWN_FAILED, "Failed to shutdown server: ".concat(reason), cause);
    };
    ServerError.configInvalid = function (reason) {
        return new ServerError(ServerErrorCode.CONFIG_INVALID, "Invalid server configuration: ".concat(reason));
    };
    ServerError.resourceUnavailable = function (resource) {
        return new ServerError(ServerErrorCode.RESOURCE_UNAVAILABLE, "Required resource is unavailable: ".concat(resource));
    };
    ServerError.unknown = function (message, cause) {
        return new ServerError(ServerErrorCode.UNKNOWN, message, cause);
    };
    return ServerError;
}(Error));
exports.ServerError = ServerError;
