# PromptX Docker

Quick deployment of PromptX MCP Server using Docker.

## Quick Start

### Using Docker Hub Image (Recommended)
```bash
# Pull and run from Docker Hub
docker run -d \
  -p 5203:5203 \
  -v $(pwd)/.promptx:/root/.promptx \
  --name promptx \
  deepracticexs/promptx:latest
```

### Using Docker Compose
```bash
cd docker
docker-compose up -d
```

### Build from Source
```bash
# Build image locally
docker build -t deepracticexs/promptx -f docker/Dockerfile .

# Run container
docker run -d \
  -p 5203:5203 \
  -v $(pwd)/.promptx:/root/.promptx \
  --name promptx \
  deepracticexs/promptx
```

## Configuration

The MCP server runs in HTTP mode by default on port 5203 with CORS enabled.

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "promptx": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:5203/mcp"
    }
  }
}
```

## Data Persistence

PromptX data is stored in `./.promptx` directory next to `docker-compose.yml` by default.
This includes:
- User roles
- Memory data
- Configuration files

You can customize the data location using the `PROMPTX_DATA` environment variable:
```bash
# Use custom data directory
PROMPTX_DATA=/path/to/data docker-compose up -d

# Or export it
export PROMPTX_DATA=/home/user/.promptx
docker-compose up -d
```

## Environment Variables

- `PROMPTX_DATA`: Custom data directory path (default: `./.promptx`)
- `NODE_ENV`: Set to `production` by default
- Port: 5203 (exposed)

## Notes

- The container runs as root user
- Data is persisted in local `.promptx` folder
- CORS is enabled for web access