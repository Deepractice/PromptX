import { spawn } from "child_process";

const proc = spawn("node", ["./dist/mcp-server.js"], {
  cwd: "/home/eouzoe/PromptX/packages/mcp-server",
  env: { ...process.env, MCP_TRANSPORT: "stdio" },
  stdio: ["pipe", "pipe", "pipe"]
});

let output = "";
proc.stderr.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
});

proc.stdout.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

// 等待一會讓 server 啟動
setTimeout(() => {
  console.log("\n\n--- Sending initialize request ---");
  
  const initRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  }) + "\n";
  
  proc.stdin.write(initRequest);
  console.log("Sent:", initRequest);
  
  setTimeout(() => {
    const listRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    }) + "\n";
    
    proc.stdin.write(listRequest);
    console.log("Sent:", listRequest);
    
    setTimeout(() => {
      proc.kill();
      console.log("\n\n--- Test complete ---");
    }, 2000);
  }, 2000);
}, 2000);
