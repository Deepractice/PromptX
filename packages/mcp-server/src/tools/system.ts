import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import os from 'os';
import process from 'process';

/**
 * System 工具 - 获取系统信息
 * 
 * 提供系统环境和运行时信息
 */
export const systemTool: ToolWithHandler = {
  name: 'systemInfo',
  description: 'Get system and runtime information',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['all', 'os', 'memory', 'cpu', 'process', 'network'],
        description: 'Type of system information to retrieve',
        default: 'all'
      }
    }
  },
  handler: async (args: { type?: string }) => {
    const infoType = args.type || 'all';
    let info: any = {};
    
    if (infoType === 'all' || infoType === 'os') {
      info.os = {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        hostname: os.hostname(),
        homedir: os.homedir(),
        tmpdir: os.tmpdir(),
        uptime: os.uptime()
      };
    }
    
    if (infoType === 'all' || infoType === 'memory') {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      info.memory = {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        percentage: ((totalMem - freeMem) / totalMem * 100).toFixed(2) + '%',
        process: process.memoryUsage()
      };
    }
    
    if (infoType === 'all' || infoType === 'cpu') {
      const cpus = os.cpus();
      info.cpu = {
        count: cpus.length,
        model: cpus[0]?.model,
        speed: cpus[0]?.speed,
        loadAvg: os.loadavg()
      };
    }
    
    if (infoType === 'all' || infoType === 'process') {
      info.process = {
        pid: process.pid,
        ppid: process.ppid,
        version: process.version,
        versions: process.versions,
        execPath: process.execPath,
        cwd: process.cwd(),
        argv: process.argv,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH?.split(':').slice(0, 3).join(':') + '...'
        }
      };
    }
    
    if (infoType === 'all' || infoType === 'network') {
      const interfaces = os.networkInterfaces();
      info.network = Object.entries(interfaces).reduce((acc, [name, addrs]) => {
        if (addrs) {
          acc[name] = addrs.filter(addr => !addr.internal).map(addr => ({
            address: addr.address,
            family: addr.family,
            mac: addr.mac
          }));
        }
        return acc;
      }, {} as any);
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(info, null, 2)
      }]
    };
  }
};