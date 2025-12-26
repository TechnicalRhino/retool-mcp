#!/usr/bin/env node

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z }                    from "zod";

// Environment configuration
const RETOOL_URL     = process.env.RETOOL_URL || "https://retool.example.com";
const RETOOL_API_KEY = process.env.RETOOL_API_KEY || "";

if (!RETOOL_API_KEY) {
    console.error( "Warning: RETOOL_API_KEY environment variable is not set" );
}

// Retool API client
class RetoolClient {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string, apiKey: string) {
        this.baseUrl = baseUrl.replace( /\/$/, "" );
        this.apiKey  = apiKey;
    }

    private async request(
            method: string,
            endpoint: string,
            body?: unknown
    ): Promise<unknown> {
        const url                             = `${this.baseUrl}/api/v2${endpoint}`;
        const headers: Record<string, string> = {
            Authorization : `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };

        const response = await fetch( url, {
            method,
            headers,
            body: body ? JSON.stringify( body ) : undefined,
        } );

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
        return this.request( "GET", "/apps" );
    }

    async getApp(appId: string) {
        return this.request( "GET", `/apps/${appId}` );
    }

    async createApp(name: string, folderId?: string) {
        return this.request( "POST", "/apps", {
            name,
            folder_id: folderId,
        } );
    }

    async deleteApp(appId: string) {
        return this.request( "DELETE", `/apps/${appId}` );
    }

    async createAppRelease(appId: string, version?: string) {
        return this.request( "POST", `/apps/${appId}/releases`, {
            version,
        } );
    }

    // Folders
    async listFolders() {
        return this.request( "GET", "/folders" );
    }

    async createFolder(name: string, parentFolderId?: string) {
        return this.request( "POST", "/folders", {
            name,
            parent_folder_id: parentFolderId,
        } );
    }

    // Workflows
    async listWorkflows() {
        return this.request( "GET", "/workflows" );
    }

    async triggerWorkflow(workflowId: string, data?: Record<string, unknown>) {
        return this.request( "POST", `/workflows/${workflowId}/trigger`, {
            data,
        } );
    }

    // Resources (Database connections, APIs, etc.)
    async listResources() {
        return this.request( "GET", "/resources" );
    }

    async getResource(resourceId: string) {
        return this.request( "GET", `/resources/${resourceId}` );
    }

    // Users
    async listUsers() {
        return this.request( "GET", "/users" );
    }

    async getUser(userId: string) {
        return this.request( "GET", `/users/${userId}` );
    }

    async createUser(email: string, firstName?: string, lastName?: string) {
        return this.request( "POST", "/users", {
            email,
            first_name: firstName,
            last_name : lastName,
        } );
    }

    async deactivateUser(userId: string) {
        return this.request( "POST", `/users/${userId}/deactivate` );
    }

    // Groups
    async listGroups() {
        return this.request( "GET", "/groups" );
    }

    async getGroup(groupId: string) {
        return this.request( "GET", `/groups/${groupId}` );
    }

    async addUserToGroup(groupId: string, userId: string) {
        return this.request( "POST", `/groups/${groupId}/members`, {
            user_id: userId,
        } );
    }

    // Source Control
    async listSourceControlSettings() {
        return this.request( "GET", "/source_control/settings" );
    }

    // Audit Logs
    async getAuditLogs(startDate?: string, endDate?: string) {
        let endpoint = "/audit_logs";
        const params = new URLSearchParams();
        if (startDate) params.append( "start_date", startDate );
        if (endDate) params.append( "end_date", endDate );
        if (params.toString()) endpoint += `?${params.toString()}`;
        return this.request( "GET", endpoint );
    }
}

const client = new RetoolClient( RETOOL_URL, RETOOL_API_KEY );

// Create MCP server using the new McpServer API
const server = new McpServer( {
    name   : "retool-mcp",
    version: "1.0.0",
} );

// Helper to format response
function formatResponse(result: unknown) {
    return {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify( result, null, 2 ),
            },
        ],
    };
}

function formatError(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
        content: [
            {
                type: "text" as const,
                text: `Error: ${errorMessage}`,
            },
        ],
        isError: true,
    };
}

// Register tools using the new server.tool() API

// Apps
server.tool(
        "retool_list_apps",
        "List all Retool apps in the organization",
        {},
        async () => {
            try {
                const result = await client.listApps();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_get_app",
        "Get details of a specific Retool app",
        { app_id: z.string().describe( "The ID of the app to retrieve" ) },
        async ({ app_id }) => {
            try {
                const result = await client.getApp( app_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_create_app",
        "Create a new Retool app",
        {
            name     : z.string().describe( "Name of the new app" ),
            folder_id: z.string().optional().describe( "Optional folder ID to place the app in" ),
        },
        async ({ name, folder_id }) => {
            try {
                const result = await client.createApp( name, folder_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_delete_app",
        "Delete a Retool app",
        { app_id: z.string().describe( "The ID of the app to delete" ) },
        async ({ app_id }) => {
            try {
                const result = await client.deleteApp( app_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_create_app_release",
        "Create a new release/version of a Retool app",
        {
            app_id : z.string().describe( "The ID of the app" ),
            version: z.string().optional().describe( "Optional version string for the release" ),
        },
        async ({ app_id, version }) => {
            try {
                const result = await client.createAppRelease( app_id, version );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Folders
server.tool(
        "retool_list_folders",
        "List all folders in the Retool organization",
        {},
        async () => {
            try {
                const result = await client.listFolders();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_create_folder",
        "Create a new folder",
        {
            name            : z.string().describe( "Name of the folder" ),
            parent_folder_id: z.string().optional().describe( "Optional parent folder ID for nesting" ),
        },
        async ({ name, parent_folder_id }) => {
            try {
                const result = await client.createFolder( name, parent_folder_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Workflows
server.tool(
        "retool_list_workflows",
        "List all Retool workflows",
        {},
        async () => {
            try {
                const result = await client.listWorkflows();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_trigger_workflow",
        "Trigger a Retool workflow with optional data",
        {
            workflow_id: z.string().describe( "The ID of the workflow to trigger" ),
            data       : z.record( z.unknown() ).optional().describe( "Optional data to pass to the workflow" ),
        },
        async ({ workflow_id, data }) => {
            try {
                const result = await client.triggerWorkflow( workflow_id, data );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Resources
server.tool(
        "retool_list_resources",
        "List all resources (database connections, APIs, etc.)",
        {},
        async () => {
            try {
                const result = await client.listResources();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_get_resource",
        "Get details of a specific resource",
        { resource_id: z.string().describe( "The ID of the resource" ) },
        async ({ resource_id }) => {
            try {
                const result = await client.getResource( resource_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Users
server.tool(
        "retool_list_users",
        "List all users in the organization",
        {},
        async () => {
            try {
                const result = await client.listUsers();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_get_user",
        "Get details of a specific user",
        { user_id: z.string().describe( "The ID of the user" ) },
        async ({ user_id }) => {
            try {
                const result = await client.getUser( user_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_create_user",
        "Create/invite a new user to the organization",
        {
            email     : z.string().describe( "Email address of the user" ),
            first_name: z.string().optional().describe( "First name of the user" ),
            last_name : z.string().optional().describe( "Last name of the user" ),
        },
        async ({ email, first_name, last_name }) => {
            try {
                const result = await client.createUser( email, first_name, last_name );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_deactivate_user",
        "Deactivate a user",
        { user_id: z.string().describe( "The ID of the user to deactivate" ) },
        async ({ user_id }) => {
            try {
                const result = await client.deactivateUser( user_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Groups
server.tool(
        "retool_list_groups",
        "List all groups in the organization",
        {},
        async () => {
            try {
                const result = await client.listGroups();
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_get_group",
        "Get details of a specific group",
        { group_id: z.string().describe( "The ID of the group" ) },
        async ({ group_id }) => {
            try {
                const result = await client.getGroup( group_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

server.tool(
        "retool_add_user_to_group",
        "Add a user to a group",
        {
            group_id: z.string().describe( "The ID of the group" ),
            user_id : z.string().describe( "The ID of the user to add" ),
        },
        async ({ group_id, user_id }) => {
            try {
                const result = await client.addUserToGroup( group_id, user_id );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Audit Logs
server.tool(
        "retool_get_audit_logs",
        "Get audit logs for the organization",
        {
            start_date: z.string().optional().describe( "Start date (ISO 8601 format)" ),
            end_date  : z.string().optional().describe( "End date (ISO 8601 format)" ),
        },
        async ({ start_date, end_date }) => {
            try {
                const result = await client.getAuditLogs( start_date, end_date );
                return formatResponse( result );
            } catch (error) {
                return formatError( error );
            }
        }
);

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect( transport );
    console.error( "Retool MCP server running on stdio" );
}

main().catch( (error) => {
    console.error( "Fatal error:", error );
    process.exit( 1 );
} );
