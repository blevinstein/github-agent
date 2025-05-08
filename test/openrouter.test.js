import { describe, it, expect } from 'vitest';
import { generateChatCompletion } from '../src/openrouter.js';
import { MultiClient } from '../src/mcp.js';

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

  it('can call a tool via mcpClient', async () => {
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
}); 