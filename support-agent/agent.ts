
import { Database } from "@sochdb/sochdb";
import * as dotenv from "dotenv";
import { AzureChatOpenAI } from "@langchain/openai";
import { rowsToToon, estimateTokens } from "./utils.ts";

dotenv.config({ path: "../.env" });

const DB_PATH = "./toondb_support_data";

async function main() {
    console.log("🚀 Starting ToonDB Support Agent...");

    const db = await Database.open(DB_PATH);

    // User Context
    const USER_ID = 123;
    const QUESTION = "My order is late. Can you reroute or replace it?";
    console.log(`\n👤 User: ${QUESTION}`);

    // 1. Retrieve Operational Truth (SQL)
    console.log("\n📊 1. Querying SQL (Orders)...");
    // @ts-ignore
    const result = await db.execute(
        `SELECT id, item, status, eta, destination, total FROM orders WHERE user_id = ${USER_ID} ORDER BY id DESC LIMIT 5`
    );
    console.log("DEBUG: SQL Query Result:", JSON.stringify(result, null, 2));

    // Convert to TOON
    const fields = ["id", "item", "status", "eta", "destination", "total"];
    // @ts-ignore
    // Assuming execute returns array of rows or { rows: [] }
    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    const ordersToon = rowsToToon("orders", rows, fields);
    console.log("   -> TOON Context (Compact):");
    console.log(ordersToon.trim());

    // 2. Retrieve User Prefs (KV)
    console.log("\n🧠 2. Fetching User Prefs (KV)...");
    const prefRaw = await db.get(Buffer.from(`users/${USER_ID}/prefs/replacements_over_refunds`));
    const prefersReplacement = prefRaw ? prefRaw.toString() === "true" : false;
    console.log(`   -> Prefers Replacement: ${prefersReplacement}`);

    // 3. Retrieve Policies (Vector/RAG Simulation)
    // In a real scenario, this would use `collection.search(embedding)`. 
    // For this example, we fetch the seeded docs.
    console.log("\n📚 3. Retrieving Policies (RAG)...");
    const policies = [];
    for (let i = 0; i < 4; i++) {
        const p = await db.get(Buffer.from(`policies/${i}`));
        if (p) policies.push(p.toString());
    }
    // Simple Keyword Simulation for "ContextQuery" budgeting
    const relevantPolicies = policies.filter(p =>
        p.toLowerCase().includes("late") ||
        p.toLowerCase().includes("replacement") ||
        p.toLowerCase().includes("reroute")
    );
    const policyContext = relevantPolicies.join("\n");
    console.log(`   -> Found ${relevantPolicies.length} relevant policies.`);

    // 4. Construct Prompt (Prompt Packing)
    console.log("\n🎁 4. Constructing Prompt with TOON...");
    const prompt = `
System: You are a helpful support agent. Use the provided context to answer the user.
Follow policy strictly. If the user prefers replacements, suggest that first.

Context:
- User ID: ${USER_ID}
- Prefers Replacement: ${prefersReplacement}

Recent Orders (TOON format):
${ordersToon}

Relevant Policies:
${policyContext}

User Question: "${QUESTION}"

Answer:
    `.trim();

    // 5. Call LLM
    console.log("\n🤖 5. Calling LLM...");
    const model = new AzureChatOpenAI({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiInstanceName: "susha-m9k30wc7-eastus2",
        azureOpenAIApiDeploymentName: "gpt-4.1",
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        temperature: 0,
    });

    const response = await model.invoke(prompt);
    console.log(`\n💬 Agent Response:\n${response.content}`);

    // 6. Action (Simulated Transaction)
    // If the agent suggests an action, we would execute it transactionally.
    if (response.content.toString().toLowerCase().includes("replacement")) {
        console.log("\n⚡ 6. Executing Transaction (Simulated)...");
        console.log("   BEGIN TRANSACTION");
        console.log("   -> UPDATE orders SET status='REPLACEMENT_REQUESTED' WHERE id=103");
        console.log("   -> INSERT INTO tickets (order_id, reason) VALUES (103, 'Late Shipment Replacement')");
        console.log("   COMMIT");

        // Actual code (commented out as logic depends on parsing the specific order ID from LLM)
        /*
        await db.execute("BEGIN");
        await db.execute("UPDATE orders SET status = ...", ...);
        await db.execute("INSERT INTO tickets ...", ...);
        await db.execute("COMMIT");
        */
    }

    await db.close();
}

main().catch(console.error);
