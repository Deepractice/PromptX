FROM node:20-alpine

# 元数据标签
LABEL maintainer="Deepractice" \
      description="PromptX MCP Server" \
      org.opencontainers.image.source="https://github.com/Deepractice/PromptX"

# 创建非 root 用户
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

# 工作目录
WORKDIR /app

# 版本参数
ARG VERSION=latest

# 安装依赖（单层 RUN 减少镜像层数）
RUN npm install -g npm@latest @promptx/mcp-server@${VERSION} && \
    mkdir -p /data && \
    chown -R app:app /data /app

# 切换到非 root 用户
USER app

# 暴露端口
EXPOSE 5203

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5203/health || exit 1

# 启动命令
CMD ["mcp-server", "--transport", "http", "--host", "0.0.0.0", "--port", "5203", "--cors"]