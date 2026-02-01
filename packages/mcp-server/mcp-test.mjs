import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({
  name: "test-client",
  version: "1.0.0"
});

const transport = new StdioClientTransport({
  command: "node",
  args: ["./dist/index.js"],
  env: { ...process.env, MCP_TRANSPORT: "stdio" }
});

async function main() {
  try {
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    
    console.log("\n1. Server info...");
    const init = await client.listTools();
    console.log("Server ready!");
    
    console.log("\n2. List tools...");
    const tools = await client.listTools();
    console.log("Found", tools.tools.length, "tools");
    tools.tools.slice(0, 5).forEach((t) => {
      console.log("  -", t.name, ":", t.description?.substring(0, 60));
    });
    if (tools.tools.length > 5) {
      console.log("  ... and", tools.tools.length - 5, "more");
    }
    
    await client.close();
    console.log("\n✅ MCP server connection test successful!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
