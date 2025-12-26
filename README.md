# Retool MCP Server

[![npm version](https://badge.fury.io/js/retool-mcp.svg)](https://www.npmjs.com/package/retool-mcp)

An MCP (Model Context Protocol) server for interacting with self-hosted Retool instances. This allows AI assistants like Claude to create apps, manage workflows, users, and resources in Retool.

## Features

- **Apps Management**: Create, list, delete apps and create releases
- **Folders**: Organize apps into folders
- **Workflows**: List and trigger Retool workflows
- **Resources**: View database connections, APIs, and other resources
- **Users**: Create, list, and manage users
- **Groups**: Manage permission groups
- **Audit Logs**: Access organization audit logs

## Quick Start

### Using npx (Recommended)

No installation required:

```bash
RETOOL_URL=https://your-retool.com RETOOL_API_KEY=your-key npx retool-mcp
```

### Global Installation

```bash
npm install -g retool-mcp
retool-mcp
```

## Configuration

Set the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `RETOOL_URL` | Your Retool instance URL | Yes |
| `RETOOL_API_KEY` | Retool API token | Yes |

### Getting an API Key

1. Go to your Retool instance
2. Navigate to **Settings > API**
3. Create a new API token with appropriate permissions

## Usage with Claude Code

Add to your Claude Code MCP settings:

**Option 1: Using npx (no install needed)**

```json
{
  "mcpServers": {
    "retool": {
      "command": "npx",
      "args": ["-y", "retool-mcp"],
      "env": {
        "RETOOL_URL": "https://your-retool-instance.com",
        "RETOOL_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Option 2: Using global install**

```json
{
  "mcpServers": {
    "retool": {
      "command": "retool-mcp",
      "env": {
        "RETOOL_URL": "https://your-retool-instance.com",
        "RETOOL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Apps
| Tool | Description |
|------|-------------|
| `retool_list_apps` | List all apps |
| `retool_get_app` | Get app details |
| `retool_create_app` | Create a new app |
| `retool_delete_app` | Delete an app |
| `retool_create_app_release` | Create app release/version |

### Folders
| Tool | Description |
|------|-------------|
| `retool_list_folders` | List all folders |
| `retool_create_folder` | Create a folder |

### Workflows
| Tool | Description |
|------|-------------|
| `retool_list_workflows` | List all workflows |
| `retool_trigger_workflow` | Trigger a workflow with optional data |

### Resources
| Tool | Description |
|------|-------------|
| `retool_list_resources` | List all resources (DBs, APIs, etc.) |
| `retool_get_resource` | Get resource details |

### Users
| Tool | Description |
|------|-------------|
| `retool_list_users` | List all users |
| `retool_get_user` | Get user details |
| `retool_create_user` | Create/invite user |
| `retool_deactivate_user` | Deactivate a user |

### Groups
| Tool | Description |
|------|-------------|
| `retool_list_groups` | List all groups |
| `retool_get_group` | Get group details |
| `retool_add_user_to_group` | Add user to group |

### Audit
| Tool | Description |
|------|-------------|
| `retool_get_audit_logs` | Get audit logs |

## Example Usage

Once configured, you can ask Claude:

- "List all Retool apps"
- "Create a new app called 'Customer Dashboard'"
- "Trigger the 'daily-report' workflow"
- "Add user john@example.com to the Admin group"

## Development

```bash
# Clone the repo
git clone https://github.com/TechnicalRhino/retool-mcp.git
cd retool-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

## License

MIT
