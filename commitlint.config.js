module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 自定义规则
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响代码运行的变动）
        'refactor', // 重构（既不是新增功能，也不是修复bug）
        'perf',     // 性能优化
        'test',     // 增加测试
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回滚
        'build',    // 构建系统或外部依赖的变动
        'ci'        // CI/CD配置和GitHub Actions workflow的变动
      ]
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    // 自定义规则：ci类型的提交必须包含CI相关文件
    'ci-files-required': [2, 'always']
  },
  plugins: [
    {
      rules: {
        'ci-files-required': ({type, files}) => {
          // 如果不是ci类型，直接通过
          if (type !== 'ci') {
            return [true];
          }
          
          // 检查是否包含CI相关文件
          const ciFiles = files?.filter(file => 
            file.includes('.github/workflows/') ||
            file.includes('.github/actions/') ||
            file.includes('jest.config.js') ||
            file.includes('commitlint.config.js') ||
            file.includes('.eslintrc') ||
            file.includes('.prettierrc') ||
            file.includes('package.json') && file.includes('scripts')
          );
          
          if (!ciFiles || ciFiles.length === 0) {
            return [false, 'ci类型的提交必须包含CI相关文件的修改（.github/workflows/, 测试配置, lint配置等）'];
          }
          
          return [true];
        }
      }
    }
  ]
};