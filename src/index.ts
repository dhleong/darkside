import * as koa from "koa";
import "lightside";

import { IDarksideBus } from "./interface";

export { MemoryBus } from "./bus/memory";

/**
 * Middleware factory.
 *
 * @param bus The Bus on which clients will listen for events
 * @param extractChannelIds Given a Koa Context, return a channel ID
 *                          or list of channel IDs to listen on
 * @param onClose If provided, will be called with the context of
 *                any registered SSE clients when they go away
 */
export function darkside(opts: {
    bus: IDarksideBus,
    extractChannelIds: (ctx: koa.Context) => Promise<string[] | string>,
    onClose?: (ctx: koa.Context) => any;
}) {
    return async (ctx: koa.Context, next: () => Promise<any>) => {

        if (!ctx.events) {
            throw new Error("lightside has not been initialized");
        }

        const channelIds = await opts.extractChannelIds(ctx);
        if (typeof channelIds === "string") {
            opts.bus.register(channelIds, ctx.events);
        } else {
            for (const id of channelIds) {
                opts.bus.register(id, ctx.events);
            }
        }

        ctx.events.on("close", () => {
            if (opts.onClose) opts.onClose(ctx);

            if (typeof channelIds === "string") {
                opts.bus.unregister(channelIds, ctx.events);
            } else {
                for (const id of channelIds) {
                    opts.bus.unregister(id, ctx.events);
                }
            }
        });

        return next();
    };
}
