#!/usr/bin/env node

// Simple script to run the Github Agent with specified instructions/tools
// Usage: node scripts/run-agent.js --instructions "..." --tools "..." --model "..."

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('instructions', {
    type: 'string',
    describe: 'Instructions for the agent',
    demandOption: true,
  })
  .option('tools', {
    type: 'string',
    describe: 'Comma-separated list of tools to enable',
    demandOption: true,
  })
  .option('model', {
    type: 'string',
    describe: 'Model to use for LLM completions',
    demandOption: true,
  })
  .help()
  .argv;

console.log('Running Github Agent with:');
console.log('Instructions:', argv.instructions);
console.log('Tools:', argv.tools);
console.log('Model:', argv.model);
// TODO: Initialize agent and run with specified instructions/tools/model 