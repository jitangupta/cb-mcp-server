import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "content-board",
  version: "1.0.0",
});

server.tool("ping", "Health check — returns pong", {}, async () => {
  return {
    content: [{ type: "text", text: "pong" }],
  };
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
