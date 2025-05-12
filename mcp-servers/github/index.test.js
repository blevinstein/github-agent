import { describe, it, expect, beforeAll } from 'vitest';
import { MCPClient } from "mcp-client";

describe("GitHub MCP Server", () => {
  let client;

  beforeAll(async () => {
    // Create an MCP client and connect to the server using the configuration from mcp.json
    client = new MCPClient({ name: "github-mcp", version: "0.1.0" });
    await client.connect({
      name: "github-local",
      type: "stdio",
      command: "node",
      args: ["./mcp-servers/github/index.js"],
      env: {
        "GITHUB_APP_ID": "1264614",
        "GITHUB_APP_INSTALLATION_ID": "66550034",
        "GITHUB_APP_PRIVATE_KEY": "./blevinstein-github-agent.pem"
      }
    });
  });

  it("should list tools", async () => {
    const response = await client.getAllTools();
    console.dir(response, { depth: null });
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBeGreaterThan(0);
  });
}); 