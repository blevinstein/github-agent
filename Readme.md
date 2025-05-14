# Github Agent

## Setup

To use the Github Agent in your repository:

1. **Copy the sample workflow:**
   - Copy [agent.yaml](.github/workflows/agent.yaml) into your own repo.
   - Customize the workflow as needed (e.g., labels, instructions, model).

2. **Set up OpenRouter API Key:**
   - Go to your repository's **Settings > Secrets and variables > Actions**.
   - Add a new secret named `OPENROUTER_API_KEY` with your OpenRouter API key as the value.

3. **Enable GitHub Actions to create and approve pull requests:**
   - Go to your repository's **Settings > Actions > General**.
   - Under **Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.

4. **(Optional) Configure additional secrets or environment variables** as needed for your use case.

5. **Customize agent behavior:**
   - Edit the workflow YAML to change triggers, instructions, or models.
   - You can use mustache-style templating in the `instructions` field to reference GitHub event context.
   - **Add MCP servers:** Use the `mcp_servers` input to provide additional MCP tool servers.

   **Example:**
   ```yaml
   with:
     mcp_servers: |
       {
         "time": {
           "type": "stdio",
           "command": "docker",
           "args": ["run", "-i", "--rm", "mcp/time"]
         }
       }
   ```

---

## Warnings and Best Practices

**Warning:** The Github Agent may try to push to any branch in your repository, merge pull requests, delete issues, etc. If misconfigured or if the agent misbehaves, it could make unwanted changes.

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

- [ ] Integrate puppeteer to allow the agent to use a browser https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer
- [ ] Integrate docker to allow the agent to run local development containers https://github.com/ckreiling/mcp-server-docker
