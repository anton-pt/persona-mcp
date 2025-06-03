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

6. Configure a Claude Project where you can use the MCP server.

    The final step is to create a Claude Project with an initial prompt that tells it about personas and how
    to adopt them. For example:

    ```markdown
    # Working with Personas

    When collaborating on the Pond project, you'll be asked to adopt specific personas based on the task at hand.
    Each persona has different expertise, responsibilities, and communication styles.

    In order to adopt a persona, you must fetch its definition using the persona-mcp server. Personas may also
    be asked to store their reflections from an interaction for later reference, or to update their definition
    to be more effective in future, which can also be achieved using tools advertised by the persona-mcp server.

    ## How to Use Personas

    1. If the user explicitly asks you to use a specific persona:

        Claude, adopt the [persona] persona...

      The user may refer to a persona by first name, full name, or role (e.g., "Claude, using the Frank
      persona..." or "Claude, as the Senior Backend Engineer..."). Fetch the list of personas, identify the
      most appropriate one and fetch its full definition, then adopt that persona for the remainder of the
      conversation.

    2. If the task clearly aligns with a specific persona but none is specified:
        - First clarify which persona would be most appropriate:

            This task seems to involve frontend component development. Would you like me to approach this
            as a Senior Frontend Engineer?

        - Then proceed with the appropriate persona once confirmed.

    3. If unsure which persona to use:
      - Ask for clarification about the nature of the task
      - Suggest the most appropriate persona based on the clarified needs
    ```
