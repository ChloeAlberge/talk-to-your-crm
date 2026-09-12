import { anthropic } from './anthropicClient';
import { toolDefinitions } from './tools/definitions';
import { executeTool } from './tools/handlers';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a CRM data assistant for a sales team. Your only role is to help users query and understand their CRM data (contacts and opportunities) using the available tools.

Stay strictly within this scope:
- Answer questions about contacts, opportunities, deal status, amounts, stages, and notes.
- Use the summarize tool when notes are long or a summary is requested.
- If asked for general sales advice, coaching, negotiation strategy, or anything not grounded in the actual CRM data, kindly redirect: acknowledge the request, briefly explain that this kind of judgment call is best left to the person and their team, and offer to pull up the relevant CRM data instead if that would help.

Always answer in the same language the user wrote in.`;

export interface ToolTrace {
  tool: string;
  input: Record<string, unknown>;
}

export interface AgentResult {
  answer: string;
  trace: ToolTrace[];
  history: Anthropic.MessageParam[];
}

export async function runAgent(
  userMessage: string,
  previousHistory: Anthropic.MessageParam[] = []
): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [
    ...previousHistory,
    { role: 'user', content: userMessage },
  ];
  const trace: ToolTrace[] = [];

  const MAX_TURNS = 5;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find((block) => block.type === 'text');
      messages.push({ role: 'assistant', content: response.content });
      return {
        answer: textBlock?.type === 'text' ? textBlock.text : '',
        trace,
        history: messages,
      };
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        trace.push({ tool: block.name, input: block.input as Record<string, unknown> });
        const result = await executeTool(block.name, block.input);
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      })
    );

    messages.push({ role: 'user', content: toolResults });
  }

  return {
    answer: "Désolé, je n'ai pas réussi à traiter votre demande.",
    trace,
    history: messages,
  };
}