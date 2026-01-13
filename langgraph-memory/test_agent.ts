
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { app } from "./agent";
import { memoryStore } from "./memory";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { sharedDb } from "./shared_db";

interface TurnRecord {
    turn: number;
    user: string;
    agent: string;
    timestamp: number;
}

interface RecallTest {
    turn: number;
    query: string;
    expected: string;
    response: string;
    success: boolean;
}

class ConversationTester {
    private threadId: string;
    private config: any;
    private history: TurnRecord[] = [];
    private facts: { key: string, value: string }[] = [];
    private recallTests: RecallTest[] = [];

    constructor() {
        this.threadId = `test_60_turns_node_${Math.floor(Date.now() / 1000)}`;
        this.config = { configurable: { thread_id: this.threadId } };
    }

    async runTurn(message: string, turnNum: number): Promise<string> {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`Turn ${turnNum}/60`);
        console.log(`${"=".repeat(80)}`);
        console.log(`User: ${message}`);

        let agentResponse = "";
        const input = new HumanMessage(message);

        try {
            const stream = await app.stream({ messages: [input] }, { ...this.config, streamMode: "values" });

            for await (const chunk of stream) {
                if (chunk.messages && chunk.messages.length > 0) {
                    const lastMsg = chunk.messages[chunk.messages.length - 1];
                    if (lastMsg._getType() === "ai" && lastMsg.content) {
                        agentResponse = lastMsg.content as string;
                    }
                }
            }

            console.log(`Agent: ${agentResponse}`);

            this.history.push({
                turn: turnNum,
                user: message,
                agent: agentResponse,
                timestamp: Date.now()
            });

        } catch (e) {
            console.error(`❌ Error on turn ${turnNum}:`, e);
        }

        return agentResponse;
    }

    async testRecall(query: string, expected: string, turnNum: number) {
        const response = await this.runTurn(query, turnNum);
        const success = response.toLowerCase().includes(expected.toLowerCase());

        this.recallTests.push({
            turn: turnNum,
            query,
            expected,
            response,
            success
        });

        if (success) {
            console.log("✅ Memory recall successful!");
        } else {
            console.log(`❌ Memory recall failed! Expected '${expected}' in response.`);
        }
    }

    addFact(key: string, value: string) {
        this.facts.push({ key, value });
    }

    async runTest() {
        console.log("\n🚀 Starting 60-Turn Conversation Test with SochDB Agent (Node.js)");

        // Phase 1: Fact Gathering
        console.log("\n📋 PHASE 1: Introduction and Fact Gathering (15 turns)");
        await this.runTurn("Hello! My name is Sushanth.", 1); this.addFact("name", "Sushanth");
        await this.runTurn("I work at SochDB as a software engineer.", 2); this.addFact("job", "software engineer at SochDB");
        await this.runTurn("I'm 28 years old.", 3); this.addFact("age", "28");
        await this.runTurn("I live in Seattle, Washington.", 4); this.addFact("location", "Seattle, Washington");
        await this.runTurn("My favorite programming language is TypeScript.", 5); this.addFact("favorite_language", "TypeScript");
        await this.runTurn("I love building AI agents and working with LLMs.", 6); this.addFact("interests", "AI agents and LLMs");
        await this.runTurn("I have a dog named Max.", 7); this.addFact("pet", "dog named Max");
        await this.runTurn("I graduated from University of Washington.", 8); this.addFact("education", "University of Washington");
        await this.runTurn("My favorite food is tacos.", 9); this.addFact("favorite_food", "tacos");
        await this.runTurn("I enjoy hiking on weekends.", 10); this.addFact("hobby", "hiking");
        await this.runTurn("I'm working on a vector database project.", 11); this.addFact("current_project", "vector database");
        await this.runTurn("I speak English and Spanish.", 12); this.addFact("languages", "English and Spanish");
        await this.runTurn("I have 5 years of experience in software development.", 13); this.addFact("experience", "5 years");
        await this.runTurn("I'm interested in learning more about distributed systems.", 14); this.addFact("learning_interest", "distributed systems");
        await this.runTurn("I drink tea every morning.", 15); this.addFact("habit", "drinks tea");

        // Phase 2: Recall Tests
        console.log("\n🧪 PHASE 2: Memory Recall Tests (15 turns)");
        console.log("Switching to new thread to force memory recall...");
        this.config.configurable.thread_id = `${this.threadId}_phase2`;

        await this.testRecall("What is my name?", "Sushanth", 16);
        await this.testRecall("Where do I work?", "SochDB", 17);
        await this.testRecall("How old am I?", "28", 18);
        await this.testRecall("Where do I live?", "Seattle", 19);
        await this.testRecall("What's my favorite programming language?", "TypeScript", 20);
        await this.testRecall("What do I like to build?", "AI agents", 21);
        await this.testRecall("Do I have any pets?", "Max", 22);
        await this.testRecall("Where did I go to college?", "University of Washington", 23);
        await this.testRecall("What's my favorite food?", "tacos", 24);
        await this.testRecall("What do I do on weekends?", "hiking", 25);
        await this.testRecall("What project am I working on?", "vector database", 26);
        await this.testRecall("What languages do I speak?", "Spanish", 27);
        await this.testRecall("How many years of experience do I have?", "5", 28);
        await this.testRecall("What am I interested in learning?", "distributed systems", 29);
        await this.testRecall("What do I drink in the morning?", "tea", 30);

        // Phase 3: Complex Interactions
        console.log("\n💬 PHASE 3: Complex Interactions (15 turns)");
        await this.runTurn("Can you summarize what you know about me?", 31);
        await this.runTurn("I just adopted a cat named Luna!", 32); this.addFact("new_pet", "cat named Luna");
        await this.runTurn("I got promoted to Senior Software Engineer!", 33); this.addFact("promotion", "Senior Software Engineer");
        await this.runTurn("I'm planning to move to San Francisco next month.", 34); this.addFact("future_move", "San Francisco");
        await this.runTurn("I started learning Rust recently.", 35); this.addFact("new_skill", "learning Rust");
        await this.runTurn("Tell me about my pets.", 36);
        await this.runTurn("What's my current job title?", 37);
        await this.runTurn("I completed a marathon last weekend!", 38); this.addFact("achievement", "completed marathon");
        await this.runTurn("I'm reading a book about database internals.", 39); this.addFact("current_reading", "database internals");
        await this.runTurn("My favorite movie is The Matrix.", 40); this.addFact("favorite_movie", "The Matrix");
        await this.runTurn("What do you remember about my hobbies?", 41);
        await this.runTurn("I'm allergic to peanuts.", 42); this.addFact("allergy", "peanuts");
        await this.runTurn("I play guitar in my free time.", 43); this.addFact("instrument", "guitar");
        await this.runTurn("What are all the things I'm learning?", 44);
        await this.runTurn("I have a brother named Ravi.", 45); this.addFact("family", "brother named Ravi");

        // Phase 4: Stress Test
        console.log("\n🔥 PHASE 4: Stress Test and Edge Cases (15 turns)");
        await this.runTurn("List everything you know about my professional life.", 46);
        await this.runTurn("What are my dietary preferences and restrictions?", 47);
        await this.runTurn("Tell me about my family and pets.", 48);
        await this.runTurn("Actually, I'm 29 now, not 28. I had a birthday!", 49); this.addFact("age_update", "29");
        await this.runTurn("How old am I now?", 50);
        await this.runTurn("I changed my mind about moving to San Francisco. I'm staying in Seattle.", 51);
        await this.runTurn("Where am I planning to live?", 52);
        await this.runTurn("What programming languages do I know?", 53);
        await this.runTurn("What are all my hobbies and interests?", 54);
        await this.runTurn("Tell me about my education and work experience.", 55);
        await this.runTurn("Give me a complete summary of everything you know about me.", 56);
        await this.runTurn("What's the most recent thing I told you?", 57);
        await this.runTurn("How many pets do I have and what are their names?", 58);
        await this.runTurn("What are my career goals and learning interests?", 59);
        await this.runTurn("Thank you for this conversation! Can you recap our chat?", 60);

        this.generateReport();
    }

    generateReport() {
        const totalTurns = this.history.length;
        const totalRecalls = this.recallTests.length;
        const successfulRecalls = this.recallTests.filter(t => t.success).length;
        const memoryStats = memoryStore.getStats();

        console.log(`\n${"=".repeat(80)}`);
        console.log("TEST REPORT");
        console.log(`${"=".repeat(80)}`);
        console.log(`\n📊 Overall Statistics:`);
        console.log(`  Total conversation turns: ${totalTurns}`);
        console.log(`  Successful recalls: ${successfulRecalls}/${totalRecalls}`);
        console.log(`  Recall accuracy: ${(successfulRecalls / totalRecalls * 100).toFixed(1)}%`);
        console.log(`\n🧠 Memory Performance:`);
        console.log(`  Total searches: ${memoryStats.count}`);
        console.log(`  Avg latency: ${memoryStats.avgTimeMs.toFixed(2)}ms`);
        console.log(`  Min latency: ${memoryStats.minTimeMs === Number.MAX_VALUE ? 0 : memoryStats.minTimeMs.toFixed(2)}ms`);
        console.log(`  Max latency: ${memoryStats.maxTimeMs.toFixed(2)}ms`);

        const report = {
            statistics: {
                total_turns: totalTurns,
                total_recalls: totalRecalls,
                successful_recalls: successfulRecalls,
                recall_accuracy: totalRecalls > 0 ? successfulRecalls / totalRecalls : 0,
                total_facts: this.facts.length
            },
            memory_performance: memoryStats,
            recall_tests: this.recallTests,
            conversation_history: this.history,
            facts_stored: this.facts
        };

        const fileName = `test_report_${this.threadId}.json`;
        fs.writeFileSync(fileName, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${fileName}`);
    }
}

if (require.main === module) {
    (async () => {
        const tester = new ConversationTester();
        await tester.runTest();

        // Cleanup
        await sharedDb.close();
    })();
}
