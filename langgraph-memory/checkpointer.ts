
import {
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    PendingWrite
} from "@langchain/langgraph-checkpoint";
import { RunnableConfig } from "@langchain/core/runnables";
import { Database } from "@sochdb/sochdb";
import * as dotenv from "dotenv";
import { sharedDb } from "./shared_db";

dotenv.config();

export class SochDBCheckpointer extends BaseCheckpointSaver {

    constructor() {
        super();
    }

    async init() {
        await sharedDb.init();
    }

    async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
        await this.init();
        const thread_id = config.configurable?.thread_id;
        const checkpoint_id = config.configurable?.checkpoint_id;

        if (!thread_id) return undefined;

        if (checkpoint_id) {
            const key = `checkpoints/${thread_id}/${checkpoint_id}`;
            const data = await sharedDb.execute(db => db.get(key));
            if (data) {
                return this.parseCheckpointData(data, thread_id, checkpoint_id);
            }
        } else {
            const prefix = `checkpoints/${thread_id}/`;
            const results = await sharedDb.execute(db => db.scan(prefix));

            if (results.length > 0) {
                results.sort((a, b) => b.key.toString().localeCompare(a.key.toString()));
                const latest = results[0];
                const ckpt_id = latest.key.toString().split('/').pop();
                return this.parseCheckpointData(latest.value, thread_id, ckpt_id!);
            }
        }

        return undefined;
    }

    async *list(config: RunnableConfig, options?: any): AsyncGenerator<CheckpointTuple> {
        await this.init();
        const thread_id = config.configurable?.thread_id;
        if (!thread_id) return;

        const prefix = `checkpoints/${thread_id}/`;
        const results = await sharedDb.execute(db => db.scan(prefix));

        // Sort descending
        results.sort((a, b) => b.key.toString().localeCompare(a.key.toString()));

        const limit = options?.limit;
        let count = 0;

        for (const item of results) {
            const ckpt_id = item.key.toString().split('/').pop();
            const tuple = await this.parseCheckpointData(item.value, thread_id, ckpt_id!);
            if (tuple) {
                yield tuple;
                count++;
            }
            if (limit && count >= limit) break;
        }
    }

    async put(
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        newVersions: Record<string, string | number>
    ): Promise<RunnableConfig> {
        await this.init();
        const thread_id = config.configurable?.thread_id;
        const checkpoint_id = checkpoint.id;

        const key = `checkpoints/${thread_id}/${checkpoint_id}`;

        const data = {
            checkpoint,
            metadata,
            parent_config: config.configurable?.thread_ts
        };

        await sharedDb.execute(db => db.put(key, JSON.stringify(data)));

        return {
            configurable: {
                thread_id,
                checkpoint_id
            }
        };
    }

    async putWrites(
        config: RunnableConfig,
        writes: PendingWrite[],
        taskId: string
    ): Promise<void> {
        await this.init();
        const thread_id = config.configurable?.thread_id;
        const checkpoint_id = config.configurable?.checkpoint_id;

        for (let i = 0; i < writes.length; i++) {
            const [channel, value] = writes[i];
            const key = `writes/${thread_id}/${checkpoint_id}/${taskId}/${i}`;

            const data = {
                taskId,
                channel,
                value
            };

            await sharedDb.execute(db => db.put(key, JSON.stringify(data)));
        }
    }

    private async parseCheckpointData(
        value: Buffer,
        thread_id: string,
        checkpoint_id: string
    ): Promise<CheckpointTuple | undefined> {
        try {
            const data = JSON.parse(value.toString());
            return {
                config: { configurable: { thread_id, checkpoint_id } },
                checkpoint: data.checkpoint,
                metadata: data.metadata,
                parentConfig: data.parent_config ? { configurable: { thread_id, checkpoint_id: data.parent_config } } : undefined
            };
        } catch (e) {
            console.error("Failed to parse checkpoint:", e);
            return undefined;
        }
    }
}

export const checkpointer = new SochDBCheckpointer();
