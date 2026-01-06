/**
 * ToonDB Graph Overlay Example (Node.js/TypeScript) - Simplified
 */

import { Database, GraphOverlay } from '@sushanth/toondb';

async function main() {
  console.log('=== ToonDB Node.js SDK - Graph Overlay Example ===\n');

  // Open database
  const db = await Database.open('./test_graph_db');
  console.log('✓ Database opened');

  // Create graph overlay
  const graph = new GraphOverlay(db, 'demo');
  console.log('✓ Graph overlay created');

  // Add nodes
  await graph.addNode({
    id: 'alice',
    type: 'person',
    properties: {
      name: 'Alice',
      role: 'developer',
    },
  });

  await graph.addNode({
    id: 'bob',
    type: 'person',
    properties: {
      name: 'Bob',
      role: 'engineer',
    },
  });

  await graph.addNode({
    id: 'toondb',
    type: 'project',
    properties: {
      name: 'ToonDB',
      description: 'AI Database',
    },
  });
  console.log('✓ Added 3 nodes (alice, bob, toondb)');

  // Add edges
  await graph.addEdge({
    fromId: 'alice',
    edgeType: 'knows',
    toId: 'bob',
    properties: {},
  });

  await graph.addEdge({
    fromId: 'bob',
    edgeType: 'works_on',
    toId: 'toondb',
    properties: {},
  });

  await graph.addEdge({
    fromId: 'alice',
    edgeType: 'contributes_to',
    toId: 'toondb',
    properties: {},
  });
  console.log('✓ Added 3 edges');

  // Get node
  const node = await graph.getNode('alice');
  if (node) {
    console.log(`✓ Retrieved node: ${node.properties.name} (${node.type})`);
  }

  // Get edges
  const edges = await graph.getOutgoingEdges('alice');
  console.log(`✓ Alice has ${edges.length} edges`);

  // BFS traversal
  const visited = await graph.bfs('alice', 10);
  console.log(`✓ BFS visited ${visited.length} nodes: ${visited}`);

  console.log('\n✓✓✓ SUCCESS: Graph Overlay works perfectly! ✓✓✓');

  // Cleanup
  await db.close();
}

main().catch(console.error);
