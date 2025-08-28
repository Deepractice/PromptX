"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
var fs = require("fs");
var path = require("path");
var os = require("os");
/**
 * Desktop 日志工具
 * 基于 PromptX logger 的 TypeScript 版本
 * 日志写入 ~/.promptx/logs/desktop.log
 */
var Logger = /** @class */ (function () {
    function Logger(options) {
        if (options === void 0) { options = {}; }
        this.logStream = null;
        this.silent = options.silent || false;
        this.prefix = options.prefix || 'Desktop';
        this.instanceId = "desktop-".concat(process.pid);
        this.logToFile = options.logToFile !== false;
        this.logDir = options.logDir || path.join(os.homedir(), '.promptx', 'logs');
        this.retentionDays = options.retentionDays || 7;
        if (this.logToFile && !this.silent) {
            this.initFileLogging();
        }
    }
    Logger.prototype.initFileLogging = function () {
        try {
            // Ensure log directory exists
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            // Clean old logs
            this.cleanOldLogs();
            // Create today's log file
            var today = new Date().toISOString().split('T')[0];
            var logFile = path.join(this.logDir, "desktop-".concat(today, ".log"));
            // Open file stream in append mode
            this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
            // Write startup marker
            var separator = '='.repeat(80);
            this.writeToFile('INFO', "\n".concat(separator, "\nDesktop App Started - Instance: ").concat(this.instanceId, "\n").concat(separator));
        }
        catch (error) {
            console.error('Failed to initialize file logging:', error.message);
        }
    };
    Logger.prototype.cleanOldLogs = function () {
        var _this = this;
        try {
            var files = fs.readdirSync(this.logDir);
            var now_1 = Date.now();
            var maxAge_1 = this.retentionDays * 24 * 60 * 60 * 1000;
            files.forEach(function (file) {
                if (file.startsWith('desktop-') && file.endsWith('.log')) {
                    var filePath = path.join(_this.logDir, file);
                    var stats = fs.statSync(filePath);
                    if (now_1 - stats.mtime.getTime() > maxAge_1) {
                        fs.unlinkSync(filePath);
                    }
                }
            });
        }
        catch (error) {
            // Ignore cleanup failures
        }
    };
    Logger.prototype.formatLogEntry = function (level, message) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var timestamp = new Date().toISOString();
        var formattedArgs = args.map(function (arg) {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                }
                catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        return "[".concat(timestamp, "] [").concat(this.instanceId, "] [").concat(level, "] ").concat(message, " ").concat(formattedArgs).trim();
    };
    Logger.prototype.writeToFile = function (level, message) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.logStream && this.logStream.writable) {
            try {
                var logEntry = this.formatLogEntry.apply(this, __spreadArray([level, message], args, false));
                this.logStream.write(logEntry + '\n');
            }
            catch (error) {
                // Ignore write failures
            }
        }
    };
    Logger.prototype.info = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.log.apply(console, __spreadArray(["\u2139 ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['INFO', message], args, false));
    };
    Logger.prototype.success = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.log.apply(console, __spreadArray(["\u2705 ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['SUCCESS', message], args, false));
    };
    Logger.prototype.warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.warn.apply(console, __spreadArray(["\u26A0\uFE0F ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['WARN', message], args, false));
    };
    Logger.prototype.error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.error.apply(console, __spreadArray(["\u274C ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['ERROR', message], args, false));
    };
    Logger.prototype.debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent || !process.env.DEBUG)
            return;
        console.log.apply(console, __spreadArray(["\uD83D\uDC1B ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['DEBUG', message], args, false));
    };
    Logger.prototype.step = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.log.apply(console, __spreadArray(["\u25B6\uFE0F ".concat(message)], args, false));
        this.writeToFile.apply(this, __spreadArray(['STEP', message], args, false));
    };
    Logger.prototype.log = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.silent)
            return;
        console.log.apply(console, __spreadArray([message], args, false));
        this.writeToFile.apply(this, __spreadArray(['LOG', message], args, false));
    };
    Logger.prototype.separator = function (char, length) {
        if (char === void 0) { char = '='; }
        if (length === void 0) { length = 80; }
        if (this.silent)
            return;
        var line = char.repeat(length);
        console.log(line);
        this.writeToFile('LOG', line);
    };
    Logger.prototype.close = function () {
        if (this.logStream) {
            this.logStream.end();
            this.logStream = null;
        }
    };
    return Logger;
}());
exports.Logger = Logger;
// Export default logger instance
exports.logger = new Logger();
// Export for module-specific loggers
exports.default = exports.logger;
