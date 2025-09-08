FROM node:20-alpine

# Install latest npm
RUN npm install -g npm@latest

# Install PromptX MCP Server (specific version)
ARG VERSION=latest
RUN npm install -g @promptx/mcp-server@${VERSION}

# Create data directory
RUN mkdir -p /root/.promptx

# Expose HTTP port
EXPOSE 5203

# Default to HTTP mode for Docker
CMD ["mcp-server", "--transport", "http", "--host", "0.0.0.0", "--port", "5203", "--cors"]