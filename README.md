# Persona MCP Server

This is a TypeScript-based MCP (Model Context Protocol) server that manages AI agent personas stored in Notion.
It provides tools for creating, updating, and reflecting on AI personas through a version-controlled system.

## Setup

1. Clone the repository:

    ```bash
    git clone git@github.com:anton-pt/persona-mcp.git
    ```

2. Create a `.env` file in the root directory with the following variables:

    ```plaintext
    NOTION_TOKEN=<your_notion_token>
    PERSONA_DATABASE_ID=<your_persona_database_id>
    ```

    To obtain a Notion API token, [create a new integration](https://www.notion.so/profile/integrations)
    and give it access to a blank database. You can find the database ID in the URL of the database page.

3. Install dependencies:

    ```bash
    npm install
    ```

4. Build the project:

    ```bash
    npm run build
    ```

5. For the Claude Desktop application, edit the Claude MCP server configuration file to include this MCP server:

    ```json
    {
      "mcpServers": {
        "persona-mcp": {
          "command": "node",
          "args": [
            "--env-file=/path/to/persona-mcp/.env",
            "/path/to/persona-mcp/build/index.js"
          ]
        }
      }
    }
    ```
