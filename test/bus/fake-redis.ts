import { RedisClient } from "redis";

export class FakeRedis {

    public publishCalls: Array<[string, string]> = [];
    public subscribeCalls: Array<string | string[]> = [];
    public unsubscribeCalls: Array<string | string[]> = [];

    public duplicate() {
        // not right, but good enough for our purposes
        return this;
    }

    public publish(channel: string, value: string) {
        this.publishCalls.push([channel, value]);
    }

    public subscribe(channels: string | string[]) {
        this.subscribeCalls.push(channels);
    }

    public unsubscribe(channels: string | string[]) {
        this.unsubscribeCalls.push(channels);
    }

    public on(event: string, listener: () => any) {
        // nop
    }

}
