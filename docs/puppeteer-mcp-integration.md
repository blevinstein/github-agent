# Puppeteer MCP Integration

This document provides instructions on how to integrate the Puppeteer MCP server into the GitHub Agent workflow.

## What is Puppeteer MCP?

Puppeteer MCP is a Model Context Protocol server that allows AI agents to control a web browser. It provides the following capabilities:

- Navigate to URLs
- Take screenshots
- Click elements
- Fill forms
- Execute JavaScript
- And more

## Adding Puppeteer MCP to GitHub Action Workflow

To add the Puppeteer MCP server to the GitHub Agent workflow, follow these steps:

1. **Update package.json** to include the dependency:

```json
"@modelcontextprotocol/server-puppeteer": "^1.0.0"
```

2. **Add Chrome installation steps** to the workflow:

```yaml
- name: Install chrome
  id: setup-chrome
  uses: browser-actions/setup-chrome@v1
  with:
    chrome-version: 136

- name: Install browsers with Puppeteer
  run: |
    echo "CHROME_BIN=${{ steps.setup-chrome.outputs.chrome-path }}" >> $GITHUB_ENV
    npx @puppeteer/browsers install chrome-headless-shell@136
    npx @puppeteer/browsers install firefox
```

3. **Add Puppeteer to the npm dependencies**:

```yaml
- name: Prefetch npx dependencies
  run: |
    npm install -g blevinstein-github-agent @modelcontextprotocol/server-filesystem @cyanheads/git-mcp-server @modelcontextprotocol/server-puppeteer
```

4. **Add the Puppeteer MCP server** to the `mcp_servers` configuration:

```yaml
mcp_servers: |
  {
    "wikipedia-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/wikipedia-mcp"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
```

## Using Puppeteer MCP in the agent

Once integrated, the agent can use the following functions:

- `puppeteer_navigate`: Navigate to a URL
- `puppeteer_screenshot`: Take a screenshot
- `puppeteer_click`: Click an element
- `puppeteer_fill`: Fill a form field
- `puppeteer_evaluate`: Run JavaScript in the browser
- `puppeteer_hover`: Hover over an element
- `puppeteer_select`: Select an option in a dropdown

Example usage:

```
puppeteer_navigate(url="https://example.com")
puppeteer_screenshot(name="homepage")
puppeteer_click(selector="#login-button")
puppeteer_fill(selector="#username", value="test_user")
```

For more information, see the [official MCP Puppeteer documentation](https://www.npmjs.com/package/@modelcontextprotocol/server-puppeteer).