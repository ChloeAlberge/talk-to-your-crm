import { searchContacts, searchOpportunities, getOpportunityDetails } from '../db/queries';
import { anthropic } from '../anthropicClient';

// Each handler receives the tool's input (already parsed) and returns
// a plain value that will be sent back to Claude as the tool result.

export async function handleSearchContacts(input: { query: string }) {
  return searchContacts(input.query);
}

export async function handleSearchOpportunities(input: {
  stage?: string;
  contactName?: string;
  minAmount?: number;
}) {
  return searchOpportunities(input);
}

export async function handleGetOpportunityDetails(input: { id: number }) {
  const details = getOpportunityDetails(input.id);
  if (!details) {
    return { error: `No opportunity found with id ${input.id}` };
  }
  return details;
}

export async function handleSummarizeOpportunityNotes(input: { notes: string }) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Summarize these sales notes in 1-2 short sentences, in plain language, highlighting the key status and any blockers:\n\n${input.notes}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return { summary: textBlock?.type === 'text' ? textBlock.text : '' };
}

// Central dispatch : maps a tool name (from Claude's tool_use response) to its handler
export async function executeTool(name: string, input: any) {
  switch (name) {
    case 'search_contacts':
      return handleSearchContacts(input);
    case 'search_opportunities':
      return handleSearchOpportunities(input);
    case 'get_opportunity_details':
      return handleGetOpportunityDetails(input);
    case 'summarize_opportunity_notes':
      return handleSummarizeOpportunityNotes(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}