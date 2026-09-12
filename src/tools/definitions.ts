import Anthropic from '@anthropic-ai/sdk';

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'search_contacts',
    description:
      'Search for contacts by first name, last name, or company. Returns basic contact info. Use this when the user asks about a person or a client company by name.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name or company to search for (partial match allowed).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_opportunities',
    description:
      'Search for sales opportunities, optionally filtered by stage, contact name, or minimum amount. Returns a summary list (no full notes). Use this for questions like "which deals are in negotiation" or "opportunities above 50k".',
    input_schema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
          description: 'Filter by pipeline stage.',
        },
        contactName: {
          type: 'string',
          description: 'Filter by the associated contact\'s first or last name.',
        },
        minAmount: {
          type: 'number',
          description: 'Only return opportunities with an amount greater than or equal to this value.',
        },
      },
    },
  },
  {
    name: 'get_opportunity_details',
    description:
      'Get full details for a single opportunity by its ID, including the raw notes field. Use this when the user asks for details about a specific deal, or before summarizing its notes.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The opportunity ID.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'summarize_opportunity_notes',
    description:
      'Given the raw notes text of an opportunity, produce a short, plain-language summary (1-2 sentences) highlighting the key status and any blockers. Use this after fetching an opportunity\'s details when the notes are long or the user asks for a summary.',
    input_schema: {
      type: 'object',
      properties: {
        notes: {
          type: 'string',
          description: 'The raw notes text to summarize.',
        },
      },
      required: ['notes'],
    },
  },
  {
    name: 'classify_opportunity_priority',
    description:
      "Classify an opportunity's category and urgency level based on its stage, amount, and notes. Echoes a triage/prioritization logic: helps identify which deals need attention first. Use this after fetching an opportunity's details when the user asks which deals are at risk, need follow-up, or should be prioritized.",
    input_schema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          description: 'The opportunity pipeline stage.',
        },
        amount: {
          type: 'number',
          description: 'The opportunity amount.',
        },
        notes: {
          type: 'string',
          description: 'The raw notes text to analyze.',
        },
      },
      required: ['stage', 'amount', 'notes'],
    },
  },
];