# ToonDB "Support Agent" Example

This example demonstrates how to build a production-ready AI agent using ToonDB as the **Unified Memory & Operational Store**.

It showcases the "Dual Nature" of ToonDB:
1.  **Real Database**: SQL tables for Orders/Tickets, KV for User Prefs, ACID Transactions.
2.  **Agent Memory**: Vector Search for Policies, TOON formatting for efficient context.

## 🚀 What it Does

The agent handles a user query: *"My order is late. Can you reroute or replace it?"*

1.  **SQL Retrieval**: Fetches recent orders from `orders` table (Operational Truth).
2.  **TOON Formatting**: Converts order rows into **TOON** format (Compact, LLM-friendly).
3.  **KV Lookup**: Checks user preferences (`replacements_over_refunds`) from KV store.
4.  **Vector Search** (Simulated): Retrieves relevant policies ("Late Shipment", "Replacement") using embeddings.
5.  **Reasoning**: The LLM uses this unified context to propose a **Replacement** (based on policy + user pref).
6.  **Transaction**: Simulates an atomic SQL transaction to update the order status and create a ticket.

## 🛠️ Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set Environment**:
    Ensure `../.env` contains your `AZURE_OPENAI_API_KEY` etc.

3.  **Seed Data**:
    Populates SQL tables and Vectors.
    ```bash
    npm run seed
    ```

4.  **Run Agent**:
    ```bash
    npm start
    ```

## 🧠 Key Concepts Demonstrated

### 1. TOON Formatting (Token Efficiency)
Instead of bulky JSON, we pass SQL rows as:
```text
orders[3]{id,item,status...}:
103,USB-C Hub,DELAYED...
102,Mechanical Keyboard...
```
This reduces token usage by **~40-60%** for tabular data.

### 2. Unified Context
One database call path (`db.execute`, `db.get`) handles both structured business data and unstructured semantic search, eliminating the need for "Glue Code" between a SQL DB and a Vector DB.

### 3. ACID Transactions
Agents can take **safe actions**. ToonDB guarantees that updating the order status and creating a support ticket happen atomically.
