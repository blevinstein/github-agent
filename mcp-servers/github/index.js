#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "octokit";

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});

process.on('exit', (code) => {
  console.error(`[INFO] Process exiting with code ${code}`);
});

const GITHUB_TOOLS = [
  {
    name: "get_issue",
    description: "Get information about a GitHub issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner"
        },
        repo: {
          type: "string",
          description: "Repository name"
        },
        issue_number: {
          type: "number",
          description: "Issue number"
        }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "get_pull_request",
    description: "Get information about a GitHub pull request",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner"
        },
        repo: {
          type: "string",
          description: "Repository name"
        },
        pull_number: {
          type: "number",
          description: "Pull request number"
        }
      },
      required: ["owner", "repo", "pull_number"]
    }
  }
];

// Tool handlers
async function handleGetIssue(args) {
  const { owner, repo, issue_number } = args;
  const response = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number
  });
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}

async function handleGetPullRequest(args) {
  const { owner, repo, pull_number } = args;
  // Fetch PR details and reviews in parallel
  const [prResponse, reviewsResponse] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number }),
    octokit.rest.pulls.listReviews({ owner, repo, pull_number })
  ]);
  // Combine data
  const combined = {
    ...prResponse.data,
    reviews: reviewsResponse.data
  };
  return {
    content: [{
      type: "text",
      text: JSON.stringify(combined, null, 2)
    }]
  };
}

const server = new Server(
  {
    name: "github-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[INFO] Listing tools');
  return { tools: GITHUB_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`[INFO] Calling tool ${request.params.name}`);
  const toolName = request.params.name;
  const args = request.params.arguments;

  try {
    switch (toolName) {
      case "get_issue":
        return await handleGetIssue(args);
      case "get_pull_request":
        return await handleGetPullRequest(args);
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[INFO] Github MCP server started on stdio')
  } catch (error) {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});