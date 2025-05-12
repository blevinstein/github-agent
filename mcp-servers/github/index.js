#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "octokit";
import { getGithubToken } from "../../src/github.js";

const octokit = new Octokit({
  auth: await getGithubToken()
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
  },
  {
    name: "add_issue_comment",
    description: "Add a comment to a GitHub issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number" },
        body: { type: "string", description: "Comment body" }
      },
      required: ["owner", "repo", "issue_number", "body"]
    }
  },
  {
    name: "create_pull_request_review",
    description: "Create a review on a GitHub pull request",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        body: { type: "string", description: "Review body" },
        event: { type: "string", description: "Review event (APPROVE, REQUEST_CHANGES, or COMMENT)" }
      },
      required: ["owner", "repo", "pull_number", "body", "event"]
    }
  },
  {
    name: "create_pull_request",
    description: "Create a pull request from a branch (head) to a base branch.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        title: { type: "string", description: "Title of the pull request" },
        head: { type: "string", description: "The name of the branch where your changes are implemented (compare)" },
        base: { type: "string", description: "The name of the branch you want the changes pulled into (e.g., main)" },
        body: { type: "string", description: "Body of the pull request" },
        reviewers: { type: "array", items: { type: "string" }, description: "Usernames of reviewers to request" }
      },
      required: ["owner", "repo", "title", "head", "base"]
    }
  },
  {
    name: "update_issue",
    description: "Update a GitHub issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number" },
        labels: { type: "array", items: { type: "string" }, description: "Labels to set on the issue" },
        assignees: { type: "array", items: { type: "string" }, description: "Usernames of assignees for the issue" },
        title: { type: "string", description: "New title for the issue" },
        body: { type: "string", description: "New body for the issue" },
        state: { type: "string", description: "State (open or closed)" }
      },
      required: ["owner", "repo", "issue_number"]
    }
  },
  {
    name: "close_pull_request",
    description: "Close a pull request by number.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" }
      },
      required: ["owner", "repo", "pull_number"]
    }
  },
  {
    name: "merge_pull_request",
    description: "Merge a pull request by number.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        commit_title: { type: "string", description: "Title for the merge commit" },
        commit_message: { type: "string", description: "Message for the merge commit" },
        merge_method: { type: "string", description: "Merge method (merge, squash, rebase)" }
      },
      required: ["owner", "repo", "pull_number"]
    }
  },
  {
    name: "update_pull_request",
    description: "Update a pull request",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        title: { type: "string", description: "New title for the PR" },
        body: { type: "string", description: "New body for the PR" },
        state: { type: "string", description: "State (open or closed)" },
        base: { type: "string", description: "Change the base branch (the destination that these changes will be merged to)" },
        labels: { type: "array", items: { type: "string" }, description: "Labels to set on the PR" },
        assignees: { type: "array", items: { type: "string" }, description: "Usernames of assignees for the PR" },
        reviewers: { type: "array", items: { type: "string" }, description: "Usernames of reviewers to request" }
      },
      required: ["owner", "repo", "pull_number"]
    }
  },
  {
    name: "create_issue",
    description: "Create a new GitHub issue.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        title: { type: "string", description: "Title of the issue" },
        body: { type: "string", description: "Body of the issue" },
        assignees: { type: "array", items: { type: "string" }, description: "Usernames of assignees for the issue" },
        labels: { type: "array", items: { type: "string" }, description: "Labels to set on the issue" }
      },
      required: ["owner", "repo", "title"]
    }
  }
];

// Tool handlers
async function handleGetIssue(args) {
  const { owner, repo, issue_number } = args;
  // Fetch issue details and comments in parallel
  const [issueResponse, commentsResponse] = await Promise.all([
    octokit.rest.issues.get({ owner, repo, issue_number }),
    octokit.rest.issues.listComments({ owner, repo, issue_number })
  ]);
  // Combine data
  const combined = {
    ...issueResponse.data,
    comments_thread: commentsResponse.data
  };
  return {
    content: [{
      type: "text",
      text: JSON.stringify(combined, null, 2)
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

async function handleAddIssueComment(args) {
  const { owner, repo, issue_number, body } = args;
  const response = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body
  });
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}

async function handleCreatePullRequestReview(args) {
  const { owner, repo, pull_number, body, event } = args;
  const response = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number,
    body,
    event
  });
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}

async function handleCreatePullRequest(args) {
  const { owner, repo, title, head, base, body, reviewers } = args;
  const results = [];
  const response = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body
  });
  results.push({ type: "pull_request", result: response.data });
  const labelResult = await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: response.data.number,
    labels: ['github-agent']
  });
  results.push({ type: "labels", result: labelResult.data });
  if (reviewers && reviewers.length) {
    const reviewersResult = await octokit.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: response.data.number,
      reviewers
    });
    results.push({ type: "reviewers", result: reviewersResult.data });
  }
  return {
    content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
  };
}

async function handleUpdateIssue(args) {
  const { owner, repo, issue_number, labels, assignees, title, body, state } = args;
  const response = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number,
    ...(labels ? { labels } : {}),
    ...(assignees ? { assignees } : {}),
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
    ...(state ? { state } : {})
  });
  return {
    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
  };
}

async function handleClosePullRequest(args) {
  const { owner, repo, pull_number } = args;
  const response = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number,
    state: "closed"
  });
  return {
    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
  };
}

async function handleMergePullRequest(args) {
  const { owner, repo, pull_number, commit_title, commit_message, merge_method } = args;
  const response = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number,
    ...(commit_title ? { commit_title } : {}),
    ...(commit_message ? { commit_message } : {}),
    ...(merge_method ? { merge_method } : {})
  });
  return {
    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
  };
}

async function handleUpdatePullRequest(args) {
  const { owner, repo, pull_number, title, body, state, base, labels, assignees, reviewers } = args;
  const results = [];
  // PR fields
  if (title || body || state || base) {
    const prResult = await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number,
      ...(title ? { title } : {}),
      ...(body ? { body } : {}),
      ...(state ? { state } : {}),
      ...(base ? { base } : {})
    });
    results.push({ type: "pull_request", result: prResult.data });
  }
  // Issue fields (labels/assignees)
  if ((labels && labels.length) || (assignees && assignees.length)) {
    const issueResult = await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: pull_number,
      ...(labels ? { labels } : {}),
      ...(assignees ? { assignees } : {})
    });
    results.push({ type: "issue", result: issueResult.data });
  }
  // Reviewers: synchronize to match the input list
  if (Array.isArray(reviewers)) {
    // Get current reviewers
    const pr = await octokit.rest.pulls.get({ owner, repo, pull_number });
    const currentReviewers = (pr.data.requested_reviewers || []).map(r => r.login);
    const reviewersToAdd = reviewers.filter(r => !currentReviewers.includes(r));
    const reviewersToRemove = currentReviewers.filter(r => !reviewers.includes(r));
    if (reviewersToAdd.length > 0) {
      const addResult = await octokit.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number,
        reviewers: reviewersToAdd
      });
      results.push({ type: "add_reviewers", result: addResult.data });
    }
    if (reviewersToRemove.length > 0) {
      const removeResult = await octokit.rest.pulls.removeRequestedReviewers({
        owner,
        repo,
        pull_number,
        reviewers: reviewersToRemove
      });
      results.push({ type: "remove_reviewers", result: removeResult.data });
    }
  }
  return {
    content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
  };
}

async function handleCreateIssue(args) {
  const { owner, repo, title, body, assignees, labels } = args;
  const response = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    ...(body ? { body } : {}),
    ...(assignees ? { assignees } : {}),
    ...(labels ? { labels } : {})
  });
  return {
    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
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
      case "add_issue_comment":
        return await handleAddIssueComment(args);
      case "create_pull_request_review":
        return await handleCreatePullRequestReview(args);
      case "create_pull_request":
        return await handleCreatePullRequest(args);
      case "update_issue":
        return await handleUpdateIssue(args);
      case "close_pull_request":
        return await handleClosePullRequest(args);
      case "merge_pull_request":
        return await handleMergePullRequest(args);
      case "update_pull_request":
        return await handleUpdatePullRequest(args);
      case "create_issue":
        return await handleCreateIssue(args);
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