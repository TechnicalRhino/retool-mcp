#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Environment configuration
const RETOOL_URL = process.env.RETOOL_URL || "https://retool.example.com";
const RETOOL_API_KEY = process.env.RETOOL_API_KEY || "";

if (!RETOOL_API_KEY) {
  console.error("Warning: RETOOL_API_KEY environment variable is not set");
}

// Retool API client
class RetoolClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const url = `${this.baseUrl}/api/v2${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Retool API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  // Apps
  async listApps() {
    return this.request("GET", "/apps");
  }

  async getApp(appId: string) {
    return this.request("GET", `/apps/${appId}`);
  }

  async createApp(name: string, folderId?: string) {
    return this.request("POST", "/apps", {
      name,
      folder_id: folderId,
    });
  }

  async deleteApp(appId: string) {
    return this.request("DELETE", `/apps/${appId}`);
  }

  async createAppRelease(appId: string, version?: string) {
    return this.request("POST", `/apps/${appId}/releases`, {
      version,
    });
  }

  // Folders
  async listFolders() {
    return this.request("GET", "/folders");
  }

  async createFolder(name: string, parentFolderId?: string) {
    return this.request("POST", "/folders", {
      name,
      parent_folder_id: parentFolderId,
    });
  }

  // Workflows
  async listWorkflows() {
    return this.request("GET", "/workflows");
  }

  async triggerWorkflow(workflowId: string, data?: Record<string, unknown>) {
    return this.request("POST", `/workflows/${workflowId}/trigger`, {
      data,
    });
  }

  // Resources (Database connections, APIs, etc.)
  async listResources() {
    return this.request("GET", "/resources");
  }

  async getResource(resourceId: string) {
    return this.request("GET", `/resources/${resourceId}`);
  }

  // Users
  async listUsers() {
    return this.request("GET", "/users");
  }

  async getUser(userId: string) {
    return this.request("GET", `/users/${userId}`);
  }

  async createUser(email: string, firstName?: string, lastName?: string) {
    return this.request("POST", "/users", {
      email,
      first_name: firstName,
      last_name: lastName,
    });
  }

  async deactivateUser(userId: string) {
    return this.request("POST", `/users/${userId}/deactivate`);
  }

  // Groups
  async listGroups() {
    return this.request("GET", "/groups");
  }

  async getGroup(groupId: string) {
    return this.request("GET", `/groups/${groupId}`);
  }

  async addUserToGroup(groupId: string, userId: string) {
    return this.request("POST", `/groups/${groupId}/members`, {
      user_id: userId,
    });
  }

  // Source Control
  async listSourceControlSettings() {
    return this.request("GET", "/source_control/settings");
  }

  // Audit Logs
  async getAuditLogs(startDate?: string, endDate?: string) {
    let endpoint = "/audit_logs";
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request("GET", endpoint);
  }
}

// Tool definitions
const tools: Tool[] = [
  // Apps
  {
    name: "retool_list_apps",
    description: "List all Retool apps in the organization",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_get_app",
    description: "Get details of a specific Retool app",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The ID of the app to retrieve",
        },
      },
      required: ["app_id"],
    },
  },
  {
    name: "retool_create_app",
    description: "Create a new Retool app",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new app",
        },
        folder_id: {
          type: "string",
          description: "Optional folder ID to place the app in",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "retool_delete_app",
    description: "Delete a Retool app",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The ID of the app to delete",
        },
      },
      required: ["app_id"],
    },
  },
  {
    name: "retool_create_app_release",
    description: "Create a new release/version of a Retool app",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The ID of the app",
        },
        version: {
          type: "string",
          description: "Optional version string for the release",
        },
      },
      required: ["app_id"],
    },
  },
  // Folders
  {
    name: "retool_list_folders",
    description: "List all folders in the Retool organization",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_create_folder",
    description: "Create a new folder",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the folder",
        },
        parent_folder_id: {
          type: "string",
          description: "Optional parent folder ID for nesting",
        },
      },
      required: ["name"],
    },
  },
  // Workflows
  {
    name: "retool_list_workflows",
    description: "List all Retool workflows",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_trigger_workflow",
    description: "Trigger a Retool workflow with optional data",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: {
          type: "string",
          description: "The ID of the workflow to trigger",
        },
        data: {
          type: "object",
          description: "Optional data to pass to the workflow",
        },
      },
      required: ["workflow_id"],
    },
  },
  // Resources
  {
    name: "retool_list_resources",
    description: "List all resources (database connections, APIs, etc.)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_get_resource",
    description: "Get details of a specific resource",
    inputSchema: {
      type: "object",
      properties: {
        resource_id: {
          type: "string",
          description: "The ID of the resource",
        },
      },
      required: ["resource_id"],
    },
  },
  // Users
  {
    name: "retool_list_users",
    description: "List all users in the organization",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_get_user",
    description: "Get details of a specific user",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The ID of the user",
        },
      },
      required: ["user_id"],
    },
  },
  {
    name: "retool_create_user",
    description: "Create/invite a new user to the organization",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address of the user",
        },
        first_name: {
          type: "string",
          description: "First name of the user",
        },
        last_name: {
          type: "string",
          description: "Last name of the user",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "retool_deactivate_user",
    description: "Deactivate a user",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The ID of the user to deactivate",
        },
      },
      required: ["user_id"],
    },
  },
  // Groups
  {
    name: "retool_list_groups",
    description: "List all groups in the organization",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "retool_get_group",
    description: "Get details of a specific group",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "string",
          description: "The ID of the group",
        },
      },
      required: ["group_id"],
    },
  },
  {
    name: "retool_add_user_to_group",
    description: "Add a user to a group",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "string",
          description: "The ID of the group",
        },
        user_id: {
          type: "string",
          description: "The ID of the user to add",
        },
      },
      required: ["group_id", "user_id"],
    },
  },
  // Audit Logs
  {
    name: "retool_get_audit_logs",
    description: "Get audit logs for the organization",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start date (ISO 8601 format)",
        },
        end_date: {
          type: "string",
          description: "End date (ISO 8601 format)",
        },
      },
      required: [],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "retool-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const client = new RetoolClient(RETOOL_URL, RETOOL_API_KEY);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Apps
      case "retool_list_apps":
        result = await client.listApps();
        break;
      case "retool_get_app":
        result = await client.getApp(args?.app_id as string);
        break;
      case "retool_create_app":
        result = await client.createApp(
          args?.name as string,
          args?.folder_id as string | undefined
        );
        break;
      case "retool_delete_app":
        result = await client.deleteApp(args?.app_id as string);
        break;
      case "retool_create_app_release":
        result = await client.createAppRelease(
          args?.app_id as string,
          args?.version as string | undefined
        );
        break;

      // Folders
      case "retool_list_folders":
        result = await client.listFolders();
        break;
      case "retool_create_folder":
        result = await client.createFolder(
          args?.name as string,
          args?.parent_folder_id as string | undefined
        );
        break;

      // Workflows
      case "retool_list_workflows":
        result = await client.listWorkflows();
        break;
      case "retool_trigger_workflow":
        result = await client.triggerWorkflow(
          args?.workflow_id as string,
          args?.data as Record<string, unknown> | undefined
        );
        break;

      // Resources
      case "retool_list_resources":
        result = await client.listResources();
        break;
      case "retool_get_resource":
        result = await client.getResource(args?.resource_id as string);
        break;

      // Users
      case "retool_list_users":
        result = await client.listUsers();
        break;
      case "retool_get_user":
        result = await client.getUser(args?.user_id as string);
        break;
      case "retool_create_user":
        result = await client.createUser(
          args?.email as string,
          args?.first_name as string | undefined,
          args?.last_name as string | undefined
        );
        break;
      case "retool_deactivate_user":
        result = await client.deactivateUser(args?.user_id as string);
        break;

      // Groups
      case "retool_list_groups":
        result = await client.listGroups();
        break;
      case "retool_get_group":
        result = await client.getGroup(args?.group_id as string);
        break;
      case "retool_add_user_to_group":
        result = await client.addUserToGroup(
          args?.group_id as string,
          args?.user_id as string
        );
        break;

      // Audit Logs
      case "retool_get_audit_logs":
        result = await client.getAuditLogs(
          args?.start_date as string | undefined,
          args?.end_date as string | undefined
        );
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Retool MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
