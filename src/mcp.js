import async from 'async';
import { MCPClient } from 'mcp-client';

export class MultiClient {
  constructor(servers) {
    this.servers = servers;
  }

  static async create(servers) {
    const client = new MultiClient(servers);
    await client.connect();
    return client;
  }

  async connect() {
    this.clients = await Promise.all(this.servers.map(async server => {
      const newClient = new MCPClient({ name: `github-agent-${server.name}`, version: '0.1.0' });
      await newClient.connect(server);
      return newClient;
    }));
  }

  async getAllTools() {
    return await async.flatMap(this.clients, async client => {
      const tools = await client.getAllTools();
      return tools;
    });
  }

  async callTool({ name, arguments: args }) {
    const server = await async.detect(this.clients,
        async client => (await client.getAllTools()).some(tool => tool.name === name));
    if (!server) throw Error(`Tool ${name} not found`);
    return await server.callTool({ name, arguments: args });
  }
}