// Manual example script — calls the real Anthropic API and consumes a small
// amount of paid tokens each time it runs. Not an automated test.
// Run with: npx ts-node examples/summarize-example.ts

import { handleSummarizeOpportunityNotes } from '../src/tools/handlers';

const sampleNotes =
  "Pierre est très technique et pose beaucoup de questions sur la sécurité des données et l'hébergement. Il a évoqué à plusieurs reprises des inquiétudes sur la conformité RGPD du sous-traitant hébergeur pressenti, ce qui bloque actuellement la signature malgré un accord de principe sur le prix et le périmètre fonctionnel. Une réunion technique dédiée est prévue la semaine prochaine avec son équipe sécurité pour lever ce point.";

handleSummarizeOpportunityNotes({ notes: sampleNotes }).then((result) => {
  console.log('Summary:', result);
});