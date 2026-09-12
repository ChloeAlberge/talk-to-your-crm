import { anthropic } from './anthropicClient';
import { toolDefinitions } from './tools/definitions';
import { executeTool } from './tools/handlers';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a helpful assistant for a sales team, with access to their CRM data (contacts and opportunities). Use the available tools to answer questions accurately based on real data. When notes are long or the user asks for a summary, use the summarize tool rather than repeating the raw text. Always answer in the same language the user wrote in.`;

export async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  // Safety net: never loop more than a handful of times, in case something
  // goes wrong and Claude keeps requesting tools indefinitely.
  const MAX_TURNS = 5;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    // If Claude didn't ask for a tool, we have our final answer.
    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text : '';
    }

    // Claude's response (including the tool_use request) becomes part of the conversation.
    messages.push({ role: 'assistant', content: response.content });

    // Claude can request multiple tools in one turn — execute each one.
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(block.name, block.input);
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      })
    );

    // Send the results back so Claude can continue (or give its final answer).
    messages.push({ role: 'user', content: toolResults });
  }

  return "Désolé, je n'ai pas réussi à traiter votre demande.";
}