import { PageObjectResponse } from "@notionhq/client";
import { notion, PERSONA_DATABASE_ID } from "./notion-client.js";
import { PersonaListing, PersonaContent } from "./types.js";
import { 
  generateSlug, 
  uploadFile, 
  findPersonaHistoryDatabase, 
  fetchFileContent,
  extractPropertyValue 
} from "./utils.js";

export async function createPersona(
  name: string,
  headline: string,
  content: string
): Promise<void> {
  const persona = await notion.pages.create({
    parent: { database_id: PERSONA_DATABASE_ID },
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
              content: generateSlug(name),
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

  const personaContentId = await uploadFile(content);

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
              id: personaContentId,
            },
          },
        ],
      },
    },
  });
}

export async function listPersonas(): Promise<PersonaListing[]> {
  const response = await notion.databases.query({
    database_id: PERSONA_DATABASE_ID,
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
      slug: extractPropertyValue(properties.Slug, "rich_text"),
      name: extractPropertyValue(properties.Name, "title"),
      headline: extractPropertyValue(properties.Headline, "rich_text"),
    };
  });
}

export async function findPersonaBySlug(slug: string): Promise<PageObjectResponse> {
  const persona = await notion.databases.query({
    database_id: PERSONA_DATABASE_ID,
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

  return persona.results[0] as PageObjectResponse;
}

export async function updatePersona(slug: string, content: string): Promise<void> {
  const personaPage = await findPersonaBySlug(slug);
  const personaHistoryId = await findPersonaHistoryDatabase(personaPage.id);
  const personaContentId = await uploadFile(content);

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
              id: personaContentId,
            },
          },
        ],
      },
    },
  });
}

export async function getPersona(slug: string): Promise<PersonaContent> {
  const personaPage = await findPersonaBySlug(slug);
  const personaHistoryId = await findPersonaHistoryDatabase(personaPage.id);

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
    const documentType = extractPropertyValue(properties["Document Type"], "select");
    
    if (documentType === "Reflection") {
      const file = (properties.Content as any).files[0].file.url;
      const text = await fetchFileContent(file);
      reflections.push(text);
    } else if (documentType === "Persona Update") {
      const file = (properties.Content as any).files[0].file.url;
      const text = await fetchFileContent(file);
      latestPersona = text;
      break;
    }
  }

  if (!latestPersona) {
    throw new Error(`No persona updates found for slug ${slug}`);
  }

  return {
    slug: slug,
    name: extractPropertyValue(personaPage.properties.Name, "title"),
    content: latestPersona,
    reflections: reflections,
  };
}