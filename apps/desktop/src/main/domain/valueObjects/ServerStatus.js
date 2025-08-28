"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStatusValue = exports.ServerStatus = void 0;
var ServerStatus;
(function (ServerStatus) {
    ServerStatus["STOPPED"] = "stopped";
    ServerStatus["STARTING"] = "starting";
    ServerStatus["RUNNING"] = "running";
    ServerStatus["STOPPING"] = "stopping";
    ServerStatus["ERROR"] = "error";
})(ServerStatus || (exports.ServerStatus = ServerStatus = {}));
var ServerStatusValue = /** @class */ (function () {
    function ServerStatusValue(status) {
        this.status = status;
    }
    ServerStatusValue.stopped = function () {
        return new ServerStatusValue(ServerStatus.STOPPED);
    };
    ServerStatusValue.starting = function () {
        return new ServerStatusValue(ServerStatus.STARTING);
    };
    ServerStatusValue.running = function () {
        return new ServerStatusValue(ServerStatus.RUNNING);
    };
    ServerStatusValue.stopping = function () {
        return new ServerStatusValue(ServerStatus.STOPPING);
    };
    ServerStatusValue.error = function () {
        return new ServerStatusValue(ServerStatus.ERROR);
    };
    ServerStatusValue.prototype.getValue = function () {
        return this.status;
    };
    ServerStatusValue.prototype.isRunning = function () {
        return this.status === ServerStatus.RUNNING;
    };
    ServerStatusValue.prototype.isStopped = function () {
        return this.status === ServerStatus.STOPPED;
    };
    ServerStatusValue.prototype.canStart = function () {
        return this.status === ServerStatus.STOPPED ||
            this.status === ServerStatus.ERROR;
    };
    ServerStatusValue.prototype.canStop = function () {
        return this.status === ServerStatus.RUNNING;
    };
    ServerStatusValue.prototype.equals = function (other) {
        return this.status === other.status;
    };
    ServerStatusValue.prototype.toString = function () {
        return this.status;
    };
    return ServerStatusValue;
}());
exports.ServerStatusValue = ServerStatusValue;
