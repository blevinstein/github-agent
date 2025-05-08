#!/usr/bin/env node

// Simple script to run the Github Agent with specified instructions/tools
// Usage: node scripts/run-agent.js --instructions "..." --tools "..." --model "..."

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { generateChatCompletion, DEFAULT_SERVERS } from '../src/openrouter.js';
import { MultiClient } from '../src/mcp.js';

import dotenv from 'dotenv';
dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option('instructions', {
    type: 'string',
    describe: 'Instructions for the agent',
    demandOption: true,
  })
  .option('tools', {
    type: 'string',
    describe: 'Comma-separated list of tools to enable',
  })
  .option('model', {
    type: 'string',
    describe: 'Model to use for LLM completions',
  })
  .help()
  .argv;

console.log('Running Github Agent with:');
console.log('Instructions:', argv.instructions);
console.log('Tools:', argv.tools);
console.log('Model:', argv.model);

(async () => {
  const messages = [
    { role: 'user', content: argv.instructions }
  ];
  const mcpClient = await MultiClient.create([
    ...DEFAULT_SERVERS,
    {
      name: 'time',
      type: 'stdio',
      command: 'docker',
      args: ["run", "-i", "--rm", "mcp/time"]
    }
  ]);
  const result = await generateChatCompletion({
    messages,
    model: argv.model,
    mcpClient,
  });
  console.log('LLM Result:');
  console.dir(result, { depth: null });
})(); 