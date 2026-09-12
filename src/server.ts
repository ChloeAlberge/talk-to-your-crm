import express from 'express';
import path from 'path';
import { runAgent } from './agent';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body as {
    message?: string;
    history?: Anthropic.MessageParam[];
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "message" field.' });
  }

  try {
    const result = await runAgent(message, history || []);
    res.json(result);
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ error: 'Something went wrong while processing your request.' });
  }
});

app.listen(PORT, () => {
  console.log(`talk-to-your-crm running at http://localhost:${PORT}`);
});