import { describe, it, expect } from 'vitest';
import { generateChatCompletion } from '../src/openrouter.js';
import { MultiClient } from '../src/mcp.js';
import process from 'process';

import dotenv from 'dotenv';
dotenv.config();

describe('generateChatCompletion (integration)', () => {
  it('returns a reply from the OpenRouter API', async () => {
    const result = await generateChatCompletion({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'google/gemini-2.0-flash-001',
      tools: undefined,
      temperature: 0.7,
      toolChoice: undefined,
      toolCallbacks: {}
    });

    expect(result.responseMessages.length).toBeGreaterThan(0);
  });

  it('can use the filesystem', async () => {
    const mcpClient = await MultiClient.create([
      { name: 'filesystem', type: 'stdio', command: 'npx', args: [ '-y', '@modelcontextprotocol/server-filesystem', '.' ] },
    ]);
    const messages = [
      { role: 'user', content: 'What folders can you edit?' }
    ];
    const result = await generateChatCompletion({
      messages,
      model: 'google/gemini-2.0-flash-001',
      mcpClient,
      temperature: 1.0,
    });
    // Should see a tool call in the response messages
    const toolCallMessage = result.responseMessages.find(
      m => m.role === 'tool' || (m.tool_call_id && m.content)
    );
    expect(toolCallMessage).toBeDefined();
  });

  it('can use git', async () => {
    const mcpClient = await MultiClient.create([
      {
        name: 'git',
        type: 'stdio',
        command: 'docker',
        args: [
          'run',
          '--rm',
          '-i',
          '--mount',
          `type=bind,src=${process.cwd()},dst=/workspace`,
          'mcp/git'
        ]},
    ]);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const messages = [
      { role: 'user', content: `What is the current git status of the repo at /workspace?` }
    ];
    const result = await generateChatCompletion({
      messages,
      model: 'google/gemini-2.0-flash-001',
      mcpClient,
      temperature: 1.0,
    });
    console.log(JSON.stringify(result, null, 2));
    // Should see a tool call in the response messages
    const toolCallMessage = result.responseMessages.find(
      m => m.role === 'tool' || (m.tool_call_id && m.content)
    );
    expect(toolCallMessage).toBeDefined();
  })
}); 