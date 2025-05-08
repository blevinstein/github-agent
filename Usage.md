# Usage: github-agent GitHub Action

## Overview

The `github-agent` action enables LLM workflows in response to GitHub events, such as issues or pull requests. You configure all triggering and filtering using standard GitHub Actions workflow syntax. The action itself is focused on running the agent with your specified instructions and model.

## Example: Auto-fix on 'fixme' Issue

```yaml
name: Auto-fix on 'fixme' issue

on:
  issues:
    types: [opened, labeled]

jobs:
  fixme:
    if: contains(github.event.issue.labels.*.name, 'fixme')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run github-agent
        uses: my-org/github-agent@v1
        with:
          instructions: file://fix-issue.md
          model: anthropic/claude-3.7-sonnet
```

## Example: Review PRs Labeled 'reviewme'

```yaml
name: Review PRs labeled 'reviewme'

on:
  pull_request:
    types: [opened, labeled, synchronize]

jobs:
  review:
    if: contains(github.event.pull_request.labels.*.name, 'reviewme')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run github-agent
        uses: my-org/github-agent@v1
        with:
          instructions: |
            Review the following pull request and leave comments or request changes as needed.

            PR title: {{pull_request.title}}
            PR body: {{pull_request.body}}
          model: google/gemini-2.0-flash-001
```

## Inputs

| Name         | Description                                               | Example                        |
|--------------|-----------------------------------------------------------|--------------------------------|
| instructions | Path to a file (e.g., `file://fix-issue.txt`) or inline string with instructions. If a `file://` path is provided, the action will load the contents of that file as the instructions. Supports mustache.js templating with event context (e.g., `{{issue.title}}`). | `file://fix-issue.md` |
| model        | LLM model to use.                                         | `anthropic/claude-3.7-sonnet`  |

## Mustache Templating

The `instructions` input supports [mustache.js](https://github.com/janl/mustache.js) templating. You can reference event context such as `{{issue.title}}`, `{{pull_request.body}}`, etc.

## Notes
- All triggering and filtering is handled by standard GitHub Actions workflow syntax.
- The action always provides local git and filesystem tools to the agent.
- This approach is simple, powerful, and familiar to GitHub users. 