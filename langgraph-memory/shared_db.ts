import { Database } from "@sushanth/toondb";
import * as dotenv from "dotenv";

dotenv.config();

export class SharedDatabase {
    private static instance: SharedDatabase;
    private db: Database | null = null;
    private dbPath: string;

    private constructor() {
        this.dbPath = process.env.TOONDB_PATH || "./toondb_data_node";
    }

    public static getInstance(): SharedDatabase {
        if (!SharedDatabase.instance) {
            SharedDatabase.instance = new SharedDatabase();
        }
        return SharedDatabase.instance;
    }

    async init() {
        if (!this.db) {
            console.log(`[SharedDB] Opening ToonDB at ${this.dbPath}...`);
            this.db = await Database.open(this.dbPath);
        }
    }

    getDb(): Database | null {
        return this.db;
    }

    async getDbOrInit(): Promise<Database> {
        if (!this.db) {
            await this.init();
        }
        return this.db!;
    }

    async execute<T>(operation: (db: Database) => Promise<T>, retries = 5): Promise<T> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const db = await this.getDbOrInit();
                return await operation(db);
            } catch (error: any) {
                console.warn(`[SharedDB] Operation failed (attempt ${attempt}/${retries}):`, error.message || error);

                const isConnectionError = error?.message?.includes("ConnectionError") ||
                    error?.message?.includes("Not connected") ||
                    error?.message?.includes("Connection closed") ||
                    error?.message?.includes("DatabaseError") ||
                    error?.name === "DatabaseError";

                if (isConnectionError && attempt < retries) {
                    console.warn(`[SharedDB] Connection error detected. Reconnecting...`);
                    await this.close();
                    // Wait a bit before reconnecting (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 200 * attempt));
                    continue;
                }
                throw error;
            }
        }
        throw new Error("Max retries exceeded");
    }

    async close() {
        if (this.db) {
            console.log("[SharedDB] Closing ToonDB connection...");
            try {
                await this.db.close();
            } catch (e) {
                // Ignore close errors
            }
            this.db = null;
        }
    }
}

export const sharedDb = SharedDatabase.getInstance();
