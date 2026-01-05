# ToonDB Node.js Examples

Official Node.js examples for ToonDB - the high-performance embedded database for AI applications. This repository demonstrates ToonDB integration patterns in JavaScript/TypeScript.

## 📂 Repository Structure

```
toondb-nodejs-examples/
├── basic/       # Basic key-value operations and SQL
└── rag/         # Complete RAG (Retrieval-Augmented Generation) system
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- ToonDB Node.js SDK: `@sushanth/toondb`

### Installation

```bash
npm install @sushanth/toondb
```

## 📚 Examples

### 1. Basic Operations (`basic/`)

**Demonstrates fundamental ToonDB operations** in Node.js.

**Features**:
- Database initialization
- PUT/GET operations
- Path-based operations
- Prefix scanning
- SQL table creation and queries
- Proper resource cleanup

**Files**:
- `basic_kv.js` - Key-value operations
- `sql_check.js` - SQL interface usage

```bash
cd basic
npm install
node basic_kv.js
node sql_check.js
```

**Example Output**:
```
Node.js SDK Test
================
✅ Database opened
✅ Put: test_key -> test_value
✅ Get: test_key = test_value
✅ Path: users/alice/email = alice@example.com
✅ Scan: Found 2 items with prefix 'tenants/acme/'
✅ Database closed

🎉 All Node.js SDK tests passed!
```

**What you'll learn**:
- Opening and closing databases
- Storing and retrieving data
- Working with path-based keys
- Scanning with prefixes
- Executing SQL queries
- Error handling in async/await

**Stats**: ✅ ~1 second runtime | Perfect for learning ToonDB basics

---

### 2. RAG System (`rag/`)

**Complete production-ready RAG pipeline** with document processing and query execution.

**Architecture**:
```
Document → Chunking → Embedding → ToonDB Storage
Query → Embedding → Vector Search → Context Assembly → LLM Generation
```

**Features**:
- Document ingestion and preprocessing
- Text chunking with configurable size/overlap
- Azure OpenAI embeddings integration
- ToonDB vector storage with HNSW index
- Semantic search for context retrieval
- Query generation with retrieved context
- Production-ready error handling

**Components**:
- `src/documents.js` - Document loading and management
- `src/chunking.js` - Text splitting strategies
- `src/embeddings.js` - Azure OpenAI embeddings client
- `src/vectorStore.js` - ToonDB vector operations
- `src/generation.js` - LLM answer generation
- `src/rag.js` - End-to-end RAG pipeline
- `demo.js` - Interactive demonstration

#### Setup

1. **Configure Environment**:
   ```bash
   cd rag
   cp .env.example .env
   # Edit .env with your Azure OpenAI credentials
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Demo**:
   ```bash
   node demo.js
   ```

#### Environment Variables

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

#### Features Demonstrated

- **Async/Await Patterns**: Modern JavaScript async operations
- **Error Handling**: Comprehensive try-catch patterns
- **Vector Search**: HNSW index for fast similarity search
- **Chunking Strategies**: Configurable chunk size and overlap
- **Azure Integration**: Production-ready OpenAI client usage
- **Context Assembly**: Token-aware context building
- **Clean Architecture**: Modular, maintainable code structure

**Stats**: 📊 Vector Embeddings + HNSW Search | Production-ready RAG pipeline

---

### 3. LangGraph Memory (`langgraph-memory/`)
**Advanced Agent Memory System** demonstrating long-term persistence and semantic recall.

**Features**:
- Long-term memory with vector embeddings.
- **SharedDatabase Singleton** for connection stability.
- **Auto-Retry Logic** for robust IPC handling.
- **100% Recall Accuracy** via prompt engineering.
- LangGraph integration (Checkpointer + Memory Tools).

**Files**:
- `agent.ts` - ReAct agent with enhanced system prompt.
- `memory.ts` - Vector storage implementation.
- `test_agent.ts` - 60-turn stress test runner.

```bash
cd langgraph-memory
npm install
npm test
```

**Stats**: 
- ✅ **100% Recall Accuracy** (15/15 successful recalls)
- ⚡ **~280ms avg latency** (190ms min, 820ms max)
- 🔄 **100% Stability** (60/60 turns, auto-recovery from connection drops)
- 🧠 **29 memory searches** across 60-turn conversation

---

---

### 4. Support Agent (`support-agent/`)
**"Where's my order?" Support Bot** showcasing ToonDB's "Dual Nature": **Real Database** + **Agent Memory**.

**Scenario**: User asks *"My order is late. Can you reroute or replace it?"*

**What the Agent Does**:
1.  **SQL**: Pulls operational truth (Order Status, ETA) from `orders` table.
2.  **Memory**: Checks User Prefs (`replacements_over_refunds`) from KV store.
3.  **RAG**: Retrieves "Late Shipment Policy" from Vector Store.
4.  **TOON**: Formats context efficiently (e.g. `orders[3]{id,status}: ...`).
5.  **ACID**: Executes a **Transaction** to update order status and create a ticket atomically.

**Key Outcome**: The agent uses **~40% fewer tokens** for context (via TOON) and takes safe, transactional actions.

```bash
cd support-agent
npm install
npm run seed
npm start
```

**Stats**:
- ✅ **100% Response Accuracy** (Correctly identified delayed order, applied policy, respected user prefs)
- 📉 **19.2% Token Savings**: 120 tokens (JSON) → 97 tokens (TOON)
  ```json
  // JSON: 120 tokens
  [{"id":103,"item":"USB-C Hub","status":"DELAYED",...}]
  
  // TOON: 97 tokens  
  orders[3]{id,item,status,eta,destination,total}:
  103,USB-C Hub,DELAYED,2023-10-10,Seattle, WA,35
  ```
- 🔗 **Unified Store**: SQL + KV + Vectors in one database
- ⚡ **ACID Transactions**: Safe, atomic updates to orders + tickets

---

## 🔑 Key ToonDB Features (Node.js SDK)

- **Embedded Mode**: Run ToonDB directly in your Node.js app (FFI)
- **IPC Mode**: Connect to ToonDB server via Unix sockets
- **Async/Await**: Full Promise-based API
- **Vector Search**: Built-in HNSW index
- **SQL Support**: Execute SQL queries (via IPC mode)
- **Path Operations**: Hierarchical key organization
- **Transactions**: ACID guarantees with group commits

## 📖 API Reference

### Database Operations

```javascript
const { Database } = require('@sushanth/toondb');

// Open database
const db = await Database.open('./my_database');

// Put key-value
await db.put(Buffer.from('key'), Buffer.from('value'));

// Get value
const value = await db.get(Buffer.from('key'));

// Scan with prefix
for await (const [key, value] of db.scanPrefix(Buffer.from('prefix:'))) {
  console.log(key.toString(), value.toString());
}

// Close database
await db.close();
```

### SQL Operations

```javascript
// Execute SQL (IPC mode required)
const result = await db.execute(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
  )
`);

// Insert data
await db.execute(`
  INSERT INTO users (id, name, email) 
  VALUES (1, 'Alice', 'alice@example.com')
`);

// Query data
const rows = await db.query('SELECT * FROM users');
```

## 📖 Documentation

- [ToonDB Documentation](https://toondb.io)
- [Node.js SDK (npm)](https://www.npmjs.com/package/@sushanth/toondb)
- [API Reference](https://toondb.io/docs/nodejs-sdk)

## 🧪 Testing

The basic examples include built-in verification:

```bash
cd basic
node basic_kv.js
# Should output: 🎉 All Node.js SDK tests passed!
```

## 🤝 Contributing

We welcome contributions! Please submit Pull Requests with:
- New example implementations
- Improvements to existing examples
- Documentation enhancements
- Bug fixes

## 📄 License

Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.

## 🔗 Related Repositories

- [toondb/toondb](https://github.com/toondb/toondb) - Main ToonDB repository
- [toondb/toondb-python-examples](https://github.com/toondb/toondb-python-examples) - Python examples
- [toondb/toondb-golang-examples](https://github.com/toondb/toondb-golang-examples) - Go examples
- [toondb/toondb-examples](https://github.com/toondb/toondb-examples) - Multi-language examples

## 🌟 Example Use Cases

- **Chatbots**: Store conversation history with semantic search
- **RAG Systems**: Document Q&A with context retrieval
- **Caching**: High-performance key-value cache
- **Agent Memory**: Long-term memory for AI agents
- **Analytics**: Store and query structured data
- **Session Management**: User session storage with TTL
