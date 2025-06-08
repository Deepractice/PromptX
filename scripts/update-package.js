#!/usr/bin/env node

/**
 * PromptX本地包更新脚本 (Node.js版本)
 * 用法: node scripts/update-package.js [版本号] [变更描述]
 * 例如: node scripts/update-package.js 0.0.2-local.9 "修复某某问题"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// 获取命令行参数
const args = process.argv.slice(2);
let newVersion = args[0];
let changeDescription = args[1] || "包版本更新和依赖优化";

// 读取当前版本
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// 如果没有提供版本号，自动递增
if (!newVersion) {
    log.info(`当前版本: ${currentVersion}`);
    
    // 提取版本号的最后一位数字并递增
    const versionMatch = currentVersion.match(/(.+\.)(\d+)$/);
    if (versionMatch) {
        const prefix = versionMatch[1];
        const number = parseInt(versionMatch[2]);
        newVersion = `${prefix}${number + 1}`;
    } else {
        log.error(`无法解析当前版本号格式: ${currentVersion}`);
        process.exit(1);
    }
}

log.info(`准备更新到版本: ${newVersion}`);
log.info(`变更描述: ${changeDescription}`);

// 确认操作
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question(`${colors.yellow}确认执行更新操作? [y/N]: ${colors.reset}`, (answer) => {
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
        log.warning("操作已取消");
        process.exit(0);
    }
    
    executeUpdate();
});

function executeUpdate() {
    console.log("============================================================");
    log.info("🚀 开始PromptX本地包更新流程");
    console.log("============================================================");

    try {
        // Step 1: 清理npm缓存
        log.info("步骤 1/7: 清理npm缓存...");
        execSync('npm cache clean --force', { stdio: 'inherit' });
        log.success("npm缓存清理完成");

        // Step 2: 删除依赖文件
        log.info("步骤 2/7: 删除依赖文件...");
        if (fs.existsSync('node_modules')) {
            fs.rmSync('node_modules', { recursive: true, force: true });
        }
        if (fs.existsSync('package-lock.json')) {
            fs.unlinkSync('package-lock.json');
        }
        log.success("依赖文件删除完成");

        // Step 3: 更新版本号
        log.info(`步骤 3/7: 更新版本号到 ${newVersion}...`);
        packageJson.version = newVersion;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        log.success("版本号更新完成");

        // Step 4: 重新安装依赖
        log.info("步骤 4/7: 重新安装依赖...");
        execSync('npm install', { stdio: 'inherit' });
        log.success("依赖重装完成");

        // Step 5: 更新CHANGELOG
        log.info("步骤 5/7: 更新CHANGELOG.md...");
        updateChangelog(newVersion, changeDescription);
        log.success("CHANGELOG.md更新完成");

        // Step 6: 基础功能验证
        log.info("步骤 6/7: 运行基础功能验证...");
        try {
            execSync('node src/bin/promptx.js hello', { stdio: 'pipe' });
            log.success("hello命令验证通过");
        } catch (error) {
            log.error("hello命令验证失败");
            throw error;
        }

        // Step 7: 完成
        log.info("步骤 7/7: 更新完成");
        log.success("清理完成");

        // 显示更新摘要
        showSummary(newVersion, changeDescription);

    } catch (error) {
        log.error(`更新过程中出现错误: ${error.message}`);
        process.exit(1);
    }
}

function updateChangelog(version, description) {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const currentDate = new Date().toISOString().split('T')[0];
    
    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf8');
        // 移除第一行的标题，我们会重新添加
        const lines = existingContent.split('\n');
        existingContent = lines.slice(2).join('\n');
    }

    const newEntry = `# Changelog

All notable changes to PromptX will be documented in this file.

## [${version}] - ${currentDate}

### 🔄 Package Updates
- **版本更新**: 更新到${version}
- **依赖优化**: 清理缓存并重新安装所有依赖
- **变更内容**: ${description}

### 🛠️ Technical Details
- npm缓存完全清理
- node_modules和package-lock.json重新生成
- 确保依赖版本一致性
- 运行基础功能验证

${existingContent}`;

    fs.writeFileSync(changelogPath, newEntry);
}

function showSummary(version, description) {
    console.log("============================================================");
    log.success("🎉 PromptX本地包更新完成!");
    console.log("============================================================");

    console.log(`${colors.blue}📋 更新摘要:${colors.reset}`);
    console.log(`  • 版本号: ${version}`);
    console.log(`  • 变更描述: ${description}`);
    console.log(`  • 更新时间: ${new Date().toISOString().split('T')[0]}`);
    
    try {
        const result = execSync('npm list --depth=0 2>/dev/null | grep -c "├──\\|└──" || echo "未知"', { encoding: 'utf8' });
        console.log(`  • 依赖包数量: ${result.trim()}`);
    } catch {
        console.log(`  • 依赖包数量: 未知`);
    }

    console.log(`\n${colors.green}✅ 下一步操作建议:${colors.reset}`);
    console.log("  1. 运行: npm test (可选的完整测试)");
    console.log("  2. 验证: npx dpml-prompt-local hello");
    console.log("  3. 测试: 在其他项目中测试跨项目功能");

    console.log(`\n${colors.yellow}📝 提示:${colors.reset}`);
    console.log("  • CHANGELOG.md已自动更新");
    console.log("  • 如需回滚，请检查Git历史");
    console.log("  • 建议在Git中提交这些更改");
} 