"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerConfig = void 0;
var Result_1 = require("~/shared/Result");
var ServerErrors_1 = require("~/main/domain/errors/ServerErrors");
var ServerConfig = /** @class */ (function () {
    function ServerConfig(data) {
        this.data = data;
    }
    ServerConfig.create = function (data) {
        var _a, _b, _c, _d;
        var errors = [];
        if (!Number.isInteger(data.port) || data.port < 1 || data.port > 65535) {
            errors.push("Invalid port: ".concat(data.port));
        }
        if (!data.host || data.host.trim().length === 0) {
            errors.push('Host cannot be empty');
        }
        if (errors.length > 0) {
            return Result_1.ResultUtil.fail(ServerErrors_1.ServerError.configInvalid(errors.join(', ')));
        }
        var config = new ServerConfig({
            port: data.port,
            host: data.host.trim(),
            workspace: data.workspace || process.cwd(),
            autoStart: (_a = data.autoStart) !== null && _a !== void 0 ? _a : false,
            updateStrategy: (_b = data.updateStrategy) !== null && _b !== void 0 ? _b : 'notify',
            debug: (_c = data.debug) !== null && _c !== void 0 ? _c : false,
            stateless: (_d = data.stateless) !== null && _d !== void 0 ? _d : false
        });
        return Result_1.ResultUtil.ok(config);
    };
    ServerConfig.default = function () {
        return new ServerConfig({
            port: 5203,
            host: 'localhost',
            workspace: process.cwd(),
            autoStart: false,
            updateStrategy: 'notify',
            debug: false,
            stateless: true // Changed to stateless mode for Claude Desktop compatibility
        });
    };
    Object.defineProperty(ServerConfig.prototype, "port", {
        get: function () {
            return this.data.port;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "host", {
        get: function () {
            return this.data.host;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "workspace", {
        get: function () {
            return this.data.workspace;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "autoStart", {
        get: function () {
            return this.data.autoStart;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "updateStrategy", {
        get: function () {
            return this.data.updateStrategy;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "debug", {
        get: function () {
            return this.data.debug;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ServerConfig.prototype, "stateless", {
        get: function () {
            return this.data.stateless;
        },
        enumerable: false,
        configurable: true
    });
    ServerConfig.prototype.getAddress = function () {
        return "http://".concat(this.host, ":").concat(this.port);
    };
    ServerConfig.prototype.withPort = function (port) {
        return ServerConfig.create(__assign(__assign({}, this.data), { port: port }));
    };
    ServerConfig.prototype.withHost = function (host) {
        return ServerConfig.create(__assign(__assign({}, this.data), { host: host }));
    };
    ServerConfig.prototype.toJSON = function () {
        return __assign({}, this.data);
    };
    return ServerConfig;
}());
exports.ServerConfig = ServerConfig;
