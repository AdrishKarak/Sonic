# Conventions

## API & Data Fetching
- **tRPC:** Use tRPC for all internal API communication. 
    - `baseProcedure`: Public procedures (rare).
    - `authProcedure`: Requires a valid user session (Clerk).
    - `orgProcedure`: Requires both a user session and an active organization selection.
- **Zod:** Use Zod for all input validation in tRPC routers and environment variables.
- **REST:** Reserve REST endpoints (`src/app/api`) only for webhooks, file streaming, or external API consumption.
- **Server Actions:** Prefer tRPC over Next.js Server Actions for consistency and better client-side state management (via TanStack Query).

## Code Organization
- **Feature-based Folders:** Group logic by feature in `src/features`. Each feature should typically contain:
    - `components/`: Feature-specific UI.
    - `hooks/`: Feature-specific logic.
    - `views/`: Higher-level page components.
    - `data/`: Constants or schemas.
- **Path Aliases:** Always use `@/` for imports from `src/`.
- **Prisma Client:** Import the singleton Prisma client from `@/lib/db`. Note that the generated types are located in `@/generated/prisma`.

## Styling
- **Tailwind CSS 4:** Use utility classes for all styling.
- **Class Merging:** Always use the `cn()` utility from `@/lib/utils` for conditional classes or merging.
- **Components:** Use shadcn/ui components located in `src/components/ui`. Wrap them in feature-specific components if they need specific business logic.

## Environment Variables
- All environment variables must be defined and validated in `src/lib/env.ts` using `@t3-oss/env-nextjs`.
- Never use `process.env` directly in the codebase; import `env` from `@/lib/env`.

## Async Tasks
- Non-critical async tasks (like Polar usage ingestion) should be handled with `try/catch` and should not block the main response if they fail. Use Sentry to log these failures.
- Critical operations (like database writes or R2 uploads) must be awaited and handled with proper error boundaries.