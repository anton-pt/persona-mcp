#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolCall, toolDefinitions } from "./tool-handlers.js";

const server = new Server(
  {
    name: "notion-personas-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}));

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [],
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleToolCall(request);
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
