#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  BlockObjectResponse,
  Client,
  PageObjectResponse,
} from "@notionhq/client";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Core tools - keeping it focused
interface PersonaTools {
  createPersona(name: string, headline: string, content: string): Promise<void>;
  listPersonas(): Promise<PersonaListing[]>;
  addReflection(slug: string, reflection: string): Promise<void>;
  updatePersona(slug: string, content: string): Promise<void>;
  getPersona(slug: string): Promise<PersonaContent>;
  archivePersona(slug: string): Promise<void>; // soft delete
}

interface PersonaListing {
  slug: string;
  name: string;
  headline: string;
}

interface PersonaContent {
  slug: string;
  name: string;
  content: string; // Full markdown
  reflections: string[]; // Reflections since last update
}

async function createPersona(
  name: string,
  headline: string,
  content: string
): Promise<void> {
  const persona = await notion.pages.create({
    parent: { database_id: process.env.PERSONA_DATABASE_ID! },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      Status: {
        status: {
          name: "Active",
        },
      },
      Slug: {
        rich_text: [
          {
            text: {
              content: name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, ""),
            },
          },
        ],
      },
      Headline: {
        rich_text: [
          {
            text: {
              content: headline,
            },
          },
        ],
      },
    },
  });

  const personaHistory = await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: persona.id,
    },
    title: [
      {
        type: "text",
        text: {
          content: `${name} Persona History`,
        },
      },
    ],
    properties: {
      Date: {
        title: {},
      },
      "Document Type": {
        type: "select",
        select: {
          options: [{ name: "Persona Update" }, { name: "Reflection" }],
        },
      },
      Content: {
        type: "files",
        files: {},
      },
    },
  });

  const personaContent = await notion.fileUploads.create({
    content_type: "text/plain",
    mode: "single_part",
  });

  await notion.fileUploads.send({
    file_upload_id: personaContent.id,
    file: {
      data: new Blob([content], { type: "text/plain" }),
    },
  });
  // Create initial persona update entry

  await notion.pages.create({
    parent: { database_id: personaHistory.id },
    properties: {
      Date: {
        title: [
          {
            text: {
              content: new Date().toISOString(),
            },
          },
        ],
      },
      "Document Type": {
        select: {
          name: "Persona Update",
        },
      },
      Content: {
        files: [
          {
            name: "persona.md",
            file_upload: {
              id: personaContent.id,
            },
          },
        ],
      },
    },
  });
}

async function listPersonas(): Promise<PersonaListing[]> {
  const response = await notion.databases.query({
    database_id: process.env.PERSONA_DATABASE_ID!,
    filter: {
      property: "Status",
      status: {
        equals: "Active",
      },
    },
  });

  return response.results.map((page) => {
    const properties = (page as PageObjectResponse).properties;
    return {
      slug: (properties.Slug as any).rich_text[0].text.content,
      name: (properties.Name as any).title[0].text.content,
      headline: (properties.Headline as any).rich_text[0].text.content,
    };
  });
}

async function addReflection(slug: string, reflection: string): Promise<void> {
  const persona = await notion.databases.query({
    database_id: process.env.PERSONA_DATABASE_ID!,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
  });

  if (persona.results.length === 0) {
    throw new Error(`Persona with slug ${slug} not found`);
  }

  const personaPageId = (persona.results[0] as PageObjectResponse).id;

  const personaPageBlocks = await notion.blocks.children.list({
    block_id: personaPageId,
  });

  const personaContentBlock = (
    personaPageBlocks.results as BlockObjectResponse[]
  ).find((block) => block.type === "child_database");

  if (!personaContentBlock) {
    throw new Error(
      `Persona history database block not found for slug ${slug}`
    );
  }

  const personaHistoryId = personaContentBlock.id;

  const reflectionContent = await notion.fileUploads.create({
    content_type: "text/plain",
    mode: "single_part",
  });

  await notion.fileUploads.send({
    file_upload_id: reflectionContent.id,
    file: {
      data: new Blob([reflection], { type: "text/plain" }),
    },
  });

  await notion.pages.create({
    parent: { database_id: personaHistoryId },
    properties: {
      Date: {
        title: [
          {
            text: {
              content: new Date().toISOString(),
            },
          },
        ],
      },
      "Document Type": {
        select: {
          name: "Reflection",
        },
      },
      Content: {
        files: [
          {
            name: "reflection.md",
            file_upload: {
              id: reflectionContent.id,
            },
          },
        ],
      },
    },
  });
}

async function updatePersona(slug: string, content: string): Promise<void> {
  const persona = await notion.databases.query({
    database_id: process.env.PERSONA_DATABASE_ID!,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
  });

  if (persona.results.length === 0) {
    throw new Error(`Persona with slug ${slug} not found`);
  }

  const personaPageId = (persona.results[0] as PageObjectResponse).id;

  const personaPageBlocks = await notion.blocks.children.list({
    block_id: personaPageId,
  });

  const personaContentBlock = (
    personaPageBlocks.results as BlockObjectResponse[]
  ).find((block) => block.type === "child_database");

  if (!personaContentBlock) {
    throw new Error(
      `Persona history database block not found for slug ${slug}`
    );
  }

  const personaHistoryId = personaContentBlock.id;

  const personaContent = await notion.fileUploads.create({
    content_type: "text/plain",
    mode: "single_part",
  });

  await notion.fileUploads.send({
    file_upload_id: personaContent.id,
    file: {
      data: new Blob([content], { type: "text/plain" }),
    },
  });
  // Create new persona update entry

  await notion.pages.create({
    parent: { database_id: personaHistoryId },
    properties: {
      Date: {
        title: [
          {
            text: {
              content: new Date().toISOString(),
            },
          },
        ],
      },
      "Document Type": {
        select: {
          name: "Persona Update",
        },
      },
      Content: {
        files: [
          {
            name: "persona.md",
            file_upload: {
              id: personaContent.id,
            },
          },
        ],
      },
    },
  });
}

async function getPersona(slug: string): Promise<PersonaContent> {
  const persona = await notion.databases.query({
    database_id: process.env.PERSONA_DATABASE_ID!,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
  });

  if (persona.results.length === 0) {
    throw new Error(`Persona with slug ${slug} not found`);
  }

  const personaPageId = (persona.results[0] as PageObjectResponse).id;

  const personaPageBlocks = await notion.blocks.children.list({
    block_id: personaPageId,
  });

  const personaContentBlock = (
    personaPageBlocks.results as BlockObjectResponse[]
  ).find((block) => block.type === "child_database");

  if (!personaContentBlock) {
    throw new Error(
      `Persona history database block not found for slug ${slug}`
    );
  }

  const personaHistoryId = personaContentBlock.id;

  const historyEntries = await notion.databases.query({
    database_id: personaHistoryId,
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  const reflections: string[] = [];
  let latestPersona: string | null = null;

  for (const entry of historyEntries.results) {
    const properties = (entry as PageObjectResponse).properties;
    if ((properties["Document Type"] as any).select.name === "Reflection") {
      const file = (properties.Content as any).files[0].file.url;
      const response = await fetch(file);
      const text = await response.text();
      reflections.push(text);
    } else if (
      (properties["Document Type"] as any).select.name === "Persona Update"
    ) {
      const file = (properties.Content as any).files[0].file.url;
      const response = await fetch(file);
      const text = await response.text();
      latestPersona = text;
      break;
    }
  }

  if (!latestPersona) {
    throw new Error(`No persona updates found for slug ${slug}`);
  }

  return {
    slug: slug,
    name: ((persona.results[0] as PageObjectResponse).properties.Name as any)
      .title[0].text.content,
    content: latestPersona,
    reflections: reflections,
  };
}

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
  tools: [
    {
      name: "create_persona",
      description:
        "Create a new AI agent persona with a name, headline, and Markdown prompt defining its behaviour",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the persona",
          },
          headline: {
            type: "string",
            description:
              "A short headline describing the persona and its responsibilities",
          },
          content: {
            type: "string",
            description:
              "The full Markdown prompt defining the persona's behaviour and deliverables",
          },
        },
        required: ["name", "headline", "content"],
      },
    },
    {
      name: "list_personas",
      description: "List all active AI agent personas",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "add_reflection",
      description:
        "Adds a reflection to an existing persona, which is a short text reflecting on the persona's performance or behaviour in a specific interaction",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The slug of the persona to add a reflection to",
          },
          reflection: {
            type: "string",
            description: "The reflection text to add to the persona's history",
          },
        },
        required: ["slug", "reflection"],
      },
    },
    {
      name: "update_persona",
      description:
        "Updates an existing persona's content with new Markdown prompt defining its updated behaviour and deliverables",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The slug of the persona to update",
          },
          content: {
            type: "string",
            description:
              "The new full Markdown prompt defining the updated persona's behaviour and deliverables",
          },
        },
        required: ["slug", "content"],
      },
    },
    {
      name: "get_persona",
      description:
        "Retrieves the full content of a persona by its slug so that it can be applied to an interaction",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The slug of the persona to retrieve",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "get_reflections",
      description:
        "Retrieves all reflections for a persona, which are short texts reflecting on the persona's performance or behaviour in specific interactions",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "The slug of the persona to retrieve reflections for",
          },
        },
        required: ["slug"],
      },
    },
  ],
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
  switch (request.params.name) {
    case "create_persona":
      await createPersona(
        request.params.arguments!.name as string,
        request.params.arguments!.headline as string,
        request.params.arguments!.content as string
      );
      return {
        content: [{ type: "text", text: "Persona created successfully" }],
      };

    case "list_personas":
      const personas = await listPersonas();
      return {
        content: personas.map((persona) => ({
          type: "text",
          text: `\`\`\`json
{
  "slug": "${persona.slug}",
  "name": "${persona.name}",
  "headline": "${persona.headline}"
}
\`\`\``,
        })),
      };

    case "add_reflection":
      await addReflection(
        request.params.arguments!.slug as string,
        request.params.arguments!.reflection as string
      );
      return {
        content: [{ type: "text", text: "Reflection added successfully" }],
      };

    case "update_persona":
      await updatePersona(
        request.params.arguments!.slug as string,
        request.params.arguments!.content as string
      );
      return {
        content: [{ type: "text", text: "Persona updated successfully" }],
      };

    case "get_persona":
      const persona = await getPersona(
        request.params.arguments!.slug as string
      );
      return {
        content: [
          {
            type: "text",
            text: persona.content,
          },
        ],
      };

    case "get_reflections":
      const personaWithReflections = await getPersona(
        request.params.arguments!.slug as string
      );
      return {
        content: personaWithReflections.reflections.map((reflection) => ({
          type: "text",
          text: reflection,
        })),
      };

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
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
