import * as core from '@actions/core';
import fs from 'fs';
import { generateChatCompletion } from './openrouter.js';
import { MultiClient, DEFAULT_SERVERS } from './mcp.js';
import Mustache from 'mustache';
import { Octokit } from 'octokit';
import { getGithubToken } from './github.js';

import DEFAULT_SYSTEM_PROMPT from '../prompt/default.js';

const FILE_PREFIX = 'file://';

export function getInstructions(instructionsInput) {
  if (instructionsInput.startsWith(FILE_PREFIX)) {
    const filePath = instructionsInput.substring(FILE_PREFIX.length);
    return fs.readFileSync(filePath, 'utf8');
  }
  return instructionsInput;
}

async function updateLabels({ owner, repo, issue_number, add = [], remove = [] }) {
  if (!owner || !repo || !issue_number) return;
  const octokit = new Octokit({ auth: await getGithubToken() });
  // Remove labels
  for (const label of remove) {
    try {
      await octokit.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
      core.info(`Removed label '${label}' from ${owner}/${repo}#${issue_number}`);
    } catch (e) {
      // Ignore if label does not exist
      core.debug(`Could not remove label '${label}': ${e.message}`);
    }
  }
  // Add labels (can add multiple at once)
  if (add.length > 0) {
    try {
      await octokit.rest.issues.addLabels({ owner, repo, issue_number, labels: add });
      core.info(`Added labels [${add.join(', ')}] to ${owner}/${repo}#${issue_number}`);
    } catch (e) {
      core.warning(`Could not add labels [${add.join(', ')}]: ${e.message}`);
    }
  }
}

async function main() {
  const model = core.getInput('model');
  const instructions = getInstructions(core.getInput('instructions'));
  const systemPromptInput = core.getInput('system_prompt');
  const systemPrompt = systemPromptInput ? getInstructions(systemPromptInput) : DEFAULT_SYSTEM_PROMPT;
  const logActionsToIssue = core.getInput('log_actions_to_issue') === 'true';
  const mcpStartupTimeout = core.getInput('mcp_startup_timeout') || 10_000;

  // Support additional MCP servers via input
  let mcpServers = DEFAULT_SERVERS;
  const mcpServersInput = core.getInput('mcp_servers');
  if (mcpServersInput) {
    const userServers = Object.entries(JSON.parse(mcpServersInput))
        .map(([name, config]) => ({
          name,
          // TODO: Add support for sse type MCP servers
          type: config.url ? 'http' : 'stdio',
          ...config
        }));
    mcpServers = [ ...DEFAULT_SERVERS, ...userServers ];
  }

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

  try {
    // Render instructions with Mustache and event context
    const renderedInstructions = Mustache.render(instructions, eventContext);
    core.debug('Rendered Instructions:');
    core.debug(renderedInstructions);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: renderedInstructions },
    ];

    core.debug('Creating MCP client');
    const mcpClient = await MultiClient.create(mcpServers, mcpStartupTimeout);

    core.debug('Generating chat completion:');
    core.debug(JSON.stringify(messages, null, 2));
    const result = await generateChatCompletion({
      messages,
      model,
      mcpClient,
      logger: core,
    });
    core.debug('LLM Result:');
    core.debug(JSON.stringify(result, null, 2));

    // If log_actions_to_issue is true, post a comment on the triggering issue or PR
    if (logActionsToIssue) {
      // Format all response messages into a readable conversation
      const textResponse = (result.responseMessages || [])
        .map(m => {
          if (m.role === 'assistant' && m.content) {
            return `🤖 Assistant: ${m.content}`;
          } else if (m.role === 'tool') {
            return `🛠️ Tool (${m.name}): ${m.content}`;
          } else if (m.role === 'user') {
            return `👤 User: ${m.content}`;
          }
        })
        .filter(Boolean)
        .join('\n\n');
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

    // After success, handle label changes
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
      // Parse comma-separated label lists
      const addLabels = (core.getInput('add_label_on_success') || '').split(',').map(l => l.trim()).filter(Boolean);
      const removeLabels = (core.getInput('remove_label_on_success') || '').split(',').map(l => l.trim()).filter(Boolean);
      await updateLabels({ owner, repo, issue_number, add: addLabels, remove: removeLabels });
    }
    process.exit(0);
  } catch (error) {
    core.setFailed(error.message);
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
      const addLabels = (core.getInput('add_label_on_error') || '').split(',').map(l => l.trim()).filter(Boolean);
      const removeLabels = (core.getInput('remove_label_on_error') || '').split(',').map(l => l.trim()).filter(Boolean);
      await updateLabels({ owner, repo, issue_number, add: addLabels, remove: removeLabels });
    }
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => core.error(error.message));
process.on('unhandledRejection', (error) => core.error(error.message));

main();
