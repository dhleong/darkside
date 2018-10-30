import * as chai from "chai";

import { ServerSideEvents } from "lightside";

import { Channel } from "../src";

import { TestableSSE } from "./testable-sse";

chai.should();

describe("Channel", () => {
    it("sendWhen works", () => {
        const c1 = new TestableSSE();
        const c2 = new TestableSSE();
        const c3 = new TestableSSE();

        const c = new Channel();
        c.add(c1);
        c.add(c2);
        c.add(c3);

        c.sendWhen("event", cli => cli === c2);

        c1.sent.should.be.empty;
        c3.sent.should.be.empty;
        c2.sent.should.deep.equal(["event"]);
    });

    it("sendWhen short-circuits", () => {
        const c1 = new TestableSSE();
        const c2 = new TestableSSE();
        const c3 = new TestableSSE();

        const c = new Channel();
        c.add(c1);
        c.add(c2);
        c.add(c3);

        const calledWith: ServerSideEvents[] = [];
        c.sendWhen("event", cli => {
            calledWith.push(cli);
            return null;
        });

        c1.sent.should.be.empty;
        c2.sent.should.be.empty;
        c3.sent.should.be.empty;

        calledWith.should.deep.equal([c1]);
    });
});
