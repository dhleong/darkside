import { IEvent, ServerSideEvents } from "lightside";

export class TestableSSE extends ServerSideEvents {

    public sent: any[] = [];

    public send(event: IEvent | string | Buffer) {
        this.sent.push(event);
    }
}
