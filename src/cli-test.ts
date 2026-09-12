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

    const answer = await runAgent(question);
    console.log('\n' + answer + '\n');
    ask();
  });
}

ask();