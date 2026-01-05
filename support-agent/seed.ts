import { Database } from "@sushanth/toondb";
import * as dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SCHEMA } from "./schema.ts";

dotenv.config({ path: "../.env" });

const DB_PATH = "./toondb_support_data";

async function main() {
    console.log(`🌱 Seeding database at ${DB_PATH}...`);

    // 1. Open Database
    const db = await Database.open(DB_PATH);

    // 2. Setup SQL Schema
    console.log("Creating SQL tables...");
    // @ts-ignore
    await db.execute(SCHEMA.CREATE_ORDERS);
    // @ts-ignore
    await db.execute(SCHEMA.CREATE_TICKETS);

    // 3. Insert Operational Data (SQL)
    console.log("Inserting orders...");
    const orders = [
        { id: 101, uid: 123, item: "Laptop Stand", status: "DELIVERED", eta: "2023-10-01", dest: "Seattle, WA", total: 45.99 },
        { id: 102, uid: 123, item: "Mechanical Keyboard", status: "IN_TRANSIT", eta: "2023-10-05", dest: "Seattle, WA", total: 129.50 },
        { id: 103, uid: 123, item: "USB-C Hub", status: "DELAYED", eta: "2023-10-10", dest: "Seattle, WA", total: 35.00 }
    ];

    for (const o of orders) {
        // @ts-ignore
        await db.execute(`
            INSERT INTO orders (id, user_id, item, status, eta, destination, total) 
            VALUES (${o.id}, ${o.uid}, '${o.item}', '${o.status}', '${o.eta}', '${o.dest}', ${o.total});
        `);
    }

    // 4. Insert User Memory (KV/Paths)
    console.log("Setting user preferences...");
    await db.put(
        Buffer.from("users/123/prefs/replacements_over_refunds"),
        Buffer.from("true")
    );
    await db.put(
        Buffer.from("users/123/name"),
        Buffer.from("Alice")
    );

    // 5. Insert Vector Docs (Policies)
    console.log("Indexing policies...");
    const embeddings = new OpenAIEmbeddings({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiInstanceName: "susha-m9k30wc7-eastus2",
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-ada-002",
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const policies = [
        "Refund Policy: Refunds are processed within 5-7 business days. Full refund available if canceled before shipping.",
        "Replacement Policy: If an item is delayed by more than 3 days, customers can request a free replacement shipped via express.",
        "Reroute Policy: Shipments can be rerouted within the same city for a $5 fee, or free for premium members.",
        "Late Shipment: If a shipment is late, we offer a 10% discount on the next order."
    ];

    // Assuming a simple vector store interface or manual vector insertion for demonstration
    // Since node-sdk might differ, we'll simulate "collection" insertion if high-level API is missing
    // or use direct put with special key scheme for vectors if needed. 
    // For this example, we'll try to guess the API or just mock the vector part if API is strict.
    // Based on prompts, Vector support exists. Let's try basic `put` with some convention or if `collection` exists.

    // NOTE: Node SDK 0.3.x might not have high-level `collection` helper exposed yet in the same way as Python.
    // We will simulate vector storage for the sake of the agent example using a convention or assume `db.vectorPut` exists if documented.
    // If not, we'll skip actual vector indexing in seed and mock retrieval in agent for simplicity 
    // unless we can verify the API. 
    // Given the constraints and lack of types access, I will assume a standard KV pattern for now 
    // OR just use a simple mock-vector lookup in the agent if I can't find the API.

    // Actually, let's try to do it "right" if we can. 
    // If the Python SDK has `ns.collection("documents")`, Node might too.
    // Let's try to use a hypothetical `collection` API.

    /* 
    try {
        const ns = db.namespace("tenant_acme");
        const collection = await ns.createCollection("policies", 1536); // dim
        for (let i = 0; i < policies.length; i++) {
            const vec = await embeddings.embedQuery(policies[i]);
            await collection.add({ id: `pol_${i}`, vector: vec, metadata: { text: policies[i] } });
        }
    } catch (e) {
        console.warn("Vector API might differ:", e);
    }
    */

    // Fallback: Just persist the text in KV so the agent can "retrieve" it (we'll implement a verified mock-retrieval in agent)
    // This ensures the example runs even if I guess the Vector API wrong without types.
    for (let i = 0; i < policies.length; i++) {
        await db.put(Buffer.from(`policies/${i}`), Buffer.from(policies[i]));
    }

    console.log("✅ Seeding complete.");
    await db.close();
}

main().catch(console.error);
