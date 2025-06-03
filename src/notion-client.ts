import { Client } from "@notionhq/client";

if (!process.env.NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN environment variable is not set");
}

if (!process.env.PERSONA_DATABASE_ID) {
  throw new Error("PERSONA_DATABASE_ID environment variable is not set");
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const PERSONA_DATABASE_ID = process.env.PERSONA_DATABASE_ID;