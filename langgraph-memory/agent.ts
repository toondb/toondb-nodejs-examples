
import { StateGraph, END, START, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AzureChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as dotenv from "dotenv";
import { memoryStore } from "./memory";
import { checkpointer } from "./checkpointer";

dotenv.config();

// Define Tools
const saveMemoryTool = tool(
    async ({ content }: { content: string }) => {
        try {
            if (!content || content.trim() === "None") return "Error: Content cannot be empty";
            console.log(`\n💾 Saving memory: '${content}'`);
            await memoryStore.addEpisode(content);
            return "Memory saved successfully.";
        } catch (e) {
            return `Failed to save memory: ${e}`;
        }
    },
    {
        name: "save_memory",
        description: "Save important information, facts, or context to long-term memory.",
        schema: z.object({
            content: z.string().describe("The information to save.")
        })
    }
);

const recallMemoryTool = tool(
    async ({ query }: { query: string }) => {
        try {
            console.log(`\n🔍 Searching memory for: '${query}'`);
            const results = await memoryStore.searchMemories(query, 5);
            if (results.length === 0) return "No relevant memories found.";
            return `Found memories:\n${results.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
        } catch (e) {
            return `Failed to recall memory: ${e}`;
        }
    },
    {
        name: "recall_memory",
        description: "Search long-term memory for relevant information using a natural language query.",
        schema: z.object({
            query: z.string().describe("The query to search for.")
        })
    }
);

const tools = [saveMemoryTool, recallMemoryTool];
const toolNode = new ToolNode(tools);

// Define Model
const model = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: "susha-m9k30wc7-eastus2",
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1",
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    temperature: 0.7,
    maxTokens: 1000,
}).bindTools(tools);

import { SystemMessage } from "@langchain/core/messages";

// ... imports

// Define Graph Nodes
async function agentNode(state: typeof MessagesAnnotation.State) {
    const systemPrompt = new SystemMessage(
        "You are a helpful assistant with long-term memory. " +
        "You MUST use the `recall_memory` tool to check for information about the user before answering any factual question about them. " +
        "DO NOT rely on your short-term context alone effectively if you are recalling facts. " +
        "Always double-check your long-term memory for details about the user's name, hobbies, preferences, work, pets, or life events. " +
        "If the user asks a question about themselves, your FIRST action should almost always be `recall_memory`."
    );

    // Check if system prompt is already the first message (to avoid duplicating it in loop if state persists)
    // For this simple graph, we can just prepend it to the invoke call or ensure it's in history.
    // A simpler way for this 'one-shot' node style is to prepend it to the messages passed to model.
    const messages = [systemPrompt, ...state.messages];

    const result = await model.invoke(messages);
    return { messages: [result] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
    }
    return END;
}

// Build Graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    // @ts-ignore
    .addConditionalEdges("agent", shouldContinue, ["tools", END]) // Explicit destinations
    // @ts-ignore
    .addEdge("tools", "agent");

// Compile with checkpointer
// Casting checkpointer to any to bypass potential version mismatch or structural typing issues in TS
export const app = workflow.compile({ checkpointer: checkpointer as any });

if (require.main === module) {
    (async () => {
        console.log("Initializing SochDB LangGraph Agent (Node.js)...");

        // @ts-ignore
        const config = { configurable: { thread_id: "demo_thread_node_1" } };
        const input = new HumanMessage("Hello! My name is Antigravity (Node.js).");

        const stream = await app.stream({ messages: [input] }, config);

        for await (const chunk of stream) {
            // Pretty print output
        }

        const snapshot = await app.getState(config);
        const lastMsg = snapshot.values.messages[snapshot.values.messages.length - 1];
        console.log("Agent:", lastMsg.content);
    })();
}
