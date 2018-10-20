import * as chai from "chai";

import { IEvent, ServerSideEvents } from "lightside";
import { RedisClient } from "redis";

import { RedisBus } from "../../src/bus/redis";

import { FakeRedis } from "./fake-redis";

chai.should();

class TestableSSE extends ServerSideEvents {

    public sent: any[] = [];

    public send(event: IEvent | string | Buffer) {
        this.sent.push(event);
    }
}

const network = () => new Promise(resolve => {
    // setTimeout(resolve, 10);
    process.nextTick(resolve);
});

describe("RedisBus", () => {

    let redis: FakeRedis;
    let bus: RedisBus;

    beforeEach(() => {
        redis = new FakeRedis();
        bus = new RedisBus(redis as any as RedisClient);
    });

    it("reference counts subscriptions", async () => {
        const a = new TestableSSE();
        const b = new TestableSSE();
        bus.register(["mreynolds", "zoe"], a);
        bus.register(["itskaylee", "zoe"], b);

        redis.subscribeCalls.should.deep.equal([
            ["mreynolds", "zoe"],
            ["itskaylee"],
        ]);

        bus.unregister(["mreynolds", "zoe"], a);
        redis.unsubscribeCalls.should.deep.equal([
            ["mreynolds"],
        ]);

        // NOTE: dup unsubscribe should not change anything,
        // since the SSE instance is not actually subscribed
        bus.unregister(["mreynolds", "zoe"], a);
        redis.unsubscribeCalls.should.deep.equal([
            ["mreynolds"],
        ]);

        bus.unregister(["itskaylee", "zoe"], b);
        redis.unsubscribeCalls.should.deep.equal([
            ["mreynolds"],
            ["itskaylee", "zoe"],
        ]);

    });
});
