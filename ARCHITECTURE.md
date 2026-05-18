# Architecture

Resonance is a modern AI-powered text-to-speech platform built with a serverless-first mindset.

## High-Level Flow
1. **Frontend:** Next.js (App Router) + React 19 + Tailwind CSS 4.
2. **API Layer:** tRPC for end-to-end typesafe communication.
3. **Auth:** Clerk for user authentication and organization-based access control.
4. **TTS Engine:** Python/FastAPI running on Modal (GPU-accelerated) for voice cloning and synthesis.
5. **Storage:** Cloudflare R2 (S3-compatible) for hosting voice samples and generated audio.
6. **Database:** PostgreSQL managed via Prisma ORM.
7. **Billing:** Polar.sh for subscription management and usage-based metering.
8. **Observability:** Sentry for error tracking and performance monitoring.

## System Modules

### Core App (`src/app`)
- Next.js App Router structure.
- `(dashboard)`: Authenticated user interface.
- `api/`: REST endpoints (audio streaming, webhooks).
- `trpc/`: tRPC client and server setup.

### Features (`src/features`)
The project follows a feature-based organization to keep logic encapsulated:
- `voices/`: Voice discovery, management, and cloning.
- `text-to-speech/`: The generation interface and history.
- `billing/`: Subscription status and Polar integration.
- `dashboard/`: Shared layout and navigation components.

### Backend Services
- **tRPC Routers (`src/trpc/routers`):** Define the business logic and data fetching.
- **Prisma (`prisma/`):** Schema definition and migrations. Client is generated in `src/generated/prisma`.
- **Chatterbox (Modal):** A dedicated Python service (`chatterbox_tts.py`) that handles the heavy lifting of audio synthesis using GPUs.

### Shared Libraries (`src/lib`)
- `db.ts`: Prisma client singleton.
- `env.ts`: Typesafe environment variables via `@t3-oss/env-nextjs`.
- `r2.ts`: Cloudflare R2 client and signed URL helpers.
- `polar.ts`: Polar SDK client.
- `chatterbox-client.ts`: Typed client for the Modal TTS API.

## Data Flow: Generation Pipeline
1. Client calls `generations.create` via tRPC.
2. `orgProcedure` validates Clerk session and active organization.
3. `polar.customers.getStateExternal` verifies an active subscription.
4. Voice data is retrieved from Prisma (checking permissions).
5. Request sent to Chatterbox API (Modal).
6. Modal reads voice sample from R2 (mounted via `CloudBucketMount`).
7. Modal synthesizes audio and streams it back.
8. Audio buffer is uploaded to R2.
9. Metadata is saved to Prisma.
10. Usage event is ingested into Polar for metering.
11. Success response returned to client.