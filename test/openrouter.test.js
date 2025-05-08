import { describe, it, expect } from 'vitest';
import { generateChatCompletion, DEFAULT_SERVERS } from '../src/openrouter.js';
import { MultiClient } from '../src/mcp.js';

import dotenv from 'dotenv';
dotenv.config();

describe('generateChatCompletion (integration)', () => {
  it('returns a reply from the OpenRouter API', async () => {
    const result = await generateChatCompletion({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'google/gemini-2.0-flash-001',
    });

    expect(result.responseMessages.length).toBeGreaterThan(0);
  });

  it('can use the filesystem', async () => {
    const mcpClient = await MultiClient.create(DEFAULT_SERVERS);
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
    const mcpClient = await MultiClient.create(DEFAULT_SERVERS);
    const messages = [
      { role: 'user', content: `What is the current git status of the repo at /workspace?` }
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
  })
}); 