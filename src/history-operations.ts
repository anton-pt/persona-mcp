import { notion } from "./notion-client.js";
import { findPersonaBySlug } from "./persona-operations.js";
import { uploadFile, findPersonaHistoryDatabase } from "./utils.js";

export async function addReflection(slug: string, reflection: string): Promise<void> {
  const personaPage = await findPersonaBySlug(slug);
  const personaHistoryId = await findPersonaHistoryDatabase(personaPage.id);
  const reflectionContentId = await uploadFile(reflection);

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
              id: reflectionContentId,
            },
          },
        ],
      },
    },
  });
}