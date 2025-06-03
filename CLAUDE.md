# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based MCP (Model Context Protocol) server that manages AI agent personas stored in Notion. It provides tools for creating, updating, and reflecting on AI personas through a version-controlled system.

## Development Commands

```bash
# Build the project
npm run build
```

## Architecture

The project implements an MCP server (`src/index.ts`) that:

- Connects to Notion via the Notion API
- Manages personas as Notion pages with child history databases
- Exposes 6 tools: create_persona, list_personas, get_persona, add_reflection, update_persona, get_reflections
- Uses stdio transport for MCP communication

Key environment variables required:

- `NOTION_TOKEN`: Notion API authentication token
- `PERSONA_DATABASE_ID`: ID of the Notion database containing personas

## Notion Data Structure

Each persona is a Notion page with:

- Title (name)
- Status (Active/Archived)
- Slug (URL-friendly identifier)
- Headline (brief description)
- Child database for version history

History entries are stored as .md files in the child database with:

- Date timestamp
- Document Type ("Persona Update" or "Reflection")
- Content file

## TypeScript Configuration

- Strict mode enabled
- Compiles to ES2022 with Node16 module system
- Source maps enabled
- Output directory: `build/`
