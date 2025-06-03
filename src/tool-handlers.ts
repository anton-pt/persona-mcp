import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  createPersona,
  listPersonas,
  updatePersona,
  getPersona,
} from "./persona-operations.js";
import { addReflection } from "./history-operations.js";

export async function handleToolCall(request: CallToolRequest) {
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
}

export const toolDefinitions = [
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
];