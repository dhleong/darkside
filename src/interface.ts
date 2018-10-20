import { IEvent, ServerSideEvents } from "lightside";

export interface IDarksideBus {
    send(channelId: string, event: IEvent | string | Buffer): boolean;
    register(channelId: string, events: ServerSideEvents): void;
    unregister(channelId: string, events: ServerSideEvents): void;
}
