import { IDarksideBus } from "../interface";
import { IEvent, ServerSideEvents } from "lightside";
import { Channel } from "../channel";

/**
 * Simple, in-memory Bus implementation
 */
export class MemoryBus implements IDarksideBus {

    private channels: {[id: string]: Channel} = {};

    send(channelId: string, event: IEvent | string | Buffer): boolean {
        const c = this.channels[channelId];
        if (!c) return false;

        return c.send(event);
    }

    register(channelId: string, events: ServerSideEvents): void {
        if (!this.channels[channelId]) {
            this.channels[channelId] = new Channel();
        }
        this.channels[channelId].add(events);
    }

    unregister(channelId: string, events: ServerSideEvents): void {
        const c = this.channels[channelId];
        if (!c) return;

        c.remove(events);
    }
}
