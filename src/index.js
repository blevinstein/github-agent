import * as core from '@actions/core';
import fs from 'fs';
import { generateChatCompletion, DEFAULT_SERVERS } from './openrouter.js';
import { MultiClient } from './mcp.js';
import Mustache from 'mustache';

const FILE_PREFIX = 'file://';

async function main() {
  try {
    const instructionsInput = core.getInput('instructions', { required: true });
    const model = core.getInput('model', { required: true });

    let instructions = instructionsInput;
    if (instructionsInput.startsWith(FILE_PREFIX)) {
      const filePath = instructionsInput.substring(FILE_PREFIX.length);
      instructions = fs.readFileSync(filePath, 'utf8');
    }

    // Gather event context from the GitHub Actions environment
    const githubEventPath = process.env.GITHUB_EVENT_PATH;
    let eventContext = {};
    if (githubEventPath && fs.existsSync(githubEventPath)) {
      eventContext = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));
    }
    core.debug('Event Context:');
    core.debug(JSON.stringify(eventContext, null, 2));

    // Render instructions with Mustache and event context
    const renderedInstructions = Mustache.render(instructions, eventContext);
    core.debug('Rendered Instructions:');
    core.debug(renderedInstructions);

    // TODO: Remove this
    return;
    // DEBUG

    const messages = [
      { role: 'user', content: renderedInstructions }
    ];
    const mcpClient = await MultiClient.create(DEFAULT_SERVERS);
    const result = await generateChatCompletion({
      messages,
      model,
      mcpClient,
    });
    core.debug('LLM Result:');
    core.debug(JSON.stringify(result, null, 2));
    // Optionally set outputs here
    // core.setOutput('reply', result.reply);
  } catch (error) {
    core.setFailed(error.message);
  }
}

process.on('uncaughtException', (error) => core.error(error.message));
process.on('unhandledRejection', (error) => core.error(error.message));

main(); 