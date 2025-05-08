import { MCPClient } from 'mcp-client';

const SERVERS = [
  { type: 'stdio', command: 'npx', args: [ '-y', '@modelcontextprotocol/server-filesystem' ] },
  { type: 'stdio', command: 'uvx', args: [ 'mcp-server-git' ] },
  { type: 'stdio', command: 'uvx', args: [ 'mcp-server-time' ] },
];

let client;

export async function getMcpClient() {
  if (!client) {
    client = new MCPClient({ name: 'github-agent', version: '0.1.0' });
    // Connect to all servers
    for (const server of SERVERS) {
      await client.connect(server);
    }
  }
  return client;
}