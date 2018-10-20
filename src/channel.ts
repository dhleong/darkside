import { IEvent, ServerSideEvents } from "lightside";

export class Channel {
    private members: Set<ServerSideEvents> = new Set();

    public add(member: ServerSideEvents) {
        this.members.add(member);
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
}
