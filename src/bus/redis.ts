import { IEvent, ServerSideEvents } from "lightside";
import { RedisClient } from "redis";

import { SimpleDarksideBus } from "../interface";
import { MemoryBus } from "./memory";

/**
 * Redis-backed IDarksideBus implementation
 */
export class RedisBus extends SimpleDarksideBus {

    private sub: RedisClient;
    private local = new MemoryBus();

    constructor(
        private redis: RedisClient,
    ) {
        super();

        // duplicate, because in subscribe mode we can only send
        // subscription-related commands
        this.sub = redis.duplicate();
        this.sub.on("message", (channelId, message) => {
            const { event } = JSON.parse(message);
            this.local.send(channelId, event);
        });
    }

    public send(channelId: string, event: string | IEvent | Buffer): boolean {
        // we could maybe add metadata so we can send to local connections
        // *now* without waiting for the pubsub, but it's probably
        // not worth sacrificing the simplicity we have...
        this.redis.publish(channelId, JSON.stringify({ event }));
        return true;
    }

    protected _register1(channelId: string, events: ServerSideEvents): void {
        if (this.local.countInChannel(channelId) === 0) {
            this.sub.subscribe(channelId);
        }

        this.local.register(channelId, events);
    }

    protected _registerN(channelIds: string[], events: ServerSideEvents): void {
        const newChannels = channelIds.filter(id =>
            this.local.countInChannel(id) === 0,
        );
        if (newChannels.length) {
            this.sub.subscribe(newChannels);
        }

        this.local.register(channelIds, events);
    }

    protected _unregister1(channelId: string, subscriber: ServerSideEvents): void {
        if (this.local.countInChannel(channelId) > 0) {
            this.local.unregister(channelId, subscriber);
            if (this.local.countInChannel(channelId) <= 0) {
                this.sub.unsubscribe(channelId);
            }
        }
    }

    protected _unregisterN(channelIds: string[], subscriber: ServerSideEvents): void {
        // first, check which channels are actually still registered
        const existingChannels = channelIds.filter(id =>
            this.local.countInChannel(id) > 0,
        );

        // then, attempt to unregister this subscriber from them
        this.local.unregister(existingChannels, subscriber);

        // let redis know which channels we emptied (if any)
        const staleChannels = existingChannels.filter(id =>
            this.local.countInChannel(id) <= 0,
        );
        if (staleChannels.length) {
            this.sub.unsubscribe(staleChannels);
        }
    }
}
