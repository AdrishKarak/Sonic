import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
    status: baseProcedure.query(() => {
        return {
            status: "ok"
        };
    }),
});

export type AppRouter = typeof appRouter;