import { IEvent, ServerSideEvents } from "lightside";
import { RedisClient } from "redis";

import { ICountableDarksideBus, SimpleDarksideBus } from "../interface";
import { MemoryBus } from "./memory";

/**
 * Redis-backed IDarksideBus implementation. The RedisBus does not
 * duplicate logic for handling local connections, but instead acts
 * as a layer on top of another bus, providing cross-process bridging
 * via Redis pubsub.
 */
export class RedisBus extends SimpleDarksideBus {

    /**
     * @param redis The main RedisClient, used to publish events
     * @param sub The RedisClient to use for subscriptions. It
     *  will be put into pubsub mode if not already there. Defaults
     *  to `redis.duplicate()`.
     * @param local An [ICountableDarksideBus] to whom local connections
     *  are delegated. Defaults to a new [MemoryBus].
     */
    constructor(
        private redis: RedisClient,

        /**
         * sub is a separate connection on which we process
         * pubsub commands, since a connection in pubsub mode
         * can ONLY process pubsub commands. By default we just
         * duplicate the main `redis` client, but you can provide
         * your own if you need more control
         */
        private sub: RedisClient = redis.duplicate(),

        private local: ICountableDarksideBus = new MemoryBus(),
    ) {
        super();

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
