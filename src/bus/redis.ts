import { IEvent, ServerSideEvents } from "lightside";
import { RedisClient } from "redis";

import { IDarksideBus } from "../interface";
import { MemoryBus } from "./memory";

/**
 * Redis-backed IDarksideBus implementation
 */
class RedisBus implements IDarksideBus {

    private sub: RedisClient;
    private local = new MemoryBus();

    constructor(
        private redis: RedisClient,
    ) {
        // duplicate, because in subscribe mode we can only send
        // subscription-related commands
        this.sub = redis.duplicate();
        this.sub.on("message", (channelId, message) => {
            const { event } = JSON.parse(message);
            this.local.send(channelId, message);
        });
    }

    send(channelId: string, event: string | IEvent | Buffer): boolean {
        // TODO is it worth it to add metadata so we can send
        // to local connections *now* without waiting for the pubsub?
        this.redis.publish(channelId, JSON.stringify({event: event}));
        return true;
    }

    register(channelId: string, events: ServerSideEvents): void {
        this.sub.subscribe(channelId);
        this.local.register(channelId, events);
    }

    unregister(channelId: string, events: ServerSideEvents): void {
        this.sub.unsubscribe(channelId);
        this.local.unregister(channelId, events);
    }

}
