# Github Agent

## Goal

Enable LLM workflows that run in response to Github events, such as Issues, or comments on a PR.

## Todo List

- [x] Write a simple script for running the agent with specified instructions/tools
- [x] Integrate openrouter for generating LLM completions
- [x] Connect openrouter to mcp-client, fetch list of tools and facilitate tool calls
- [ ] Define and document agentRules.json format
  - [ ] Trigger definition
  - [ ] Action definition (specify instructions, model, tools, etc)
- [ ] Write code for evaluating github events against agentRules and executing the agent with the right instructions/tools
- [ ] Integrate git & filesystem to allow the agent to write code and commit (https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem, https://github.com/modelcontextprotocol/servers/tree/main/src/git)
- [ ] Integrate octokit to allow the agent to update issues and send PRs; expose only create_issue, create_pull_request, create_branch, update_issue, add_issue_comment, create_pull_request_review, get_pull_request, get_pull_request_reviews (as defined in https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [ ] Deploy to github as an action so that other repos can reference it
- [ ] Create a sample workflow for triggering the agent

## Backlog

- [ ] Integrate puppeteer to allow the agent to use a browser https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer
- [ ] Integrate docker to allow the agent to run local development containers https://github.com/ckreiling/mcp-server-docker
- [ ] Allow github-agent end users to configure additional MCP tools to be made available to the LLM

## Typical use cases

- When a user files an issue labeled with `fixme`, the LLM writes and send a PR fixing the issue
- When a PR labeled with `reviewme` is opened/updated, the LLM checks out the code, may choose to run tests or other programmatic validations, and may submit a review (Comment/Approve/Request changes) or leave comments on the code
- When an LLM-created PR receives comments from a user, the LLM may choose to update the PR and/or respond to the comments

## Basic implementation plan

Github event trigger --> LLM agent with MCP servers --> Github outputs (PR or issue created/updated)

This basic action should be packaged up into a github action which could be imported by any github repo.

We will use a configuration file `.github/agentRules.json` to define the rules for triggering our agent; this will be customized by each user of the github action, specifying what github actions/labels they want to trigger on.

Each user will configure a workflow file `.github/workflows/agent.yaml` that will call the agent code in case of certain github events (although, if none of the rules specified in `agentRules.json` is triggered, nothing will happen)

## Libraries to use

MCP client https://github.com/punkpeye/mcp-client (used for coordinating all the other MCP servers, making them accessible to the LLM)

OpenRouter REST API https://openrouter.ai/docs/api-reference/overview (we will figure out which models work best with this workflow; claude 3.7 sonnet, o3, and o4-mini are likely contenders)

Octokit https://github.com/octokit/octokit.js (for github interactions)
