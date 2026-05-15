import { createTRPCRouter } from '../init';
import { generationsRouter } from './generations';
import { voicesRouter } from './voices';

export const appRouter = createTRPCRouter({
    voices: voicesRouter,
    generations: generationsRouter
});

export type AppRouter = typeof appRouter;