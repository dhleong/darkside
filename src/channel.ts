import { IEvent, ServerSideEvents } from "lightside";

export class Channel {
    private members: Set<ServerSideEvents> = new Set();

    get size(): number {
        return this.members.size;
    }

    public add(member: ServerSideEvents) {
        this.members.add(member);
    }

    /**
     * NOTE: Returns the same set instance used internally
     * for efficiency. Modifications to the returned set
     * will be reflected in this channel, and may cause
     * inconsistencies with other users of this Channel.
     * Consider creating a copy of the set if you need
     * to modify it!
     */
    public getMembers(): Set<ServerSideEvents> {
        return this.members;
    }

    public remove(member: ServerSideEvents) {
        this.members.delete(member);
    }

    public send(event: IEvent | string | Buffer) {
        if (!this.members.size) return false;

        for (const m of this.members) {
            m.send(event);
        }

        return true;
    }

    /**
     * Send to each client for whom [predicate] returns True.
     * If [predicate] returns `null`, [sendWhen] will short-circuit
     */
    public sendWhen(
        event: IEvent | string | Buffer,
        predicate: (client: ServerSideEvents) => boolean | null,
    ) {
        if (!this.members.size) return false;

        for (const m of this.members) {
            const r = predicate(m);
            if (r) m.send(event);
            else if (r === null) break;
        }

        return true;
    }
}
