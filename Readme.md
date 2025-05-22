# Github Agent

**Automate your GitHub workflows using natural language.**

Github Agent lets you write *human language instructions*—not shell scripts—to automate your repository. Just add the `blevinstein/github-agent` GitHub Action to your workflow, and the agent will use AI to:
- Write and edit code
- Commit changes to git
- Create or update pull requests and issues
- Respond to comments
- Run custom tools (MCP servers)

By default, the agent can access your repo's filesystem, git, and GitHub API. You can easily extend it with other tools (see below).

---

## Why use Github Agent?

- **No scripting required:** Describe what you want in plain English. The agent figures out the steps.
- **Flexible automation:** Automate bug fixes, code reviews, documentation, and more—using natural language.
- **Context-aware:** Reference GitHub event data (issue/PR details, comments, etc.) in your instructions using mustachejs syntax.
- **Extensible:** Add custom MCP tools (e.g., Wikipedia lookup, browser automation, Docker) to expand the agent's capabilities.

---

## Quick Start

### 1. Add the Github Agent to your workflow

Create (or edit) a workflow file (see [agent.yaml](.github/workflows/agent.yaml) for some examples)

```yaml
on:
  pull_request:
    types: [opened]
jobs:
  my_agent_job:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    env:
      OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Github Agent: Review PR
        uses: blevinstein/github-agent@v1
        with:
          instructions: |
            Please review the code in pull request {{pull_request.number}} and suggest improvements.
          model: anthropic/claude-3.7-sonnet
```

- **Write instructions** inline, or use a file from your repo like so: `instructions: file://path/to/agent-instructions.md`
- **Reference GitHub context** using mustachejs syntax.
- **Add Custom MCP tools** as needed for additional capabilities.

### 2. Set up OpenRouter API Key:
   - Go to your repository's **Settings > Secrets and variables > Actions**.
   - Add a new secret named `OPENROUTER_API_KEY` with your OpenRouter API key as the value.

### 3. (Optional) Enable GitHub Actions to create and approve pull requests:
   - This is only needed if you want the agent to create or approve PRs.
   - Go to your repository's **Settings > Actions > General**.
   - Under **Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.

---

## Warnings and Best Practices

**Warning:** The Github Agent may try to push to any branch in your repository, merge pull requests, delete issues, etc. If something is misconfigured or if the agent misbehaves, it could make unwanted changes.

**Best Practices:**
- **Enable branch protection rules** for important branches (e.g., `main`, release branches).
  - Require pull requests before merging.
  - Restrict who can push directly to protected branches.
  - Require status checks and/or code reviews before merging.
- **Review and limit the agent's permissions** as appropriate for your workflow.
- **Test the agent in a fork or test repository** before deploying to production.
- **Monitor the agent's activity** using GitHub's audit logs and PR history.

---

## Backlog

- [X] Integrate puppeteer to allow the agent to use a browser https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer
- [ ] Enable Brave search via MCP for information retrieval https://github.com/modelcontextprotocol/servers/blob/main/src/brave-search/README.md
- [ ] Integrate docker to allow the agent to run local development containers https://github.com/ckreiling/mcp-server-docker
- [ ] Add setting `rules_path` which allows a user to configure `.cursor/rules/*` or `.github/copilot-instructions.md` etc, to include additional LLM instructions from their repo. Handle cursor mdc headers.
- [ ] Add ability to include other files in instruction templates

