# Github Agent

## Goal

Enable LLM workflows that run in response to Github events, such as Issues, or comments on a PR.

## Todo List

- [x] Write a simple script for running the agent with specified instructions/tools
- [x] Integrate openrouter for generating LLM completions
- [x] Connect openrouter to mcp-client, fetch list of tools and facilitate tool calls
- [x] Define and document agentRules.json format
  - [x] Trigger definition
  - [x] Action definition (specify instructions, model, tools, etc)
  - [x] Integrate mustache.js for instruction template rendering
  - [x] Allow file:// syntax for instructions field in agentsRule.json
- [x] Create a sample workflow for triggering the agent (pass along github.event, github.ref_name, github.ref_type to the agent code)
- [x] Write code for evaluating github events against agentRules and executing the agent with the right instructions/tools
- [x] Integrate git & filesystem to allow the agent to write code and commit (https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem, https://github.com/modelcontextprotocol/servers/tree/main/src/git)
- [x] Implement a custom MCP using octokit to allow the agent to update issues and send PRs
  - [x] get_issue
  - [x] get_pull_request
  - [x] get_pull_request_reviews
  - [x] make sure the agent can get information about an issue
  - [x] make sure the agent can get information about a PR
  - [x] add_issue_comment
  - [x] create_pull_request_review
  - [x] create_pull_request
  - [x] make sure the agent can push code to a new branch and create a PR
  - [x] update_issue
  - [x] make sure the agent can close a fixed issue
  - [x] make sure the agent can close a PR
  - [x] make sure the agent can merge an approved PR
  - [x] make sure the agent can review a PR
  - [x] make sure the agent can update a PR in response to comments (both new commits, and changing title/description/assignee/etc)
- [ ] Deploy to github as an action so that other repos can reference it
- [ ] Add system prompt for directing behavior of the agent

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
