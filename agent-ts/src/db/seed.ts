// Seed MongoDB with sample users, orders, and knowledge documents.
//
// Run after db/indexes.ts:
//
//     pnpm db:seed

import dotenv from 'dotenv';
import { closeMongoClient, getDb } from './client';
import { embedTexts } from '../tools/embeddings';

dotenv.config({ path: '.env.local' });

async function seedData(): Promise<void> {
  const db = await getDb();

  for (const name of ['users', 'orders', 'knowledge', 'memories', 'sessions']) {
    await db.collection(name).deleteMany({});
  }
  console.info('Cleared existing data from all collections');

  const now = new Date();

  const users = [
    {
      user_id: 'user_1',
      name: 'Jordan',
      email: 'jordan@example.com',
      preferences: { language: 'en', timezone: 'America/New_York' },
      created_at: now,
    },
    {
      user_id: 'user_2',
      name: 'Casey',
      email: 'casey@example.com',
      preferences: { language: 'en', timezone: 'Europe/London' },
      created_at: now,
    },
  ];
  await db.collection('users').insertMany(users);
  console.info(`Inserted ${users.length} users`);

  const orders = [
    {
      user_id: 'user_1',
      order_id: 'order_1001',
      items: ['Widget A', 'Widget B'],
      total: 49.99,
      status: 'delivered',
      created_at: now,
    },
    {
      user_id: 'user_1',
      order_id: 'order_1002',
      items: ['Gadget X'],
      total: 29.99,
      status: 'pending',
      created_at: now,
    },
  ];
  await db.collection('orders').insertMany(orders);
  console.info(`Inserted ${orders.length} orders`);

  const knowledgeInputs = [
    {
      title: 'Handling interruptions',
      content:
        'Voice agents detect speech during a reply and pause playback. ' +
        'Use disallow_interruptions inside function tools that mutate state.',
      category: 'voice-agents',
    },
    {
      title: 'Session telemetry and metrics',
      content:
        'Use session.usage to collect per-model usage metrics. ' +
        'Export from on_session_end alongside the session report.',
      category: 'deployment',
    },
    {
      title: 'Choosing an STT provider',
      content:
        'LiveKit Inference supports Deepgram Nova-3, AssemblyAI, and ' +
        'others. Prefer models with built-in endpointing for realtime.',
      category: 'models',
    },
    {
      title: 'Voice agent RAG pattern',
      content:
        'Run vector search inside on_user_turn_completed and inject ' +
        'results into the chat context before the LLM replies.',
      category: 'patterns',
    },
    {
      title: 'Agentic memory pattern',
      content:
        'Expose remember, recall, forget, and search_memory as tools ' +
        'so the LLM decides what persists across sessions.',
      category: 'patterns',
    },
  ];

  const embeddings = await embedTexts(
    knowledgeInputs.map((doc) => doc.content),
    { inputType: 'document' },
  );
  const knowledgeDocs = knowledgeInputs.map((doc, i) => ({
    ...doc,
    embedding: embeddings[i],
    created_at: now,
  }));
  await db.collection('knowledge').insertMany(knowledgeDocs);
  console.info(
    `Inserted ${knowledgeDocs.length} knowledge documents with embeddings`,
  );

  console.info('Seed complete.');
}

async function main(): Promise<void> {
  try {
    await seedData();
  } finally {
    await closeMongoClient();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
