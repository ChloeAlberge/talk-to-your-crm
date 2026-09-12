# talk-to-your-crm

Mini AI agent inspired by Salesforce Agentforce, that queries a simulated CRM database (contacts, opportunities) in natural language, using tool use with the Anthropic API (Claude).

Portfolio project, companion to the Voyalis pre-sales case study. Voyalis demonstrates the design of an AI solution for a client (discovery, architecture, technical choices). This project demonstrates the technical build.

## Stack

- Node.js and TypeScript
- SQLite (better-sqlite3)
- Express (web chat interface)
- Anthropic API (tool use)

## Status

Work in progress. Current MVP scope: database, then 4 read and synthesis tools.

## Running the project

```bash
npm install
npm run seed
npm run dev
```

## Architecture

```
src/
  db/        SQLite schema, seed data, queries
  tools/     tool definitions (JSON schemas) and handlers
  agent.ts   conversation loop with the Anthropic API
  server.ts  Express server and chat route
public/
  index.html chat interface
```