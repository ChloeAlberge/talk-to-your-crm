# Technical decisions and learnings — talk-to-your-crm

Documented decisions, trade-offs, and known limitations. Written as they were made, not retrofitted after the fact. Kept both for interview reference and as a personal record of the project.

## Architecture

- Clear separation by responsibility: `db/` (schema, seed, queries), `tools/` (tool schemas and handlers), `agent.ts` (conversation loop), `server.ts` plus `public/` (web interface). Each layer can be reasoned about and tested independently.
- Tools that call the Anthropic API (`summarize_opportunity_notes`, `classify_opportunity_priority`) never query the database directly. They take plain data as input (notes, stage, amount). The agent is responsible for first calling `get_opportunity_details`, then feeding the result into the AI tool. This keeps each tool single-purpose and independently testable.
- Conversation history is kept client-side (in the browser) and sent with each request, since the Express server itself is stateless between requests. This is the simplest solution for a local MVP. A production or multi-device use case would need server-side session storage instead.

## Bugs found during testing, and how they were diagnosed

- **Full-name search failure**: `search_contacts("Pierre Vasseur")` returned no results even though the contact existed. Root cause: the query matched `first_name`, `last_name`, and `company` separately with `LIKE`, but never the concatenated full name. Fixed by adding a fourth `OR` condition matching `first_name || ' ' || last_name`. The same bug existed independently in `searchOpportunities`'s `contactName` filter and required the same fix.
- **No conversation memory**: the agent answered "yes" (in response to its own follow-up question) with a generic greeting, having no idea what "yes" referred to. Root cause: `runAgent` was stateless. Each call started a fresh `messages` array containing only the latest input. Fixed by having the agent return its full message history, and the client resend it with each new request.
- **Truncated responses**: long, structured answers (for example, RGPD compliance advice) were cut off mid-sentence. Root cause: `max_tokens: 1024` was too low for some answers. Raised to 2048. No measurable cost impact on short answers, since `max_tokens` is a ceiling, not a target.

## Scope decision: the agent stays a CRM data assistant

The agent was observed answering an out-of-scope request ("help me negotiate with Pierre Vasseur") with detailed sales and negotiation advice, generated purely from the LLM's general knowledge, with no tool call involved. This was a deliberate design choice to correct, not a bug. The system prompt was updated to explicitly scope the agent to CRM data queries only, and to decline general sales coaching, redirecting the user to their own judgment and colleagues.

Rationale: the CRM agent's job is to save time retrieving and synthesizing information, not to replace human judgment in the sales relationship. This is a considered design position, not a technical limitation. The LLM is clearly capable of giving generic advice. The choice was to not let it.

Personal view behind this choice: human judgment and lived experience still bring a kind of creative, outside-the-box thinking in a live negotiation that an LLM, built on statistical patterns rather than lived experience, does not genuinely replicate today. Keeping that space for the human seller was an intentional part of the design, not just a scoping convenience.

## Alignment with the Voyalis proposal (US2, classification and prioritization)

`classify_opportunity_priority` was designed to echo the "classification/prioritization" AI block from the Voyalis pre-sales proposal (NLP-based triage of incoming signals), applied here to sales opportunities instead of operational incidents.

Important honesty check performed before implementing: the Voyalis working documents were re-checked, and no complete category taxonomy was ever defined there. Only "urgence haute" appears as a named example, illustrating the priority-queue mechanism, not a closed list of categories. Rather than inventing a taxonomy and presenting it as if it came from Voyalis, a new taxonomy (`category`: at_risk / ready_to_close / needs_follow_up / stalled, `urgency`: high / medium / low) was built for this context, keeping the same structure (category plus urgency, human correction implied) without claiming false fidelity to unwritten Voyalis vocabulary.

## Forced structured output for classification

`classify_opportunity_priority` uses an internal, agent-invisible tool (`record_classification`) called with `tool_choice: { type: 'tool', name: 'record_classification' }`. This forces Claude to respond via that tool's schema rather than free text, guaranteeing valid `category`/`urgency` enum values and eliminating the need to parse or validate free-form JSON. This tool is never exposed in `toolDefinitions`. It only exists inside the `handleClassifyOpportunityPriority` function.

## Cost and scale consideration: classification does not scale linearly as implemented

Observed in testing: a request like "which opportunities are at risk?" triggered one `get_opportunity_details` call plus one `classify_opportunity_priority` call per active opportunity (9 calls each, for 9 open deals). This is negligible at demo scale (12 total opportunities) but would not scale to a real CRM with thousands of open deals. Cost and latency would grow linearly with the number of opportunities classified per question.

This mirrors a trade-off already identified in the Voyalis proposal itself (the explicit choice not to settle between a single-LLM approach and a hybrid pipeline with classical ML pre-filtering). It is a real example of the same class of architecture decision showing up in a different, hands-on context.

## Testing approach

Automated tests (Vitest) cover `queries.ts` only, the most stable and deterministic layer of the project. An in-memory SQLite database is mocked in place of the real connection (`vi.mock('./connection', ...)` with `vi.hoisted`), so tests run without touching the real `crm.db` and without any API cost. Tools that call the Anthropic API (`summarize_opportunity_notes`, `classify_opportunity_priority`) are not covered by automated tests. They were verified manually during development instead, since mocking non-deterministic LLM output was judged out of scope for the MVP timeline.

## Known limitations

- No automated tests on the AI-calling tools or the agent conversation loop itself.
- No real-time streaming of tool execution. The trace panel updates only once the full response is ready.
- Classification cost and latency do not scale to a large dataset (see above).
- No rate limiting or usage caps on the API key if the interface were ever exposed publicly (kept local and private for this reason).
- The API key has a fixed expiration date (31/12/2026) and will need manual rotation.