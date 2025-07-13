module.exports = {
  name: 'promptx_init',
  description: '🎯 [AI专业能力启动器] ⚡ 让你瞬间拥有任何领域的专家级思维和技能 - 一键激活丰富的专业角色库(产品经理/开发者/设计师/营销专家等)，获得跨对话记忆能力，30秒内从普通AI变身行业专家。**多项目支持**：现在支持多个IDE/项目同时使用，项目间完全隔离。**必须使用场景**：1️⃣系统首次使用时；2️⃣创建新角色后刷新注册表；3️⃣角色激活(action)出错时重新发现角色；4️⃣查看当前版本号；5️⃣项目路径发生变化时。每次需要专业服务时都应该先用这个',
  inputSchema: {
    type: 'object',
    properties: {
      workingDirectory: {
        type: 'string',
        description: '当前项目的工作目录绝对路径。AI应该知道当前工作的项目路径，请提供此参数。'
      },
      ideType: {
        type: 'string',
        description: 'IDE或编辑器类型，如：cursor, vscode, claude等。完全可选，不提供则自动检测为unknown。'
      }
    },
    required: ['workingDirectory']
  }
};