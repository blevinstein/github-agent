
import { describe, it, expect } from 'vitest';
import { generateChatCompletion } from '../src/openrouter.js';

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
}); 