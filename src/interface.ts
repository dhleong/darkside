import { IEvent, ServerSideEvents } from "lightside";

export interface IDarksideBus {
    send(channelId: string, event: IEvent | string | Buffer): boolean;

    register(channelIds: string | string[], subscriber: ServerSideEvents): void;
    unregister(channelIds: string | string[], subscriber: ServerSideEvents): void;
}

/**
 * ILocalDarksideBus is a special case of IDarksideBus
 * which can directly track the number of clients listening
 * to a given channel.
 */
export interface ICountableDarksideBus extends IDarksideBus {
    countInChannel(channelId: string): number;
}

/**
 * Abstract base class that simplifies handling of 1 vs N channels for register/unregister
 */
export abstract class SimpleDarksideBus implements IDarksideBus {
    public abstract send(channelId: string, event: IEvent | string | Buffer): boolean;

    public register(channelIds: string | string[], subscriber: ServerSideEvents): void {
        if (typeof channelIds === "string") {
            this._register1(channelIds, subscriber);
        } else {
            this._registerN(channelIds, subscriber);
        }
    }

    public unregister(channelIds: string | string[], subscriber: ServerSideEvents): void {
        if (typeof channelIds === "string") {
            this._unregister1(channelIds, subscriber);
        } else {
            this._unregisterN(channelIds, subscriber);
        }
    }

    /**
     * Implement single channel subscription
     */
    protected abstract _register1(channelId: string, subscriber: ServerSideEvents): void;

    /**
     * If your bus has a more efficient way of subscribing to multiple channels at once
     */
    protected _registerN(channelIds: string[], subscriber: ServerSideEvents): void {
        for (const c of channelIds) {
            this._register1(c, subscriber);
        }
    }

    protected abstract _unregister1(channelId: string, subscriber: ServerSideEvents): void;

    protected _unregisterN(channelIds: string[], subscriber: ServerSideEvents): void {
        for (const c of channelIds) {
            this._unregister1(c, subscriber);
        }
    }

}
