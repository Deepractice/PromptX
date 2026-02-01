FROM node:20-alpine

WORKDIR /app

RUN ln -s /usr/local/lib/node_modules/@promptx/mcp-server /app/server

ENV MCP_TRANSPORT=sse

ENTRYPOINT ["node", "/app/server/dist/index.js"]
