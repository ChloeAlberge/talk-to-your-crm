import { runAgent } from './agent';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('CRM Agent - tape ta question (ou "exit" pour quitter)\n');

function ask() {
  rl.question('> ', async (question) => {
    if (question.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const { answer, trace } = await runAgent(question);
    if (trace.length > 0) {
      console.log('\n[Actions]');
      trace.forEach((t) => console.log(`  - ${t.tool}(${JSON.stringify(t.input)})`));
    }
    console.log('\n' + answer + '\n');
    ask();
  });
}

ask();