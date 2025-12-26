# Retool MCP Server

An MCP (Model Context Protocol) server for interacting with self-hosted Retool instances. This allows AI assistants like Claude to create apps, manage workflows, users, and resources in Retool.

## Features

- **Apps Management**: Create, list, delete apps and create releases
- **Folders**: Organize apps into folders
- **Workflows**: List and trigger Retool workflows
- **Resources**: View database connections, APIs, and other resources
- **Users**: Create, list, and manage users
- **Groups**: Manage permission groups
- **Audit Logs**: Access organization audit logs

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

```bash
export RETOOL_URL="https://your-retool-instance.com"
export RETOOL_API_KEY="your-api-key"
```

### Getting an API Key

1. Go to your Retool instance
2. Navigate to Settings > API
3. Create a new API token with appropriate permissions

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "retool": {
      "command": "node",
      "args": ["/path/to/retool-mcp/dist/index.js"],
      "env": {
        "RETOOL_URL": "https://your-retool-instance.com",
        "RETOOL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `retool_list_apps` | List all apps |
| `retool_get_app` | Get app details |
| `retool_create_app` | Create a new app |
| `retool_delete_app` | Delete an app |
| `retool_create_app_release` | Create app release/version |
| `retool_list_folders` | List all folders |
| `retool_create_folder` | Create a folder |
| `retool_list_workflows` | List all workflows |
| `retool_trigger_workflow` | Trigger a workflow |
| `retool_list_resources` | List all resources |
| `retool_get_resource` | Get resource details |
| `retool_list_users` | List all users |
| `retool_get_user` | Get user details |
| `retool_create_user` | Create/invite user |
| `retool_deactivate_user` | Deactivate a user |
| `retool_list_groups` | List all groups |
| `retool_get_group` | Get group details |
| `retool_add_user_to_group` | Add user to group |
| `retool_get_audit_logs` | Get audit logs |

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Watch mode
npm run watch
```

## License

MIT
