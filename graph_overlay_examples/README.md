# ToonDB New Features Examples (Node.js/TypeScript)

This directory contains TypeScript examples demonstrating the new features in ToonDB v0.3.x.

## Examples

### 1. Graph Overlay (`graph-overlay.ts`)

Lightweight graph layer on KV storage for agent memory:

```typescript
import { Database, GraphOverlay, GraphNode, GraphEdge } from '@sushanth/toondb';

const db = await Database.open('./db');
const graph = new GraphOverlay(db, 'memory');

// Create nodes
await graph.addNode({
  id: 'user_1',
  type: 'person',
  properties: { name: 'Alice' },
});

// Create edges
await graph.addEdge({
  fromId: 'user_1',
  edgeType: 'knows',
  toId: 'user_2',
});

// Traverse
const visited = await graph.bfs('user_1', 3);
```

### 2. Context Query (`context-query.ts`)

Token-aware retrieval for LLM applications:

```typescript
import { ContextQuery, DeduplicationStrategy } from '@sushanth/toondb';

const query = new ContextQuery(db, 'docs')
  .withTokenBudget(4000)
  .withQuery('How does vector search work?')
  .withDeduplication(DeduplicationStrategy.SEMANTIC)
  .withTopK(10);

const result = await query.execute();
console.log(`Used ${result.totalTokens} tokens`);
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Link local SDK (for development):
   ```bash
   npm link ../../toondb-nodejs-sdk
   ```

3. Run examples:
   ```bash
   npx ts-node graph-overlay.ts
   npx ts-node context-query.ts
   ```

## Features Demonstrated

| Feature | File | Description |
|---------|------|-------------|
| Graph Overlay | `graph-overlay.ts` | Nodes, edges, BFS/DFS traversal, neighbors |
| Context Query | `context-query.ts` | Token budgeting, deduplication, hybrid search |
| Policy Hooks | `policy-hooks.ts` | Validation, redaction, access control |
| Tool Routing | `tool-routing.ts` | Agent registry, routing strategies, failover |

## Requirements

- Node.js 18+
- TypeScript 5.0+
- ToonDB Node.js SDK v0.3.x

## Package.json

```json
{
  "name": "toondb-new-features-examples",
  "type": "module",
  "scripts": {
    "graph": "ts-node graph-overlay.ts",
    "context": "ts-node context-query.ts"
  },
  "dependencies": {
    "@sushanth/toondb": "^0.3.3"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.0.0"
  }
}
```
