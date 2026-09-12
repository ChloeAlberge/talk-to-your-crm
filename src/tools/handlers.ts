import Anthropic from '@anthropic-ai/sdk';
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

// Internal-only tool schema, used to force a structured response from Claude.
// Never exposed to the main agent — only used inside this handler.
const CLASSIFICATION_SCHEMA: Anthropic.Tool = {
  name: 'record_classification',
  description: 'Record the classification result for this opportunity.',
  input_schema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['at_risk', 'ready_to_close', 'needs_follow_up', 'stalled'],
      },
      urgency: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
      },
      reasoning: {
        type: 'string',
        description: 'One short sentence explaining the classification.',
      },
    },
    required: ['category', 'urgency', 'reasoning'],
  },
};

export async function handleClassifyOpportunityPriority(input: {
  stage: string;
  amount: number;
  notes: string;
}) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    tools: [CLASSIFICATION_SCHEMA],
    tool_choice: { type: 'tool', name: 'record_classification' },
    messages: [
      {
        role: 'user',
        content: `Classify this sales opportunity.\n\nStage: ${input.stage}\nAmount: ${input.amount}€\nNotes: ${input.notes}`,
      },
    ],
  });

  const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
  if (toolUseBlock?.type === 'tool_use') {
    return toolUseBlock.input;
  }
  return { error: 'Classification failed.' };
}

// Central dispatch: maps a tool name (from Claude's tool_use response) to its handler
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
    case 'classify_opportunity_priority':
      return handleClassifyOpportunityPriority(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}