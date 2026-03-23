/**
 * Workspace MCP - 工作区文件操作 MCP 服务器
 *
 * 提供 AI 安全访问用户本地工作区文件的能力
 *
 * ## 功能
 * - list_workspaces: 获取工作区列表
 * - list_workspace_directory: 列出目录内容
 * - read_workspace_file: 读取文件内容
 * - write_workspace_file: 写入文件
 * - create_workspace_directory: 创建目录
 * - delete_workspace_item: 删除文件/目录
 */

export { WORKSPACE_TOOLS, handleWorkspaceTool } from './tools/index.js';
export {
  listWorkspaces,
  listDirectory,
  readWorkspaceFile,
  writeWorkspaceFile,
  createWorkspaceDirectory,
  deleteWorkspaceItem,
  listMcpServers,
  addMcpServer,
  removeMcpServer,
  updateMcpServer,
  type McpServerConfig,
} from './service/index.js';
