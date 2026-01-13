/**
 * SochDB Graph Overlay Example (Node.js/TypeScript)
 *
 * Demonstrates the Graph Overlay feature for agent memory,
 * providing lightweight graph operations on top of KV storage.
 */

import {
  Database,
  GraphOverlay,
  GraphNode,
  GraphEdge,
  TraversalDirection,
} from '@sochdb/sochdb';

async function main() {
  console.log('=== SochDB Graph Overlay Example (Node.js) ===\n');

  // Open database
  const db = await Database.open('./graph_example_db');

  // Create graph overlay
  const graph = new GraphOverlay(db, 'memory');

  // -------------------------------------------------------
  // 1. Create nodes
  // -------------------------------------------------------
  console.log('1. Creating nodes...');

  // Create user nodes
  await graph.addNode({
    id: 'user_alice',
    type: 'person',
    properties: {
      name: 'Alice',
      role: 'developer',
      interests: ['typescript', 'databases', 'ai'],
    },
  });

  await graph.addNode({
    id: 'user_bob',
    type: 'person',
    properties: {
      name: 'Bob',
      role: 'data scientist',
    },
  });

  // Create project node
  await graph.addNode({
    id: 'project_sochdb',
    type: 'project',
    properties: {
      name: 'SochDB',
      status: 'active',
      techStack: ['rust', 'typescript', 'python', 'go'],
    },
  });

  // Create concept node
  await graph.addNode({
    id: 'concept_graph_overlay',
    type: 'concept',
    properties: {
      name: 'Graph Overlay',
      category: 'feature',
    },
  });

  console.log('   Created 4 nodes');

  // -------------------------------------------------------
  // 2. Create edges
  // -------------------------------------------------------
  console.log('\n2. Creating edges...');

  // Alice works on ToonDB
  await graph.addEdge({
    fromId: 'user_alice',
    edgeType: 'works_on',
    toId: 'project_toondb',
    properties: { role: 'lead developer', since: '2024-01' },
  });

  // Bob works on ToonDB
  await graph.addEdge({
    fromId: 'user_bob',
    edgeType: 'works_on',
    toId: 'project_toondb',
  });

  // Alice knows Bob
  await graph.addEdge({
    fromId: 'user_alice',
    edgeType: 'knows',
    toId: 'user_bob',
    properties: { context: 'work colleagues' },
  });

  // ToonDB has graph overlay feature
  await graph.addEdge({
    fromId: 'project_toondb',
    edgeType: 'has_feature',
    toId: 'concept_graph_overlay',
  });

  console.log('   Created 4 edges');

  // -------------------------------------------------------
  // 3. Query nodes
  // -------------------------------------------------------
  console.log('\n3. Querying nodes...');

  const alice = await graph.getNode('user_alice');
  if (alice) {
    console.log(`   Found: ${alice.properties.name} (${alice.type})`);
    console.log(`   Interests: ${alice.properties.interests}`);
  }

  // -------------------------------------------------------
  // 4. Get outgoing edges
  // -------------------------------------------------------
  console.log('\n4. Getting outgoing edges from Alice...');

  const edges = await graph.getEdges('user_alice');
  for (const edge of edges) {
    console.log(`   ${edge.fromId} --[${edge.edgeType}]--> ${edge.toId}`);
  }

  // -------------------------------------------------------
  // 5. Get incoming edges
  // -------------------------------------------------------
  console.log('\n5. Getting incoming edges to ToonDB project...');

  const incoming = await graph.getIncomingEdges('project_toondb');
  for (const edge of incoming) {
    console.log(`   ${edge.fromId} --[${edge.edgeType}]--> ${edge.toId}`);
  }

  // -------------------------------------------------------
  // 6. BFS traversal
  // -------------------------------------------------------
  console.log('\n6. BFS traversal from Alice (max depth 2)...');

  const visited = await graph.bfs('user_alice', 2);
  console.log(`   Visited: ${visited.join(', ')}`);

  // -------------------------------------------------------
  // 7. DFS traversal
  // -------------------------------------------------------
  console.log('\n7. DFS traversal from Alice...');

  const visitedDfs = await graph.dfs('user_alice', 2);
  console.log(`   Visited (DFS): ${visitedDfs.join(', ')}`);

  // -------------------------------------------------------
  // 8. Get neighbors
  // -------------------------------------------------------
  console.log('\n8. Getting neighbors of ToonDB project...');

  const neighbors = await graph.getNeighbors('project_toondb', TraversalDirection.BOTH);
  for (const n of neighbors) {
    const node = await graph.getNode(n.id);
    if (node) {
      console.log(`   Neighbor: ${n.id} (${node.type})`);
    }
  }

  // -------------------------------------------------------
  // 9. Find nodes by type
  // -------------------------------------------------------
  console.log('\n9. Finding all "person" nodes...');

  const people = await graph.getNodesByType('person', 10);
  for (const p of people) {
    console.log(`   ${p.properties.name} - ${p.properties.role}`);
  }

  // -------------------------------------------------------
  // 10. Cleanup
  // -------------------------------------------------------
  console.log('\n10. Cleaning up...');

  const deletedEdge = await graph.deleteEdge('user_alice', 'knows', 'user_bob');
  console.log(`    Deleted edge: ${deletedEdge}`);

  const deletedNode = await graph.deleteNode('concept_graph_overlay');
  console.log(`    Deleted node: ${deletedNode}`);

  await db.close();
  console.log('\n=== Graph Overlay Example Complete ===');
}

main().catch(console.error);
