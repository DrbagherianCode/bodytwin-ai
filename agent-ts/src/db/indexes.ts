// Create MongoDB Atlas collections, indexes, and search indexes.
//
// Run once after configuring MONGODB_URI:
//
//     pnpm db:init
//
// Search indexes take ~1-2 minutes to become queryable on Atlas after
// creation.
//
// Requires MongoDB 8.0 or later because searchMemory uses the $rankFusion
// aggregation stage for hybrid vector + text retrieval. Atlas M10+ dedicated
// clusters run 8.0 by default; verify shared-tier clusters (M0/M2/M5) before
// running this script.

import dotenv from 'dotenv';
import { closeMongoClient, getDb } from './client';
import { EMBEDDING_DIMENSIONS } from '../tools/embeddings';

dotenv.config({ path: '.env.local' });

interface SearchIndexSpec {
  name: string;
  type: 'vectorSearch' | 'search';
  definition: Record<string, unknown>;
}

function vectorIndex(name: string): SearchIndexSpec {
  return {
    name,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: EMBEDDING_DIMENSIONS,
          similarity: 'cosine',
        },
        { type: 'filter', path: 'user_id' },
        { type: 'filter', path: 'tenant_id' },
      ],
    },
  };
}

// Full-text search index on `memory_type` + `content`. Paired with
// memories_embedding_index inside the $rankFusion pipeline in
// tools/memory.searchMemory. Token fields on user_id and tenant_id let
// the text branch $match per-user scope cheaply.
function memoriesTextIndex(): SearchIndexSpec {
  return {
    name: 'memories_text_index',
    type: 'search',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          memory_type: { type: 'string', analyzer: 'lucene.standard' },
          content: { type: 'string', analyzer: 'lucene.standard' },
          user_id: { type: 'token' },
          tenant_id: { type: 'token' },
        },
      },
    },
  };
}

function isAlreadyExistsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg = (err as { message?: string }).message?.toLowerCase() ?? '';
  return msg.includes('already exists') || msg.includes('duplicate');
}

export async function createIndexes(): Promise<void> {
  const db = await getDb();

  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  );
  for (const name of ['users', 'orders', 'sessions', 'knowledge', 'memories']) {
    if (!existing.has(name)) {
      await db.createCollection(name);
      console.info(`${name}: collection created`);
    }
  }

  await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
  console.info('users: user_id unique index ready');

  await db.collection('orders').createIndex({ order_id: 1 }, { unique: true });
  await db.collection('orders').createIndex({ user_id: 1 });
  console.info('orders: order_id unique + user_id indexes ready');

  await db.collection('sessions').createIndex({ session_id: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ user_id: 1 });
  console.info('sessions: session_id unique + user_id indexes ready');

  await db
    .collection('memories')
    .createIndex(
      { user_id: 1, tenant_id: 1, memory_type: 1 },
      { unique: true, name: 'memories_slot_unique' },
    );
  console.info('memories: (user_id, tenant_id, memory_type) unique index ready');

  const searchIndexes: ReadonlyArray<{ collection: string; spec: SearchIndexSpec }> = [
    { collection: 'knowledge', spec: vectorIndex('knowledge_embedding_index') },
    { collection: 'memories', spec: vectorIndex('memories_embedding_index') },
    { collection: 'memories', spec: memoriesTextIndex() },
  ];
  for (const { collection, spec } of searchIndexes) {
    try {
      await db.collection(collection).createSearchIndex(spec);
      console.info(`${collection}: ${spec.name} search index created`);
    } catch (err) {
      if (isAlreadyExistsError(err)) {
        console.info(`${collection}: ${spec.name} already exists`);
      } else {
        throw err;
      }
    }
  }

  console.info('Done. Search indexes need ~1-2 minutes to sync on Atlas.');
}

async function main(): Promise<void> {
  try {
    await createIndexes();
  } finally {
    await closeMongoClient();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
