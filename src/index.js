import * as core from '@actions/core';
import fs from 'fs';
import { generateChatCompletion, DEFAULT_SERVERS } from './openrouter.js';
import { MultiClient } from './mcp.js';
import Mustache from 'mustache';
import { Octokit } from 'octokit';
import { getGithubToken } from './github.js';

const FILE_PREFIX = 'file://';
const DEFAULT_SYSTEM_PROMPT =
    'You are a helpful coding assistant. Use the tools provided to you to complete the task given. '
    + 'Most tasks will involve updating a pull request or an issue in github.';

export function getInstructions(instructionsInput) {
  if (instructionsInput.startsWith(FILE_PREFIX)) {
    const filePath = instructionsInput.substring(FILE_PREFIX.length);
    return fs.readFileSync(filePath, 'utf8');
  }
  return instructionsInput;
}

async function main() {
  try {
    const model = core.getInput('model');
    const instructions = getInstructions(core.getInput('instructions'));
    const systemPromptInput = core.getInput('system_prompt');
    const systemPrompt = systemPromptInput ? getInstructions(systemPromptInput) : DEFAULT_SYSTEM_PROMPT;
    const treatReplyAsComment = core.getInput('treat_reply_as_comment') === 'true';

    // Gather event context from the GitHub Actions environment
    const githubEventPath = process.env.GITHUB_EVENT_PATH;
    let eventContext = {};
    if (githubEventPath && fs.existsSync(githubEventPath)) {
      const rawContext = fs.readFileSync(githubEventPath, 'utf8');
      core.debug('Got event context: ' + rawContext);
      eventContext = JSON.parse(rawContext);
    }
    core.debug('Event Context:');
    core.debug(JSON.stringify(eventContext, null, 2));

    // Render instructions with Mustache and event context
    const renderedInstructions = Mustache.render(instructions, eventContext);
    core.debug('Rendered Instructions:');
    core.debug(renderedInstructions);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: renderedInstructions },
    ];

    const mcpClient = await MultiClient.create(DEFAULT_SERVERS);
    const result = await generateChatCompletion({
      messages,
      model,
      mcpClient,
    });
    core.debug('LLM Result:');
    core.debug(JSON.stringify(result, null, 2));

    // If treat_reply_as_comment is true, post a comment on the triggering issue or PR
    if (treatReplyAsComment) {
      // Concatenate all non-tool assistant response messages
      const textResponse = (result.responseMessages || [])
        .filter(m => m.role === 'assistant' && m.content)
        .map(m => m.content)
        .join('\n');
      if (textResponse) {
        // Find issue/PR info from event context
        let issue_number, owner, repo;
        if (eventContext.issue) {
          issue_number = eventContext.issue.number;
          owner = eventContext.repository.owner.login;
          repo = eventContext.repository.name;
        } else if (eventContext.pull_request) {
          issue_number = eventContext.pull_request.number;
          owner = eventContext.repository.owner.login;
          repo = eventContext.repository.name;
        }
        if (issue_number && owner && repo) {
          const octokit = new Octokit({ auth: await getGithubToken() });
          await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body: textResponse,
          });
          core.info(`Posted agent response as comment to ${owner}/${repo}#${issue_number}`);
        } else {
          core.warning('Could not determine issue or PR number from event context; skipping comment.');
        }
      } else {
        core.info('No text response to post as comment.');
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

process.on('uncaughtException', (error) => core.error(error.message));
process.on('unhandledRejection', (error) => core.error(error.message));

main();
