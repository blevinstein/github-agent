import async from 'async';
import { MCPClient } from 'mcp-client';
import { getGithubToken } from './github.js';

export const DEFAULT_SERVERS = [
  {
    name: 'filesystem',
    type: 'stdio',
    command: 'npx',
    args: [ '-y', '@modelcontextprotocol/server-filesystem', process.cwd() ],
  },
  {
    name: 'git',
    type: 'stdio',
    command: 'npx',
    args: [ '-y', '@cyanheads/git-mcp-server' ],
  },
  {
    name: 'github',
    type: 'stdio',
    command: 'npx',
    args: [ '-y', 'blevinstein-github-agent' ],
    env: {
      'GITHUB_TOKEN': await getGithubToken(),
    }
  },
  {
    name: 'fetch',
    type: 'stdio',
    command: 'uvx',
    args: [ 'mcp-server-fetch' ],
  },
];

export class MultiClient {
  constructor(clients) {
    this.clients = clients;
  }

  static async create(servers, waitTime = 1000) {
    const clients = await Promise.all(servers.map(async server => {
      const newClient = new MCPClient({ name: server.name, version: '0.1.0' });
      await newClient.connect(server);
      return newClient;
    }));
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return new MultiClient(clients);
  }

  async getAllTools() {
    return await async.flatMap(this.clients, async client => {
      const tools = await client.getAllTools();
      return tools;
    });
  }

  async callTool({ name, arguments: args }) {
    // TODO: Optimize so that we don't call getAllTools() for each client every time
    const server = await async.detect(this.clients,
        async client => (await client.getAllTools()).some(tool => tool.name === name));
    if (!server) throw Error(`Tool ${name} not found`);
    return await server.callTool({ name, arguments: args });
  }
}