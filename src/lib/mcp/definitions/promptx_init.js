module.exports = {
  name: 'init',
  description: '📁 [项目配置工具]（可选）仅在需要项目级配置隔离时使用。大多数情况下无需执行此工具，所有 PromptX 功能均可直接使用。',
  inputSchema: {
    type: 'object',
    properties: {
      workingDirectory: {
        type: 'string',
        description: '项目的工作目录路径（可选）。仅在需要项目级配置时提供。'
      },
      ideType: {
        type: 'string',
        description: 'IDE或编辑器类型（可选）。如：cursor, vscode, claude等。'
      }
    },
    required: []
  }
};