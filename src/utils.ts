import { PageObjectResponse, BlockObjectResponse } from "@notionhq/client";
import { notion } from "./notion-client.js";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export async function uploadFile(content: string): Promise<string> {
  const fileUpload = await notion.fileUploads.create({
    content_type: "text/plain",
    mode: "single_part",
  });

  await notion.fileUploads.send({
    file_upload_id: fileUpload.id,
    file: {
      data: new Blob([content], { type: "text/plain" }),
    },
  });

  return fileUpload.id;
}

export async function findPersonaHistoryDatabase(
  personaPageId: string
): Promise<string> {
  const personaPageBlocks = await notion.blocks.children.list({
    block_id: personaPageId,
  });

  const personaContentBlock = (
    personaPageBlocks.results as BlockObjectResponse[]
  ).find((block) => block.type === "child_database");

  if (!personaContentBlock) {
    throw new Error(
      `Persona history database block not found for page ${personaPageId}`
    );
  }

  return personaContentBlock.id;
}

export async function fetchFileContent(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}

export function extractPropertyValue(property: any, type: string): string {
  switch (type) {
    case "title":
      return property.title?.[0]?.text?.content || "";
    case "rich_text":
      return property.rich_text?.[0]?.text?.content || "";
    case "select":
      return property.select?.name || "";
    default:
      return "";
  }
}