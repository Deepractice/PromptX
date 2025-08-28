"use strict";
/**
 * FastMCP Server implementation for Desktop application
 * Direct implementation using FastMCP without relying on @promptx/cli
 */
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
exports.FastMCPServer = void 0;
var fastmcp_1 = require("fastmcp");
var zod_1 = require("zod");
var logger_1 = require("~/shared/logger");
var node_module_1 = require("node:module");
var require = (0, node_module_1.createRequire)(import.meta.url);
// Import PromptX CLI for executing tools
var cli = require('@promptx/cli/src/lib/core/pouch').cli;
// Import ServerEnvironment for initialization
var getGlobalServerEnvironment = require('@promptx/cli/src/lib/utils/ServerEnvironment').getGlobalServerEnvironment;
// Import MCPOutputAdapter for output formatting
var MCPOutputAdapter = require('@promptx/cli/src/lib/mcp/MCPOutputAdapter').MCPOutputAdapter;
var FastMCPServer = /** @class */ (function () {
    function FastMCPServer(config) {
        this.server = null;
        this.startTime = null;
        this.requestCount = 0;
        this.isRunningFlag = false;
        this.sessions = new Map();
        this.connections = 0;
        this.lastError = null;
        this.metrics = {
            enabled: false,
            requestsTotal: 0,
            responseTimeSum: 0,
            responseTimeCount: 0,
            errors: 0,
            toolExecutions: {}
        };
        this.config = config;
        this.metrics.enabled = config.enableMetrics || false;
        this.outputAdapter = new MCPOutputAdapter();
        logger_1.logger.debug("FastMCPServer initialized with config:", config);
    }
    FastMCPServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var serverEnv, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (this.isRunningFlag) {
                            throw new Error('Server is already running');
                        }
                        logger_1.logger.info("Starting FastMCP Server on ".concat(this.config.host, ":").concat(this.config.port));
                        serverEnv = getGlobalServerEnvironment();
                        if (!serverEnv.isInitialized()) {
                            serverEnv.initialize({
                                transport: 'http',
                                host: this.config.host,
                                port: this.config.port
                            });
                        }
                        // Create FastMCP instance
                        this.server = new fastmcp_1.FastMCP({
                            name: 'promptx-desktop',
                            version: '0.1.0',
                            instructions: 'PromptX Desktop MCP Server - Local AI prompt management',
                            logger: this.config.debug ? this.createLogger() : undefined
                        });
                        // Register PromptX tools
                        return [4 /*yield*/, this.registerPromptXTools()
                            // Start the HTTP server
                        ];
                    case 1:
                        // Register PromptX tools
                        _a.sent();
                        // Start the HTTP server
                        return [4 /*yield*/, this.server.start({
                                transportType: 'httpStream',
                                httpStream: {
                                    port: this.config.port,
                                    endpoint: '/mcp',
                                    stateless: this.config.stateless || false,
                                    enableJsonResponse: true
                                }
                            })];
                    case 2:
                        // Start the HTTP server
                        _a.sent();
                        this.isRunningFlag = true;
                        this.startTime = new Date();
                        logger_1.logger.success("FastMCP Server started successfully at http://".concat(this.config.host, ":").concat(this.config.port));
                        logger_1.logger.info("MCP endpoint: http://".concat(this.config.host, ":").concat(this.config.port, "/mcp"));
                        logger_1.logger.info("Mode: ".concat(this.config.stateless ? 'Stateless' : 'Stateful'));
                        if (this.config.debug) {
                            logger_1.logger.debug('Debug mode enabled');
                        }
                        // Setup signal handlers
                        this.setupSignalHandlers();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.logger.error('Failed to start FastMCP Server:', error_1);
                        this.isRunningFlag = false;
                        this.lastError = error_1;
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FastMCPServer.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.isRunningFlag || !this.server) {
                            throw new Error('Server is not running');
                        }
                        logger_1.logger.info('Stopping FastMCP Server...');
                        return [4 /*yield*/, this.server.stop()];
                    case 1:
                        _a.sent();
                        this.isRunningFlag = false;
                        this.server = null;
                        this.startTime = null;
                        logger_1.logger.success('FastMCP Server stopped successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Failed to stop FastMCP Server:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FastMCPServer.prototype.registerPromptXTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promptxLib, toolDefinitions, _i, toolDefinitions_1, toolDef, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.server)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        promptxLib = require('@promptx/cli/src/lib');
                        toolDefinitions = promptxLib.mcp.definitions.tools;
                        logger_1.logger.info("Loading ".concat(toolDefinitions.length, " PromptX tools"));
                        _i = 0, toolDefinitions_1 = toolDefinitions;
                        _a.label = 2;
                    case 2:
                        if (!(_i < toolDefinitions_1.length)) return [3 /*break*/, 7];
                        toolDef = toolDefinitions_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        // Register tool with FastMCP
                        return [4 /*yield*/, this.registerToolToFastMCP(toolDef)];
                    case 4:
                        // Register tool with FastMCP
                        _a.sent();
                        logger_1.logger.debug("Registered tool: ".concat(toolDef.name));
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        logger_1.logger.error("Failed to load tool ".concat(toolDef.name, ":"), error_3);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        logger_1.logger.success("Registered ".concat(toolDefinitions.length, " PromptX tools"));
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _a.sent();
                        logger_1.logger.error('Failed to register PromptX tools:', error_4);
                        // Fall back to test tools
                        this.registerTestTools();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    FastMCPServer.prototype.registerToolToFastMCP = function (toolDef) {
        return __awaiter(this, void 0, void 0, function () {
            var parameters, _i, _a, _b, key, value, prop, zodType, objSchema, _c, _d, _e, objKey, objValue, objProp;
            var _this = this;
            var _f, _g, _h;
            return __generator(this, function (_j) {
                if (!this.server)
                    return [2 /*return*/];
                parameters = {};
                if ((_f = toolDef.inputSchema) === null || _f === void 0 ? void 0 : _f.properties) {
                    for (_i = 0, _a = Object.entries(toolDef.inputSchema.properties); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        prop = value;
                        zodType = void 0;
                        // Map JSON schema types to Zod types
                        if (prop.type === 'string') {
                            zodType = zod_1.z.string();
                        }
                        else if (prop.type === 'number') {
                            zodType = zod_1.z.number();
                        }
                        else if (prop.type === 'boolean') {
                            zodType = zod_1.z.boolean();
                        }
                        else if (prop.type === 'object') {
                            // For object types, recursively create Zod schema if properties are defined
                            if (prop.properties) {
                                objSchema = {};
                                for (_c = 0, _d = Object.entries(prop.properties); _c < _d.length; _c++) {
                                    _e = _d[_c], objKey = _e[0], objValue = _e[1];
                                    objProp = objValue;
                                    if (objProp.type === 'string') {
                                        objSchema[objKey] = zod_1.z.string();
                                    }
                                    else if (objProp.type === 'number') {
                                        objSchema[objKey] = zod_1.z.number();
                                    }
                                    else if (objProp.type === 'boolean') {
                                        objSchema[objKey] = zod_1.z.boolean();
                                    }
                                    else {
                                        objSchema[objKey] = zod_1.z.any();
                                    }
                                    // Make optional if not required
                                    if (!((_g = prop.required) === null || _g === void 0 ? void 0 : _g.includes(objKey))) {
                                        objSchema[objKey] = objSchema[objKey].optional();
                                    }
                                }
                                zodType = zod_1.z.object(objSchema);
                            }
                            else {
                                // If no properties defined, accept any object
                                zodType = zod_1.z.record(zod_1.z.any());
                            }
                        }
                        else if (prop.type === 'array') {
                            zodType = zod_1.z.array(zod_1.z.any());
                        }
                        else {
                            zodType = zod_1.z.any();
                        }
                        // Add description if available
                        if (prop.description) {
                            zodType = zodType.describe(prop.description);
                        }
                        // Handle optional fields
                        if (!((_h = toolDef.inputSchema.required) === null || _h === void 0 ? void 0 : _h.includes(key))) {
                            zodType = zodType.optional();
                        }
                        parameters[key] = zodType;
                    }
                }
                this.server.addTool({
                    name: toolDef.name,
                    description: toolDef.description,
                    parameters: zod_1.z.object(parameters),
                    execute: function (args) { return __awaiter(_this, void 0, void 0, function () {
                        var result, error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.requestCount++;
                                    if (this.metrics.enabled) {
                                        this.metrics.requestsTotal++;
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 6, , 7]);
                                    result = void 0;
                                    if (!(toolDef.handler && typeof toolDef.handler === 'function')) return [3 /*break*/, 3];
                                    return [4 /*yield*/, toolDef.handler(args)];
                                case 2:
                                    result = _a.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, this.executePromptXTool(toolDef.name, args)];
                                case 4:
                                    // Default implementation for PromptX tools without handlers
                                    result = _a.sent();
                                    _a.label = 5;
                                case 5: 
                                // Format output using MCPOutputAdapter
                                return [2 /*return*/, this.outputAdapter.convertToMCPFormat(result)];
                                case 6:
                                    error_5 = _a.sent();
                                    logger_1.logger.error("Error executing tool ".concat(toolDef.name, ":"), error_5);
                                    throw error_5;
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); }
                });
                return [2 /*return*/];
            });
        });
    };
    FastMCPServer.prototype.executePromptXTool = function (toolName, args) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, commandName, cliArgs, result, responseTime, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logger_1.logger.info("Executing PromptX tool: ".concat(toolName, " with args:"), args);
                        commandName = toolName.replace(/^promptx_/, '');
                        cliArgs = this.convertToCliArgs(toolName, args);
                        return [4 /*yield*/, cli.execute(commandName, cliArgs)
                            // Record metrics
                        ];
                    case 2:
                        result = _a.sent();
                        // Record metrics
                        if (this.metrics.enabled) {
                            responseTime = Date.now() - startTime;
                            this.metrics.responseTimeSum += responseTime;
                            this.metrics.responseTimeCount++;
                            // Record tool execution count
                            if (!this.metrics.toolExecutions[toolName]) {
                                this.metrics.toolExecutions[toolName] = 0;
                            }
                            this.metrics.toolExecutions[toolName]++;
                        }
                        logger_1.logger.debug("Tool ".concat(toolName, " executed successfully"));
                        // Return raw result - will be formatted by MCPOutputAdapter in registerToolToFastMCP
                        return [2 /*return*/, result];
                    case 3:
                        error_6 = _a.sent();
                        // Record error metrics
                        if (this.metrics.enabled) {
                            this.metrics.errors++;
                        }
                        logger_1.logger.error("Error executing tool ".concat(toolName, ":"), error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FastMCPServer.prototype.convertToCliArgs = function (toolName, args) {
        // Convert MCP args to CLI args format based on tool
        var commandName = toolName.replace(/^promptx_/, '');
        switch (commandName) {
            case 'init':
                if (args && args.workingDirectory) {
                    return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }];
                }
                return [];
            case 'welcome':
                return [];
            case 'action':
                return args && args.role ? [args.role] : [];
            case 'learn':
                return args && args.resource ? [args.resource] : [];
            case 'recall':
                if (!args || !args.role) {
                    throw new Error('role parameter is required');
                }
                var recallArgs = [args.role];
                if (args.query && typeof args.query === 'string' && args.query.trim() !== '') {
                    recallArgs.push(args.query);
                }
                return recallArgs;
            case 'remember':
                if (!args || !args.role) {
                    throw new Error('role parameter is required');
                }
                if (!args.engrams || !Array.isArray(args.engrams)) {
                    throw new Error('engrams parameter is required and must be an array');
                }
                // Keep object format, RememberCommand.parseArgs expects object
                return [args];
            case 'toolx':
                if (!args || !args.tool_resource) {
                    throw new Error('tool_resource parameter is required');
                }
                var toolxArgs = [];
                toolxArgs.push(args.tool_resource);
                if (args.parameters) {
                    toolxArgs.push(JSON.stringify(args.parameters));
                }
                if (args.rebuild !== undefined) {
                    toolxArgs.push(args.rebuild);
                }
                if (args.timeout !== undefined) {
                    toolxArgs.push(args.timeout);
                }
                return toolxArgs;
            default:
                // For unknown tools, pass args as-is
                return args ? [args] : [];
        }
    };
    FastMCPServer.prototype.registerTestTools = function () {
        var _this = this;
        if (!this.server)
            return;
        // Register a test echo tool
        this.server.addTool({
            name: 'echo',
            description: 'Echo back the input message',
            parameters: zod_1.z.object({
                message: zod_1.z.string().describe('The message to echo')
            }),
            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                var message = _b.message;
                return __generator(this, function (_c) {
                    this.requestCount++;
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Echo: ".concat(message)
                                }
                            ]
                        }];
                });
            }); }
        });
        // Register a server status tool
        this.server.addTool({
            name: 'server_status',
            description: 'Get the current server status',
            parameters: zod_1.z.object({}),
            execute: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.requestCount++;
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        status: 'running',
                                        uptime: this.getUptime(),
                                        requestCount: this.requestCount,
                                        endpoint: "http://".concat(this.config.host, ":").concat(this.config.port, "/mcp")
                                    }, null, 2)
                                }
                            ]
                        }];
                });
            }); }
        });
        logger_1.logger.info('Registered test tools: echo, server_status');
    };
    FastMCPServer.prototype.isRunning = function () {
        return this.isRunningFlag;
    };
    FastMCPServer.prototype.isStarting = function () {
        return false; // Simple implementation
    };
    FastMCPServer.prototype.isStopping = function () {
        return false; // Simple implementation
    };
    FastMCPServer.prototype.getUptime = function () {
        if (!this.startTime)
            return 0;
        return Date.now() - this.startTime.getTime();
    };
    FastMCPServer.prototype.getRequestCount = function () {
        return this.requestCount;
    };
    FastMCPServer.prototype.getActiveConnections = function () {
        // FastMCP doesn't expose connection count directly
        return this.isRunningFlag ? 1 : 0;
    };
    FastMCPServer.prototype.updateConfig = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // For now, config updates require restart
                Object.assign(this.config, config);
                if (this.isRunningFlag) {
                    logger_1.logger.info('Config updated, restart required to apply changes');
                }
                return [2 /*return*/];
            });
        });
    };
    FastMCPServer.prototype.getAddress = function () {
        return "http://".concat(this.config.host, ":").concat(this.config.port);
    };
    FastMCPServer.prototype.getMCPEndpoint = function () {
        return "http://".concat(this.config.host, ":").concat(this.config.port, "/mcp");
    };
    // Session management methods
    FastMCPServer.prototype.createSession = function (sessionId) {
        if (this.config.stateless) {
            return null;
        }
        var session = {
            id: sessionId,
            createdAt: new Date(),
            lastAccess: new Date(),
            data: {}
        };
        this.sessions.set(sessionId, session);
        return session;
    };
    FastMCPServer.prototype.getSession = function (sessionId) {
        if (this.config.stateless) {
            return null;
        }
        var session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccess = new Date();
        }
        return session;
    };
    FastMCPServer.prototype.deleteSession = function (sessionId) {
        this.sessions.delete(sessionId);
    };
    // Helper methods
    FastMCPServer.prototype.createLogger = function () {
        return {
            log: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return logger_1.logger.log.apply(logger_1.logger, __spreadArray([message], args, false));
            },
            info: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return logger_1.logger.info.apply(logger_1.logger, __spreadArray([message], args, false));
            },
            warn: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return logger_1.logger.warn.apply(logger_1.logger, __spreadArray([message], args, false));
            },
            error: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return logger_1.logger.error.apply(logger_1.logger, __spreadArray([message], args, false));
            },
            debug: function (message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return logger_1.logger.debug.apply(logger_1.logger, __spreadArray([message], args, false));
            }
        };
    };
    FastMCPServer.prototype.setupSignalHandlers = function () {
        var _this = this;
        var shutdown = function (signal) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info("\n\uD83D\uDED1 Received ".concat(signal, ", shutting down gracefully..."));
                        return [4 /*yield*/, this.stop()];
                    case 1:
                        _a.sent();
                        process.exit(0);
                        return [2 /*return*/];
                }
            });
        }); };
        process.once('SIGINT', function () { return shutdown('SIGINT'); });
        process.once('SIGTERM', function () { return shutdown('SIGTERM'); });
    };
    FastMCPServer.prototype.getStatus = function () {
        var uptime = this.startTime
            ? (Date.now() - this.startTime.getTime()) / 1000
            : 0;
        return {
            running: this.isRunningFlag,
            transport: 'http',
            endpoint: this.getMCPEndpoint(),
            port: this.config.port,
            host: this.config.host,
            connections: this.connections,
            sessions: this.config.stateless ? null : {
                count: this.sessions.size,
                ids: Array.from(this.sessions.keys())
            },
            uptime: uptime,
            processedMessages: this.requestCount,
            lastError: this.lastError
        };
    };
    FastMCPServer.prototype.getHealthCheck = function () {
        var uptime = this.startTime
            ? (Date.now() - this.startTime.getTime()) / 1000
            : 0;
        return {
            status: this.isRunningFlag ? 'healthy' : 'unhealthy',
            uptime: uptime,
            memory: process.memoryUsage(),
            tools: this.server ? 'available' : 'unavailable',
            errors: this.metrics.errors
        };
    };
    FastMCPServer.prototype.getMetrics = function () {
        var avgResponseTime = this.metrics.responseTimeCount > 0
            ? this.metrics.responseTimeSum / this.metrics.responseTimeCount
            : 0;
        return {
            requestsTotal: this.metrics.requestsTotal,
            requestsPerSecond: 0, // Need to implement calculation logic
            averageResponseTime: avgResponseTime,
            activeConnections: this.connections,
            toolExecutions: this.metrics.toolExecutions
        };
    };
    return FastMCPServer;
}());
exports.FastMCPServer = FastMCPServer;
