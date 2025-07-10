# Workflow 测试脚本

这个目录包含用于本地测试 GitHub Actions workflows 的脚本。

## 使用前准备

1. 安装 Docker Desktop
2. 安装 act：`brew install act`
3. 配置环境变量：复制 `.github/.env.act.example` 为 `.github/.env.act` 并填写你的 token

## 测试脚本说明

### test-workflows.sh
通用的 workflow 测试入口，显示所有可用的测试命令。

```bash
./scripts/test/workflows/test-workflows.sh
```

### test-feature-snapshot.sh
测试 feature 分支的 snapshot 发布流程。

```bash
./scripts/test/workflows/test-feature-snapshot.sh
```

### test-release-management.sh
测试版本发布管理流程（develop → test → staging → main）。

```bash
./scripts/test/workflows/test-release-management.sh
```

### verify-feature-workflow.sh
验证 feature 分支的 workflow 配置逻辑（无需 Docker）。

```bash
./scripts/test/workflows/verify-feature-workflow.sh
```

### verify-release-workflow.sh
验证 release management 的逻辑流程（无需 Docker）。

```bash
./scripts/test/workflows/verify-release-workflow.sh
```

## 注意事项

- 测试脚本使用 `act` 在本地 Docker 容器中运行 workflows
- 首次运行可能需要下载 Docker 镜像，耗时较长
- 测试不会真正发布到 NPM 或创建 GitHub PR