# ToonDB Node.js Agent Test

This directory contains a Node.js implementation of the ToonDB LangGraph agent and a comprehensive 60-turn conversation test suite.

## Prerequisites

- Node.js (v18+)
- npm
- An Azure OpenAI API Key (configured in `.env` or parent `.env`)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The `.env` file should be configured with your Azure OpenAI credentials and ToonDB paths:

```env
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4.1
TOONDB_PATH=./toondb_data_node
```

## Running the Agent

You can run the agent directly for a simple demo:
```bash
npm start
```
This runs `agent.ts`.

## Running the 60-Turn Test

To execute the comprehensive test suite:
```bash
npm test
```
This runs `test_agent.ts`.

## Implementation Details

- **`memory.ts`**: Implements `ToonDBMemory` class using `@sushanth/toondb` for persistent storage and semantic search (using cosine similarity on vector embeddings).
- **`checkpointer.ts`**: Implements `ToonDBCheckpointer` for LangGraph state persistence.
- **`shared_db.ts`**: Implements a `SharedDatabase` singleton with **auto-retry logic** to handle connection stability and concurrency robustly.
- **`agent.ts`**: Defines the LangGraph agent with `save_memory` and `recall_memory` tools.
- **`test_agent.ts`**: The test runner that executes 60 turns of conversation, verifying memory recall accuracy and generating a JSON report.

## Architecture & Robustness

To ensure high reliability under load, this implementation uses a **Shared Database Singleton** pattern (`shared_db.ts`). This prevents multiple concurrent IPC connections from exhausting server resources or causing race conditions.

Features:
- **Singleton Pattern**: Ensures a single, reusable database connection across the entire application process.
- **Auto-Retry Logic**: Automatically detects `ConnectionError` or `DatabaseError` and re-establishes the connection with exponential backoff (up to 5 retries).
- **Graceful Shutdown**: Properly closes the shared connection on process exit.

## Benchmarks & Performance

Running the 60-turn stress test (`npm test`) yields the following performance metrics:

### Stability
- **Success Rate**: 100% (60/60 turns completed without crash).
- **Recovery**: Transparently recovers from induced connection drops.

### Memory Recall
- **Accuracy**: **100%** (15/15 successful recalls).
- **Latency**:
  - Average: ~280ms
  - Min: ~190ms
  - Max: ~820ms

> **Note**: High recall accuracy is achieved via a strict system prompt in `agent.ts` that enforces the use of the `recall_memory` tool for every user-related question, overcoming potential agent "laziness".
