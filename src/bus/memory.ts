import { IEvent, ServerSideEvents } from "lightside";

import { Channel } from "../channel";
import { ICountableDarksideBus, SimpleDarksideBus } from "../interface";

/**
 * Simple, in-memory Bus implementation
 */
export class MemoryBus extends SimpleDarksideBus implements ICountableDarksideBus {

    private channels: {[id: string]: Channel} = {};

    public countInChannel(channelId: string) {
        const c = this.channels[channelId];
        if (!c) return 0;
        return this.channels[channelId].size;
    }

    public send(channelId: string, event: IEvent | string | Buffer): boolean {
        const c = this.channels[channelId];
        if (!c) return false;

        return c.send(event);
    }

    protected _register1(channelId: string, subscriber: ServerSideEvents) {
        if (!this.channels[channelId]) {
            this.channels[channelId] = new Channel();
        }
        this.channels[channelId].add(subscriber);
    }

    protected _unregister1(channelId: string, events: ServerSideEvents): void {
        const c = this.channels[channelId];
        if (!c) return;

        c.remove(events);
    }
}
