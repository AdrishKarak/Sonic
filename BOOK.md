# Resonance Codebook

This file is a long-form beginner-friendly explanation of how this repository works.

It is written as a guided walkthrough.

The goal is not just to list files.

The goal is to explain:

- what the app is
- what problem it solves
- what packages are installed
- how folders connect to each other
- what happens at runtime
- what each major file is doing
- what parts are generated
- what parts are handwritten
- what you likely did to build this project
- how a beginner should read the repo without getting lost

This is intentionally detailed.

Some explanations are direct facts from the code.

Some explanations about your build process are inferences based on the project structure, installed dependencies, and code patterns.

Whenever something is an inference, I say so clearly.

---

## 1. What This Project Is

This repository is a Next.js 16 application named `resonance`.

It is not a simple static website.

It is a full product-shaped app.

It has:

- a public landing page
- authentication
- organization-based multi-tenant access
- a dashboard
- voice management
- voice cloning
- text-to-speech generation
- storage of uploaded and generated audio
- database persistence
- billing and subscription logic
- observability with Sentry
- a separate Python service for heavy text-to-speech work

In simple words:

You built a SaaS-style AI voice platform.

Users can sign in.

Users belong to organizations.

Organizations can create custom voices.

Organizations can generate speech from text using a selected voice.

The generated audio is saved.

The app tracks usage and checks whether the organization has an active subscription.

That means the project mixes:

- frontend UI work
- backend API work
- database design
- cloud storage
- external AI service integration
- product/business logic

This is why the repo feels much bigger than a beginner Next.js starter.

---

## 2. The Short Mental Model

If you only remember one thing, remember this:

1. Next.js renders pages and UI.
2. Clerk handles sign-in and organization identity.
3. tRPC is the internal typesafe API layer between frontend and backend code.
4. Prisma talks to PostgreSQL.
5. Cloudflare R2 stores raw uploaded voice files and generated `.wav` audio.
6. Polar handles billing and usage metering.
7. A Python Modal service actually generates speech from text and voice audio.

That is the core architecture.

Everything else in the repo supports one or more of those pieces.

---

## 3. What You Likely Built, Step By Step

Based on the codebase, you likely built the app in roughly this order.

This is an inference.

I cannot prove the exact order without full commit history.

But the structure strongly suggests this sequence:

1. You started from a Next.js app.
2. You added Tailwind CSS 4 and `shadcn/ui`.
3. You added a design system and many UI primitives into `src/components/ui`.
4. You added Clerk for authentication and organization switching.
5. You chose the App Router style in `src/app`.
6. You added Prisma and PostgreSQL for persistent data.
7. You designed `Voice` and `Generation` models in Prisma.
8. You added a seed script for built-in voices.
9. You integrated Cloudflare R2 so voice files and generated audio are stored outside the web server.
10. You added tRPC so the frontend and backend share types and procedure names.
11. You added text-to-speech generation flows.
12. You built a separate Python-based TTS service with Modal and FastAPI.
13. You added billing with Polar.
14. You added Sentry for monitoring.
15. You built a stronger public landing page.
16. You added voice recording, drag-and-drop uploads, and playback helpers.

That progression matches the code very well.

---

## 4. High-Level Folder Map

The easiest way to understand this repository is to separate it into layers.

### `src/app`

This is the route layer.

If a user opens a URL, this folder decides what page or API handler responds.

This is the Next.js App Router.

### `src/features`

This is the product logic layer.

Instead of putting everything into one huge `components` folder, the repo groups code by feature.

That is a scalable pattern.

Feature folders here include:

- `dashboard`
- `voices`
- `text-to-speech`
- `billing`

### `src/components`

This is the reusable UI layer.

It contains:

- app-wide shared components
- landing page sections
- a local UI kit in `src/components/ui`
- a voice avatar component

### `src/lib`

This is the shared infrastructure layer.

It contains utility code that talks to services or normalizes configuration.

Examples:

- environment variable validation
- Prisma client setup
- R2 helpers
- Polar client
- Chatterbox API client

### `src/trpc`

This is the internal API contract layer.

This is where procedures, routers, server hydration helpers, and the React-side tRPC provider live.

### `prisma`

This is the database schema and migration layer.

It describes your tables and records schema history.

### `scripts`

This is the operational tooling layer.

These are one-off or maintenance scripts for seeding and generating types.

### `public`

This is static asset storage for images and SVGs served directly by Next.js.

### root files

The root contains config, docs, and service entry points.

Examples:

- `package.json`
- `next.config.ts`
- `eslint.config.mjs`
- `chatterbox_tts.py`
- `README.md`
- `ARCHITECTURE.md`

---

## 5. Runtime Story: What Happens When Someone Uses the App

This section explains the app as a story instead of as disconnected files.

### 5.1 A new visitor opens the site

The request first passes through the Clerk middleware in `src/proxy.ts`.

If the route is public, the visitor is allowed through.

The public landing page is `/landing`.

If the user tries to open the protected dashboard without being signed in, the middleware redirects or protects the route.

### 5.2 A visitor signs in

Clerk pages under:

- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`

render Clerk’s hosted components inside your app layout.

Once signed in, Clerk gives the app a user identity.

### 5.3 The app checks organization state

This app is not only user-based.

It is organization-based.

That means the important working unit is the active organization, not only the person.

The middleware checks if a signed-in user has an active `orgId`.

If not, the user is sent to `/org-selection`.

That page uses Clerk’s `OrganizationList` component so the user can select or create a workspace.

### 5.4 The dashboard loads

The route group `src/app/(dashboard)` wraps the private app UI.

Its layout mounts your custom collapsible sidebar.

The sidebar shows:

- navigation
- organization switcher
- billing state
- current user button

### 5.5 The voices page loads

When someone opens `/voices`:

1. the page in `src/app/(dashboard)/voices/page.tsx` parses URL query state
2. it prefetches voice data through tRPC
3. `VoicesView` renders the toolbar and two voice lists
4. voices are separated into:
   - custom organization voices
   - built-in system voices

### 5.6 A user creates a custom voice

The user opens the create dialog.

They can either:

- upload audio
- record audio directly

The form is handled in `voice-create-form.tsx`.

When submitted:

1. the browser sends the audio file to `/api/voices/create`
2. the route checks the Clerk session and current organization
3. the route checks Polar to confirm the org has a subscription
4. the route validates metadata with Zod
5. the route validates uploaded audio type and duration
6. the route creates a `Voice` row in Prisma
7. the audio file is uploaded to R2
8. the database row is updated with the R2 object key
9. a Polar usage event is recorded
10. the client invalidates cached voice and billing queries

### 5.7 A user generates speech

The main TTS interface lives under `/text-to-speech`.

The user:

- writes text
- picks a voice
- adjusts generation parameters
- clicks generate

Then:

1. the frontend submits a tRPC mutation
2. the server checks subscription status in Polar
3. the server fetches the requested voice from Prisma
4. the server confirms the voice has an R2 object key
5. the server calls the Python Chatterbox service
6. the Python service reads the referenced voice sample from the mounted R2 bucket
7. the Python model synthesizes a waveform
8. the Next.js backend receives the returned audio bytes
9. a `Generation` row is created in Prisma
10. the resulting audio is uploaded to R2
11. the generation row is updated with the R2 object key
12. a Polar metering event is sent
13. the client is redirected to `/text-to-speech/[generationId]`

### 5.8 The generated audio is played back

The detail page prefetches:

- the generation record
- the voice list
- generation history

The audio itself is streamed through `/api/audio/[generationId]`.

That API route:

1. validates auth
2. looks up the generation in Prisma
3. gets a signed R2 URL
4. fetches the object from R2
5. streams it back to the browser

The browser never needs direct long-lived storage credentials.

That is good design.

---

## 6. Data Model

The database schema is small but important.

### `Voice`

Represents one voice available for generation.

Fields:

- `id`: internal unique identifier
- `orgId`: which organization owns it, or `null` for system voices
- `name`: display name
- `description`: optional marketing/usage text
- `category`: a tagged voice category
- `language`: locale tag like `en-US`
- `variant`: `SYSTEM` or `CUSTOM`
- `r2ObjectKey`: where the audio sample is stored in R2
- `createdAt`, `updatedAt`: timestamps

Meaning:

- `SYSTEM` voices are built-in voices seeded by the app
- `CUSTOM` voices are uploaded by an organization

### `Generation`

Represents one completed text-to-speech output.

Fields:

- `id`
- `orgId`
- `voiceId`
- `text`
- `voiceName`
- `r2ObjectKey`
- `temperature`
- `topP`
- `topK`
- `repetitionPenalty`
- timestamps

The presence of both `voiceId` and `voiceName` is meaningful.

Why duplicate the voice name?

Because history should preserve the voice label at the time of generation, even if the original voice gets renamed or deleted later.

That is called denormalized snapshot data.

It is intentional and useful.

---

## 7. Package-by-Package Explanation

This section answers the user question:

"What packages did I download?"

Everything below comes from `package.json`.

I group packages by purpose instead of just repeating the raw list.

### 7.1 Framework and core React packages

#### `next`

This is the main web framework.

It gives you:

- routing
- server rendering
- API routes
- layouts
- middleware support
- static asset serving

#### `react`

This is the UI library.

All your components are React components.

#### `react-dom`

This is the React browser rendering package.

Next.js depends on it.

### 7.2 Styling and class composition

#### `tailwindcss`

This is the utility-first CSS framework you are using.

Most styling in the app is class-based.

#### `@tailwindcss/postcss`

This connects Tailwind with PostCSS in your build pipeline.

#### `tw-animate-css`

This adds animation helpers used by the UI system.

#### `clsx`

This helps conditionally combine class names.

#### `tailwind-merge`

This resolves Tailwind class conflicts so utility class strings stay predictable.

#### `class-variance-authority`

This helps define component variants such as button sizes and visual styles in a typed way.

### 7.3 Design system and UI component packages

#### `shadcn`

This is the generator/registry tool you used to scaffold UI primitives.

#### `radix-ui`

This provides accessible UI primitives.

Your local UI components wrap these primitives.

#### `@base-ui/react`

This is another component primitive library.

The repo may use it directly or indirectly via generated UI components.

#### `lucide-react`

This is the icon library used throughout the app.

You can see Lucide icons in dashboard menus, buttons, forms, and status cards.

#### `sonner`

This is the toast notification system.

You use it for success and error feedback.

#### `vaul`

This is used for drawer-style UI patterns.

#### `cmdk`

This is used for command palette or combobox-style search interfaces.

#### `embla-carousel-react`

This supports carousel UI patterns.

#### `react-day-picker`

This supports date picker/calendar UI.

#### `input-otp`

This supports one-time password style segmented input fields.

#### `react-resizable-panels`

This supports resizable panel layouts.

#### `recharts`

This is used for charts and usage display components.

### 7.4 Authentication and user management

#### `@clerk/nextjs`

This is the authentication and organization system.

It provides:

- sign in
- sign up
- organization switching
- user button
- auth middleware helpers

This is central to the app.

### 7.5 API and server communication

#### `@trpc/server`

This defines server-side procedures and routers.

#### `@trpc/client`

This lets the frontend call those procedures.

#### `@trpc/tanstack-react-query`

This integrates tRPC with TanStack Query.

#### `@tanstack/react-query`

This handles caching, background fetching, invalidation, and suspense query access.

#### `superjson`

This serializes complex values safely across the tRPC boundary.

#### `openapi-fetch`

This gives you a typed client for your Python Chatterbox service from its OpenAPI schema.

#### `openapi-typescript`

This is the codegen tool that creates the TypeScript API type file from the OpenAPI schema.

### 7.6 Forms and validation

#### `zod`

This is your runtime validation system.

You use it for:

- env validation
- tRPC input validation
- route input validation
- form validation

#### `@tanstack/react-form`

This is your main client form state library in several features.

#### `react-hook-form`

This is also present because your local UI kit includes form primitives that support it.

#### `@hookform/resolvers`

This usually connects `react-hook-form` to schema validation libraries.

### 7.7 Database and PostgreSQL

#### `prisma`

This is the ORM and schema tooling.

#### `@prisma/client`

This is Prisma’s runtime client package.

#### `@prisma/adapter-pg`

This gives Prisma a PostgreSQL adapter-based client connection.

#### `pg`

This is the PostgreSQL driver.

### 7.8 Storage and cloud file handling

#### `@aws-sdk/client-s3`

You use Cloudflare R2 through the S3-compatible API.

This package provides the client and commands.

#### `@aws-sdk/s3-request-presigner`

This creates signed URLs for private object access.

### 7.9 Billing and commerce

#### `@polar-sh/sdk`

This is the Polar SDK.

It handles:

- checkout session creation
- customer portal sessions
- subscription state inspection
- usage event ingestion

### 7.10 Monitoring and observability

#### `@sentry/nextjs`

This captures errors and monitoring data from server, client, and edge runtimes.

### 7.11 Media and audio helpers

#### `music-metadata`

This reads uploaded audio metadata.

You use it to validate duration during voice creation.

#### `recordrtc`

This records microphone audio in the browser.

#### `@types/recordrtc`

Type definitions for the package above.

#### `wavesurfer.js`

This renders waveforms and audio visualization.

#### `wavesurfer`

This package name also appears.

It looks like the repo ended up with both `wavesurfer` and `wavesurfer.js`.

The code is using `wavesurfer.js`.

The extra `wavesurfer` dependency may be leftover or intentional for compatibility.

### 7.12 Miscellaneous helper packages

#### `date-fns`

Date formatting and manipulation.

#### `locale-codes`

This powers the language selector by mapping locale tags to readable names.

#### `nuqs`

This manages URL query state in a typed way.

You use it on the voices page and root layout adapter.

#### `use-debounce`

Useful for debounced inputs or query syncing.

#### `simplex-noise`

Used for procedural visual effects.

#### `next-themes`

Theme support for light/dark mode aware components like Sonner.

#### `client-only`

Guards modules that should only run on the client.

#### `server-only`

Guards modules that should only run on the server.

#### `@dicebear/core` and `@dicebear/collection`

Used to generate avatar-like visuals.

### 7.13 Development-only packages

#### `typescript`

The type system and compiler tooling.

#### `eslint`

Static analysis and linting.

#### `eslint-config-next`

Next.js ESLint presets.

#### `tsx`

Runs TypeScript scripts directly in Node-style workflows.

#### `dotenv`

Loads environment variables in scripts and local tooling.

#### `@types/node`

Node.js types.

#### `@types/react`

React types.

#### `@types/react-dom`

React DOM types.

#### `@types/pg`

Postgres driver types.

---

## 8. How Folders Connect To Each Other

A beginner often sees folders but does not know how the arrows flow between them.

So here is the actual dependency story.

### `src/app` depends on `src/features`

Pages import feature views.

Example:

- page route -> feature view
- layout route -> feature layout

This keeps route files small.

### `src/features` depends on `src/components`

Feature code uses shared UI primitives and shared app components.

Examples:

- `Button`
- `Dialog`
- `Sidebar`
- landing sections
- page header

### `src/features` depends on `src/trpc`

Feature code uses tRPC hooks for data fetching and mutations.

This is the main frontend-to-backend connection.

### `src/trpc/routers` depends on `src/lib`

Server procedures import infrastructure helpers from `src/lib`.

Examples:

- Prisma client from `db.ts`
- Polar SDK client from `polar.ts`
- R2 helpers from `r2.ts`
- env from `env.ts`
- Chatterbox client from `chatterbox-client.ts`

### `src/lib` depends on external services

This is where real cloud-facing integration code sits.

This folder touches:

- PostgreSQL
- R2
- Polar
- Chatterbox API

### `scripts` depends on both `src/lib` concepts and generated Prisma client

Scripts are outside the web request cycle.

But they still need shared domain knowledge.

For example:

- voice names
- database schema
- cloud storage credentials

### `prisma` supports both `src/lib/db.ts` and scripts

The schema defines what the database looks like.

The generated Prisma client is then imported by app code and scripts.

### `public` supports UI components

Landing sections and navigation use images from `public`.

This keeps large media outside the code bundle.

---

## 9. Root File Walkthrough

This section explains each important root file.

### `AGENTS.md`

This file contains working instructions for coding agents.

It explains:

- how to load TanStack intent skills
- repo structure assumptions
- commands to use
- coding style expectations

This file is not part of app runtime.

It is operational documentation.

### `README.md`

This is the project overview.

It introduces:

- the product
- the tech stack
- getting started steps
- the folder structure

It is shorter than this book and meant for quick orientation.

### `ARCHITECTURE.md`

This is a shorter architecture summary.

It explains the system modules and generation pipeline at a high level.

This book expands on it.

### `CONVENTIONS.md`

This documents coding decisions:

- tRPC for internal API calls
- Zod for validation
- REST only for special cases
- feature-based organization
- env handling rules

This file explains your intended engineering style.

### `SECURITY.md`

This is the repository’s security policy document.

It is not implementation code.

It tells people how to think about vulnerability reporting and security posture.

### `design.md`

This is an extensive landing page design specification.

It contains:

- colors
- typography
- spacing
- interaction details
- navbar behavior
- motion guidelines

This is essentially a design blueprint for the public marketing page.

It explains why the landing page looks more polished than a default starter.

### `package.json`

This is the package manifest.

It tells the project:

- package name
- scripts
- runtime dependencies
- development dependencies

Scripts:

- `dev`: run local Next dev server
- `build`: build for production
- `start`: run production build locally
- `preinstall`: run `prisma generate`
- `lint`: run ESLint
- `sync-api`: generate API types from the Python service

The `preinstall` script is interesting.

It means Prisma client generation is expected as part of installation setup.

### `package-lock.json`

This locks exact dependency versions.

It ensures more reproducible installs.

### `next.config.ts`

This configures Next.js.

Important details:

- wraps config with `withSentryConfig`
- disables dev indicators
- raises `proxyClientMaxBodySize` to `20mb`

Why increase body size?

Because voice audio uploads are bigger than small form posts.

This is a product-specific change.

### `tsconfig.json`

This configures TypeScript.

Important details:

- `strict: true`
- `moduleResolution: bundler`
- alias `@/* -> ./src/*`

This alias is used throughout the repo.

### `eslint.config.mjs`

This enables Next.js and TypeScript lint rules using the flat config style.

### `postcss.config.mjs`

This adds the Tailwind PostCSS plugin.

Very small file.

Very important build role.

### `components.json`

This configures `shadcn/ui`.

It tells the generator:

- style preset
- Tailwind css file location
- aliases
- icon library

This is why new UI components land in the expected local paths.

### `prisma.config.ts`

This is Prisma configuration.

It points Prisma to:

- schema path
- migrations path
- seed command
- database URL

The seed command uses `tsx scripts/seed-system-voices.ts`.

That is a strong clue that the built-in voices are treated as seeded system data.

### `chatterbox_tts.py`

This is one of the most important files in the whole repo.

It is the Python service that actually generates speech.

What it does:

- defines a Modal app
- mounts an R2 bucket as a read-only cloud volume
- installs Python dependencies into the image
- loads the `ChatterboxTurboTTS` model on GPU
- exposes a FastAPI server
- protects the API using an `x-api-key`
- receives generation settings
- finds the referenced voice sample inside mounted storage
- runs model generation
- saves the generated waveform to an in-memory WAV buffer
- returns audio bytes

This file is not directly used by Next.js at runtime.

Instead, Next.js calls the deployed service over HTTP.

### `sentry.server.config.ts`

Server-side Sentry initialization.

### `sentry.edge.config.ts`

Edge runtime Sentry initialization.

### `BOOK.md`

This file.

Its purpose is documentation for humans.

It is not part of runtime.

### `CLAUDE.md` and `GEMINI.md`

These are likely AI-agent instruction or repo guidance files for other tools.

They are not part of application runtime.

They help automated or assistant workflows.

---

## 10. Prisma Folder Walkthrough

### `prisma/schema.prisma`

This is the database source of truth.

It defines:

- generator output path
- PostgreSQL datasource
- enums
- models
- indexes

Important design choices:

- `VoiceVariant` separates built-in and custom voices
- `VoiceCategory` classifies voices for UI and product filtering
- `Voice.orgId` is nullable so system voices can exist globally
- `Generation.voiceId` is nullable with `onDelete: SetNull`

That last part is smart.

It means deleting a voice does not destroy generation history.

Instead, the relation becomes null and the history survives.

### `prisma/migrations/20260426183421_init/migration.sql`

This is the first recorded database migration.

It creates the schema represented in `schema.prisma`.

Migrations are important because they turn your schema into executable database change history.

### `prisma/migrations/migration_lock.toml`

This helps Prisma manage migration state and provider consistency.

---

## 11. Scripts Folder Walkthrough

### `scripts/sync-api.ts`

This script fetches the OpenAPI schema from the Chatterbox service and generates TypeScript declarations into `src/types/chatterbox-api.d.ts`.

Why this exists:

- your Python service is separate from your Next.js app
- you still want type safety when calling it
- OpenAPI gives a contract
- TypeScript declarations let `openapi-fetch` know what request and response shapes exist

This is a very good engineering choice.

It reduces backend/frontend drift.

### `scripts/seed-system-voices.ts`

This is a seed script that creates or updates built-in system voices.

It:

- loads env vars
- initializes Prisma and R2 clients
- defines metadata for each built-in voice
- reads local `.wav` files from `scripts/system-voices`
- creates or updates system voice database rows
- uploads the corresponding audio files to R2
- stores the R2 key on the voice records

This is how your app gets a curated built-in voice library.

It is also how the repo connects local binary assets to cloud storage and database records.

### `scripts/system-voices/*.wav`

These are the local source assets for seeded built-in voices.

Each file is one voice sample.

Names include:

- Aaron
- Abigail
- Anaya
- Andy
- Archer
- Brian
- Chloe
- Dylan
- Emmanuel
- Ethan
- Evelyn
- Gavin
- Gordon
- Ivan
- Laura
- Lucy
- Madison
- Marisol
- Meera
- Walter

These files are not imported into the React bundle.

They are operational seed assets.

That is a very different role from `public/` images.

---

## 12. Public Folder Walkthrough

### `public/logo.svg`

Used in branding and sidebar navigation.

### `public/hero-bg.jpg`

A landing page background image.

### `public/Dashboard.jpg`

Used to visually represent the dashboard experience on the landing page.

### `public/TTSpage.jpg`

Used to visually represent the text-to-speech interface on the landing page.

### `public/file.svg`, `globe.svg`, `next.svg`, `window.svg`

These are static SVG placeholders or default asset-style files.

Some are empty in this repo snapshot.

That usually means they were scaffold leftovers or reserved placeholders.

### `src/app/icon.svg`

This is the application icon asset used by Next.js App Router metadata.

---

## 13. App Router File Walkthrough

This is the route-level map.

### `src/app/layout.tsx`

This is the global root layout.

It is one of the most important React files.

What it does:

- imports global CSS
- loads Google fonts
- wraps the entire app with `ClerkProvider`
- wraps the entire app with `TRPCReactProvider`
- wraps the page tree with `NuqsAdapter`
- mounts the global toast `Toaster`

What this means in practice:

- auth is available everywhere
- tRPC query/mutation hooks can work everywhere
- query-string state helpers can work everywhere
- toasts can appear anywhere

This file is the root shell for the whole application.

### `src/app/globals.css`

This file is much more than a normal CSS reset.

It does several jobs:

- imports Tailwind CSS 4
- imports `tw-animate-css`
- imports `shadcn` Tailwind styles
- maps CSS variables into Tailwind theme tokens
- defines light and dark theme variables
- defines sidebar and chart tokens
- adds base layer defaults
- contains custom landing page animation and glassmorphism styles

This is both:

- your design token file
- and your custom animation/style extension file

### `src/app/global-error.tsx`

This is the global error boundary page for App Router failures.

It captures the error with Sentry on the client, then renders a generic Next.js error UI.

Why this matters:

- users get a fallback page
- you still capture the error in monitoring

### `src/app/landing/page.tsx`

This is the public marketing page.

It composes:

- `Navbar`
- `Hero`
- `Marquee`
- `TtsSection`
- `BentoGrid`
- `Pricing`
- `Footer`

This route exists separately from the authenticated app dashboard.

That is a common SaaS structure.

### `src/app/sign-in/[[...sign-in]]/page.tsx`

Wraps Clerk’s sign-in UI.

The `[[...sign-in]]` segment means Clerk can handle nested auth-related subpaths.

### `src/app/sign-up/[[...sign-up]]/page.tsx`

Same idea as sign-in, but for registration.

### `src/app/org-selection/page.tsx`

Shows Clerk’s organization selector.

This is necessary because the app uses org-based authorization everywhere.

### `src/app/test/page.tsx`

This is a temporary or internal test page.

It directly queries Prisma and lists voices.

This is useful during development.

It is not polished product UI.

It is a debugging/convenience route.

### `src/app/(dashboard)/layout.tsx`

This is the authenticated app layout.

It:

- reads the sidebar cookie
- creates the sidebar provider
- renders the custom dashboard sidebar
- renders child pages inside the sidebar inset area

This file is the private-app shell.

### `src/app/(dashboard)/page.tsx`

This is the main dashboard route.

It simply renders `DashboardView`.

This is good route hygiene.

The route file stays very thin.

### `src/app/(dashboard)/voices/layout.tsx`

This wraps voices pages with `VoicesLayout`.

### `src/app/(dashboard)/voices/page.tsx`

This:

- parses search parameters through `nuqs`
- prefetches voices with tRPC
- hydrates the prefetched query state
- renders `VoicesView`

This pattern is a strong App Router plus TanStack Query pattern.

It reduces loading jank.

### `src/app/(dashboard)/text-to-speech/layout.tsx`

This wraps the TTS feature with `TextToSpeechLayout`.

### `src/app/(dashboard)/text-to-speech/page.tsx`

This is the main generation page.

It:

- reads optional `text` and `voiceId` from query params
- prefetches voices
- prefetches generation history
- hydrates and renders `TextToSpeechView`

The query param support allows dashboard shortcuts and landing actions to pre-fill content.

### `src/app/(dashboard)/text-to-speech/[generationId]/page.tsx`

This is the generation detail page.

It prefetches:

- one generation by id
- voice list
- generation history

Then it renders `TextToSpeechDetailView`.

### `src/app/(dashboard)/text-to-speech/loading.tsx`

This file provides a loading UI while the TTS page is resolving.

It improves perceived responsiveness.

---

## 14. API Route Walkthrough

These are REST-style routes used where tRPC is not the right fit.

That matches `CONVENTIONS.md`.

### `src/app/api/trpc/[trpc]/route.ts`

This is the transport bridge for the tRPC API.

It uses `fetchRequestHandler`.

This route does not contain business logic itself.

It simply forwards incoming API requests to your tRPC router tree.

### `src/app/api/voices/create/route.ts`

This is the most important REST route in the repo.

Why REST here instead of tRPC?

Because file upload is easier to manage in a direct route handler than in your current tRPC structure.

What it does:

1. verifies Clerk auth and active org
2. verifies active subscription with Polar
3. validates metadata from query params using Zod
4. reads raw request body as an audio file
5. checks file size
6. checks `Content-Type`
7. parses audio metadata using `music-metadata`
8. enforces a minimum duration
9. creates a custom voice row in Prisma
10. uploads the audio bytes to R2
11. updates the voice row with `r2ObjectKey`
12. records a Polar usage event
13. returns success JSON

This route is the bridge between browser-uploaded audio and the app’s permanent voice catalog.

### `src/app/api/voices/[voiceId]/route.ts`

This route streams back a voice sample.

It supports previewing both:

- system voices
- organization-owned custom voices

Important permission detail:

If the voice is custom and belongs to another org, the route returns not found.

That protects private voice assets.

### `src/app/api/audio/[generationId]/route.ts`

This route streams generated speech audio.

It:

- verifies auth
- verifies org ownership
- loads generation metadata
- gets a signed R2 URL
- fetches the private object
- returns it as a proxied response

This gives the frontend a simple `/api/audio/...` URL without exposing storage internals directly.

---

## 15. Middleware, Instrumentation, and Platform Files

### `src/proxy.ts`

This acts like a modern middleware file in this codebase.

Its job is routing protection.

What it defines:

- public routes
- org selection routes
- sign-in redirection behavior
- org-required behavior

Important behavior:

If a signed-out user hits `/`, they get redirected to `/landing`.

If a signed-in user has no active organization, they get redirected to `/org-selection`.

That means app access is intentionally workspace-centric.

### `src/instrumentation.ts`

This registers Sentry depending on runtime:

- Node.js runtime
- edge runtime

It also exports `onRequestError` so request errors can be captured centrally.

### `src/instrumentation-client.ts`

This initializes Sentry in the browser.

It enables:

- client error capture
- replay integration
- router transition tracing

### `src/types/chatterbox-api.d.ts`

This is generated code.

You should think of it as a type contract file, not handwritten business logic.

It describes the OpenAPI schema of the Python TTS service in TypeScript form.

---

## 16. Shared Library Walkthrough

### `src/lib/env.ts`

This validates server environment variables using `@t3-oss/env-nextjs` and Zod.

This is a very good practice.

It prevents silent misconfiguration.

Important variables include:

- database URL
- app URL
- R2 credentials
- Polar credentials
- Chatterbox API URL and key

### `src/lib/db.ts`

This creates the Prisma client singleton.

Why singleton?

Because in development, hot reload can create many Prisma clients if you are not careful.

The file stores the client on `global` outside production.

That is a standard Next.js/Prisma pattern.

### `src/lib/database-url.ts`

This normalizes the database URL before Prisma uses it.

This is an infrastructure helper.

It exists because real deployment environments sometimes produce URLs that need cleanup or compatibility fixes.

### `src/lib/chatterbox-client.ts`

This creates a typed API client for the Python TTS service using `openapi-fetch`.

It injects:

- the base URL
- the `x-api-key` header

This lets server code call the Python service without hand-writing request code everywhere.

### `src/lib/r2.ts`

This creates the S3-compatible R2 client and exposes three important helpers:

- `uploadAudio`
- `deleteAudio`
- `getSignedAudioUrl`

This file is the storage abstraction layer.

Most of the app should not need to know R2 command details directly.

### `src/lib/polar.ts`

This creates the Polar SDK client.

Very small file.

Very important business role.

### `src/lib/utils.ts`

This contains shared lightweight utilities.

Currently:

- `cn()` merges class names
- `formatFileSize()` formats bytes for display

In most React repos, this kind of file becomes heavily reused over time.

---

## 17. tRPC Layer Walkthrough

### `src/trpc/init.ts`

This initializes tRPC and defines reusable procedure types.

It creates:

- base router factory
- caller factory
- `baseProcedure`
- `authProcedure`
- `orgProcedure`

Why different procedure types matter:

- `baseProcedure` is public
- `authProcedure` requires a user
- `orgProcedure` requires both user and organization

This is one of the cleanest files in the repo because it encodes security rules as reusable API building blocks.

It also attaches Sentry middleware and uses `superjson`.

### `src/trpc/routers/_app.ts`

This combines child routers into one app router:

- `voices`
- `generations`
- `billing`

This is the root tRPC contract for the app.

### `src/trpc/routers/voices.ts`

This handles voice-related server procedures.

Currently it includes:

- `getAll`
- `delete`

`getAll`:

- optionally filters by query text
- fetches custom voices owned by the current org
- fetches system voices globally
- returns them separately as `{ custom, system }`

`delete`:

- ensures the voice exists
- ensures it belongs to the current org
- deletes the voice record
- tries to delete the associated R2 object

The split return shape is important because the UI wants to present team voices and built-in voices differently.

### `src/trpc/routers/generations.ts`

This is the heart of the product.

It includes:

- `getById`
- `getAll`
- `create`

`create` is the biggest procedure in the router tree.

It:

- validates input
- checks active subscription
- validates voice existence and ownership rules
- calls the Chatterbox service
- creates DB state
- uploads final audio
- updates generation metadata
- sends Polar usage events

This file is where AI product logic and SaaS business logic meet.

### `src/trpc/routers/billing.ts`

This handles subscription and billing-related procedures:

- checkout session creation
- customer portal session creation
- billing status retrieval

It keeps billing logic out of UI files.

That is a good separation.

### `src/trpc/client.tsx`

This sets up the React-side tRPC provider.

It:

- creates the typed tRPC React context
- creates or reuses a QueryClient
- creates the tRPC client with `httpBatchLink`
- wraps children with `QueryClientProvider` and `TRPCProvider`

Without this file, none of your `useQuery`, `useMutation`, or tRPC query options would work in the React tree.

### `src/trpc/query-client.ts`

This creates the shared TanStack Query client factory.

The purpose is consistency and one place for query client defaults.

### `src/trpc/server.tsx`

This gives App Router server components a way to prefetch tRPC queries and hydrate them into client-side cache.

It exports:

- `trpc`
- `HydrateClient`
- `prefetch`

This is why pages can prefetch data before the client mounts.

That improves UX.

---

## 18. Shared Hooks Walkthrough

### `src/hooks/use-mobile.ts`

This hook detects whether the UI should behave as mobile.

It is used by the sidebar system.

### `src/hooks/use-app-form.ts`

This wraps TanStack Form context creation.

It gives the app a reusable typed form helper instead of repeating boilerplate.

### `src/hooks/use-audio-playback.ts`

This hook plays either:

- a remote URL
- or a local `File`

It lazily creates an `Audio` element, tracks play state, and handles cleanup.

This is used by both voice upload preview and recorder preview flows.

---

## 19. Landing Components Walkthrough

These components power the public marketing page.

### `src/components/landing/navbar.tsx`

Implements the floating pill-style glassmorphic navigation described in `design.md`.

Its job is branding, section links, and primary CTA.

### `src/components/landing/hero.tsx`

Renders the top hero section.

This is the section most responsible for first impression.

It likely uses headline motion, visual framing, and screenshot placement based on the design spec.

### `src/components/landing/hero-title.tsx`

This likely isolates animated word reveal logic for the hero title.

The CSS in `globals.css` suggests staggered word reveal behavior.

### `src/components/landing/waveform.tsx`

Renders the animated visual waveform used in the landing hero or feature sections.

This supports the voice/audio identity of the product.

### `src/components/landing/marquee.tsx`

Creates the horizontally moving brand/info strip.

This is largely visual persuasion and motion design.

### `src/components/landing/tts-section.tsx`

Shows a product screenshot or feature frame for the text-to-speech experience.

### `src/components/landing/bento-grid.tsx`

This is a large landing section.

Based on the filename and size, it likely contains the feature card grid with the strongest marketing copy density.

### `src/components/landing/pricing.tsx`

This is the pricing/plan presentation section.

It likely connects design language with billing CTA.

### `src/components/landing/footer.tsx`

This closes the landing page with brand and navigation information.

---

## 20. Small Shared Components

### `src/components/page-header.tsx`

Reusable page heading component.

Used where a simple header bar is needed.

### `src/components/voice-avatar/use-voice-avatar.ts`

This hook likely creates the data or style inputs needed to render deterministic voice avatars.

The short length suggests it is a focused helper.

### `src/components/voice-avatar/voice-avatar.tsx`

This is the rendered avatar component for voices.

Useful when a voice needs a visual identity in cards or selectors.

---

## 21. Billing Feature Walkthrough

### `src/features/billing/hooks/use-checkout.ts`

This encapsulates the logic for starting a billing checkout flow.

Putting it in a hook keeps button components small.

### `src/features/billing/components/usage-container.tsx`

This component decides what billing UI to show in the sidebar.

If the user has no active subscription:

- show upgrade card

If the user does:

- show current usage estimate
- allow subscription management portal access

This is a good example of UI driven by server state.

---

## 22. Dashboard Feature Walkthrough

### `src/features/dashboard/views/dashboard-view.tsx`

This is the composed dashboard page.

It includes:

- page header
- background pattern
- personalized dashboard greeting
- quick text input
- quick action cards

### `src/features/dashboard/components/dashboard-sidebar.tsx`

This is one of the more important UI composition files.

It wires together:

- local sidebar primitives
- Clerk org switcher
- user button
- usage card
- route navigation

It is the navigation spine of the private app.

### `src/features/dashboard/components/dashboard-header.tsx`

This shows the personalized greeting and helpful top actions like feedback or support.

### `src/features/dashboard/components/hero-pattern.tsx`

This likely renders a decorative background shape for the dashboard.

### `src/features/dashboard/components/quick-action-card.tsx`

A reusable card for a dashboard shortcut.

### `src/features/dashboard/components/quick-actions-panel.tsx`

Maps the quick action data into cards.

### `src/features/dashboard/components/text-input-panel.tsx`

This is a mini entry point into the TTS workflow.

It lets the user type text and jump directly into `/text-to-speech` with query params.

That is a good product shortcut.

### `src/features/dashboard/data/quick-actions.ts`

This contains predefined example prompts for storytelling, ads, games, podcasts, meditation, and more.

These are not technical necessities.

They are product onboarding aids.

They help users understand use cases quickly.

---

## 23. Voices Feature Walkthrough

### `src/features/voices/data/voice-categories.ts`

Defines the allowed voice categories and label mappings.

This keeps categories consistent across:

- forms
- database values
- UI filters
- display labels

### `src/features/voices/data/voice-scoping.ts`

This likely contains logic or constants around which system voices exist and how they are scoped.

It is used by the seed script.

That makes it a shared domain file, not just a UI helper.

### `src/features/voices/lib/params.ts`

Defines typed URL query handling for the voices page.

### `src/features/voices/hooks/use-audio-recorder.ts`

This is a browser microphone recording hook.

It:

- requests microphone permission
- initializes `RecordRTC`
- tracks elapsed time
- renders a live waveform with `wavesurfer.js`
- stops and returns the final blob

This is one of the more advanced client-side hooks in the repo.

### `src/features/voices/components/voice-recorder.tsx`

This is the UI layer on top of the recorder hook.

It handles:

- recording state
- playback of recorded file
- error UI
- re-recording

### `src/features/voices/components/voice-create-form.tsx`

This is the main voice creation UI.

It is one of the longest feature components because it coordinates many concerns:

- TanStack Form
- drag-and-drop upload
- recording tab
- category selection
- language search
- description entry
- submission
- cache invalidation
- billing-state refresh

This file is a good example of feature-heavy frontend composition.

### `src/features/voices/components/voice-create-dialog.tsx`

Wraps the create form inside a dialog flow.

### `src/features/voices/components/voice-card.tsx`

Renders one voice as a card.

Likely includes:

- voice avatar
- metadata
- category/language info
- preview
- delete action for custom voices

### `src/features/voices/components/voices-list.tsx`

Renders a titled collection of voice cards.

### `src/features/voices/components/voices-toolbar.tsx`

Handles top-level actions or search on the voices page.

### `src/features/voices/views/VoicesLayout.tsx`

Structural wrapper for the voices feature route.

### `src/features/voices/views/voices-view.tsx`

This is the feature entry view for `/voices`.

It:

- reads query state
- opens the create dialog based on `cloning` query state
- fetches voice data
- renders custom and system sections separately

This file connects URL state to product UI.

---

## 24. Text-to-Speech Feature Walkthrough

### `src/features/text-to-speech/data/constants.ts`

This file defines constants used across the TTS feature.

Because it is only one line, it likely exports a core numeric limit such as max text length.

### `src/features/text-to-speech/data/sliders.ts`

This defines slider metadata for generation settings.

Likely includes labels, ranges, steps, and defaults for:

- temperature
- top-p
- top-k
- repetition penalty

### `src/features/text-to-speech/contexts/tts-voices-context.tsx`

This context makes voice lists available to nested TTS components without prop-drilling everything manually.

### `src/features/text-to-speech/hooks/use-wavesurfer.ts`

This supports waveform rendering for audio preview in the TTS UI.

### `src/features/text-to-speech/components/text-to-speech-form.tsx`

This is the central form controller for speech generation.

It:

- defines the schema
- defines default values
- submits the `generations.create` mutation
- handles subscription-required errors specially
- invalidates billing status
- redirects to the generation detail page

This file is where frontend generation intent turns into backend generation work.

### `src/features/text-to-speech/components/text-input-panel.tsx`

This is the main text input panel for the TTS page.

It manages the editable prompt field inside the form context.

### `src/features/text-to-speech/components/voice-selector.tsx`

This likely renders the main voice picker using the voices context.

### `src/features/text-to-speech/components/voice-selector-button.tsx`

A focused button or trigger used to open/select voice choices.

### `src/features/text-to-speech/components/generate-button.tsx`

Encapsulates the generate call-to-action.

### `src/features/text-to-speech/components/prompt-suggestions.tsx`

Provides suggested prompts or starter examples for new users.

This is onboarding support, similar to dashboard quick actions.

### `src/features/text-to-speech/components/settings-panel.tsx`

Likely composes the desktop settings sidebar area.

### `src/features/text-to-speech/components/settings-drawer.tsx`

Mobile or compact version of settings UI.

### `src/features/text-to-speech/components/settings-panel-settings.tsx`

Probably the actual numeric controls.

### `src/features/text-to-speech/components/settings-panel-history.tsx`

Probably generation history in the settings area.

### `src/features/text-to-speech/components/history-drawer.tsx`

Mobile-friendly history UI.

### `src/features/text-to-speech/components/voice-preview-placeholder.tsx`

Placeholder shown before a generation exists.

### `src/features/text-to-speech/components/voice-preview-panel.tsx`

Desktop preview of generated audio and selected voice.

### `src/features/text-to-speech/components/voice-preview-mobile.tsx`

Mobile version of preview UI.

### `src/features/text-to-speech/views/text-to-speech-layout.tsx`

Structural wrapper.

### `src/features/text-to-speech/views/text-to-speech-view.tsx`

Entry view for a new generation flow.

It:

- loads all voices
- resolves a safe default voice
- builds form defaults
- provides voices through context
- composes input, placeholder, and settings panels

### `src/features/text-to-speech/views/text-to-speech-detail-view.tsx`

Entry view for a completed generation.

It:

- loads generation + voices together
- reconstructs form defaults from stored generation settings
- preserves historical voice name display
- shows both mobile and desktop preview variants

This is a smart detail page because it lets a previous generation act like a reusable preset.

---

## 25. UI Kit Philosophy

The `src/components/ui` folder is your local design system.

Most of these files are wrappers around Radix or related primitives.

Their job is not to hold business logic.

Their job is to give the whole app:

- consistent styling
- accessible interactions
- reusable component APIs
- local ownership instead of remote dependency on a component library package

Why this matters:

If you imported every UI element directly from third-party packages across your app, your app code would be noisier and harder to standardize.

By wrapping them locally, you keep design decisions centralized.

Below is the file-by-file explanation.

---

## 26. UI Kit File-by-File

### `src/components/ui/button.tsx`

Local button primitive.

Uses `class-variance-authority` to define button variants and sizes.

Supports `asChild` composition via Radix `Slot`.

This is a foundational component used everywhere.

### `src/components/ui/badge.tsx`

Small label/pill component.

Used for status, metadata, and small highlighted values.

### `src/components/ui/input.tsx`

Styled text input component.

Keeps all standard input fields visually consistent.

### `src/components/ui/textarea.tsx`

Styled textarea component.

Used for longer prompt and description text fields.

### `src/components/ui/label.tsx`

Accessible label wrapper.

Used inside form-like structures.

### `src/components/ui/card.tsx`

Card layout primitive.

Useful for boxed content sections.

### `src/components/ui/dialog.tsx`

Modal dialog wrapper built on Radix dialog primitives.

Adds overlay, content styling, title, description, and close behavior.

### `src/components/ui/drawer.tsx`

Drawer-style overlay component.

Useful for mobile sheets or slide-up panels.

### `src/components/ui/sheet.tsx`

Side sheet pattern.

Used by the sidebar on mobile.

### `src/components/ui/sidebar.tsx`

Large custom sidebar system.

Handles:

- mobile sheet mode
- desktop collapsed mode
- persisted open/closed cookie
- keyboard shortcut
- tooltip support
- trigger and rail controls

This is one of the most substantial UI infrastructure files in the repo.

### `src/components/ui/select.tsx`

Local select dropdown wrapper.

### `src/components/ui/popover.tsx`

Floating popover wrapper.

### `src/components/ui/command.tsx`

Command/combobox menu primitives used in searchable pickers.

### `src/components/ui/tabs.tsx`

Tabbed interface primitive.

Used in places like upload vs record switching.

### `src/components/ui/field.tsx`

Field wrapper and validation display helper.

### `src/components/ui/form.tsx`

`react-hook-form` integration helpers for labels, descriptions, messages, and control wiring.

### `src/components/ui/checkbox.tsx`

Styled checkbox control.

### `src/components/ui/switch.tsx`

Styled toggle switch.

### `src/components/ui/radio-group.tsx`

Styled grouped radio controls.

### `src/components/ui/slider.tsx`

Slider input for continuous values.

Likely important for TTS parameter tuning.

### `src/components/ui/progress.tsx`

Progress bar primitive.

### `src/components/ui/separator.tsx`

Horizontal or vertical separator line.

### `src/components/ui/skeleton.tsx`

Loading placeholder block.

Used around Clerk-loaded data and async UI.

### `src/components/ui/sonner.tsx`

Wrapper around the Sonner toast provider.

Adds theme awareness and custom icons.

### `src/components/ui/spinner.tsx`

Small loading spinner component.

### `src/components/ui/tooltip.tsx`

Tooltip primitives.

### `src/components/ui/avatar.tsx`

Avatar display primitive.

### `src/components/ui/accordion.tsx`

Expandable/collapsible content sections.

### `src/components/ui/alert.tsx`

Simple alert banner or message block.

### `src/components/ui/alert-dialog.tsx`

Destructive-confirmation modal pattern.

### `src/components/ui/aspect-ratio.tsx`

Aspect ratio wrapper for media or framed visuals.

### `src/components/ui/breadcrumb.tsx`

Breadcrumb navigation component.

### `src/components/ui/button-group.tsx`

Grouped button layout helper.

### `src/components/ui/calendar.tsx`

Calendar/date picker rendering.

### `src/components/ui/carousel.tsx`

Carousel wrapper using Embla.

### `src/components/ui/chart.tsx`

Chart wrapper for Recharts.

This file adds:

- chart config context
- themed CSS variable injection
- tooltip rendering helpers

It turns raw Recharts primitives into app-themed chart building blocks.

### `src/components/ui/collapsible.tsx`

Collapsible primitive wrapper.

### `src/components/ui/combobox.tsx`

Combined input-plus-list picker component.

### `src/components/ui/context-menu.tsx`

Right-click or context action menu primitives.

### `src/components/ui/direction.tsx`

Directionality helper, likely for LTR/RTL support wrappers.

### `src/components/ui/dropdown-menu.tsx`

Dropdown menu wrapper.

### `src/components/ui/empty.tsx`

Empty state UI primitive for no-data screens.

### `src/components/ui/hover-card.tsx`

Hover-triggered floating card primitive.

### `src/components/ui/input-group.tsx`

Composable grouped input layout.

### `src/components/ui/input-otp.tsx`

Segmented OTP/code input.

### `src/components/ui/item.tsx`

A more abstract item row/card/list building primitive.

### `src/components/ui/kbd.tsx`

Keyboard shortcut visual component.

### `src/components/ui/menubar.tsx`

Menubar primitives.

### `src/components/ui/native-select.tsx`

Native select wrapper with local styling.

### `src/components/ui/navigation-menu.tsx`

Navigation menu primitives.

### `src/components/ui/pagination.tsx`

Pagination UI helpers.

### `src/components/ui/resizable.tsx`

Resizable panel wrappers.

### `src/components/ui/scroll-area.tsx`

Styled scroll area.

### `src/components/ui/table.tsx`

Styled table primitives.

### `src/components/ui/toggle.tsx`

Single toggle control.

### `src/components/ui/toggle-group.tsx`

Grouped toggle controls.

### `src/components/ui/menubar.tsx`

App-themed wrapper around a structured top menu component.

### `src/components/ui/navigation-menu.tsx`

Useful for richer nested navigation patterns.

### `src/components/ui/pagination.tsx`

Useful for future long lists or searchable datasets.

### `src/components/ui/combobox.tsx`

Helpful for searchable selection UI like language or voice choices.

### `src/components/ui/empty.tsx`

Reusable "no content" state.

### `src/components/ui/wavy-background.tsx`

A decorative visual component.

Likely built for animated or atmospheric page backgrounds.

### `src/components/ui/command.tsx`

Worth calling out again because searchable popovers often depend on it.

This is the structured command menu foundation.

### `src/components/ui/item.tsx`

Likely an abstraction around reusable item rows, metadata blocks, or action cells.

### `src/components/ui/accordion.tsx`

Useful where content should expand progressively.

### `src/components/ui/alert-dialog.tsx`

Especially important for delete-confirmation flows like removing a custom voice.

---

## 27. Generated Prisma Client Files

These files live under `src/generated/prisma`.

They are generated.

That means:

- do not treat them like handwritten domain code
- do not edit them manually
- regenerate them when schema changes

Important generated files include:

### `src/generated/prisma/client.js`

Generated runtime client entry.

### `src/generated/prisma/index.d.ts`

Generated TypeScript definitions for the client.

### `src/generated/prisma/index.js`

Generated runtime index.

### `src/generated/prisma/edge.js`

Edge-compatible generated client output.

### `src/generated/prisma/runtime/*`

Internal Prisma runtime support files.

### `src/generated/prisma/query_compiler_fast_bg.wasm`

A Prisma internal compiled artifact.

### `src/generated/prisma/package.json`

Metadata for the generated package output.

### `src/generated/prisma/schema.prisma`

A copied/generated schema artifact.

These generated files exist because you configured Prisma output to `../src/generated/prisma`.

That is a valid pattern.

It gives your app explicit local ownership over generated client output.

---

## 28. Important Product Decisions Hidden In The Code

A lot of beginner readers miss the fact that product strategy is visible in code.

This repo shows several product decisions clearly.

### Decision: org-first, not just user-first

This is visible in:

- `orgProcedure`
- Clerk organization switching
- redirects to `/org-selection`
- `orgId` on models

Meaning:

The platform is meant for teams or workspace-based usage, not just solo profiles.

### Decision: private assets should live outside the frontend

This is visible in:

- R2 object keys in DB
- signed URL retrieval
- proxying audio through API routes

Meaning:

Audio files are private product assets, not public CDN files.

### Decision: AI compute should be isolated from web app runtime

This is visible in:

- `chatterbox_tts.py`
- typed external client
- OpenAPI sync script

Meaning:

Heavy generation work belongs in a dedicated service, not inside Next.js route handlers.

### Decision: billing gates expensive operations

This is visible in:

- Polar checks before voice creation
- Polar checks before generation
- usage ingestion after actions

Meaning:

You designed cost-bearing features with monetization and metering from the start.

### Decision: users should be guided by good defaults and examples

This is visible in:

- dashboard quick actions
- prompt suggestions
- default TTS parameters
- fallback voice selection

Meaning:

You are not just building infrastructure.

You are building a guided product experience.

---

## 29. Beginner Notes On The Most Important Technical Concepts

### Server Components vs Client Components

Some files begin with `"use client";`.

That means the component runs in the browser and can use:

- state
- effects
- browser APIs
- event handlers

Files without `"use client";` in App Router are usually server components by default.

They are good for:

- data prefetching
- route-level composition
- secure server-only logic

### Prefetch + Hydration

You use a pattern where pages call `prefetch(...)` on the server, then render `HydrateClient`.

This means:

1. the server prepares the query result
2. the browser receives that prepared cache state
3. the client does not need to refetch immediately

This produces a smoother app.

### Zod Validation

Zod is used so invalid input gets stopped early.

That matters for:

- forms
- API procedures
- route handlers
- environment variables

### Query Invalidation

After creating a voice or generation, the UI invalidates queries.

This tells TanStack Query:

"The old cached data may now be stale. Please refresh it."

That is how UI state stays consistent after mutations.

### Signed URLs

R2 objects are private.

So the app creates short-lived signed URLs to fetch them safely.

This is more secure than making the whole bucket public.

---

## 30. Inferred Development Workflow

Based on the repo, your likely workflow looked like this:

1. `npm install`
2. set env variables
3. `npx prisma generate`
4. `npx prisma migrate dev`
5. `tsx scripts/seed-system-voices.ts`
6. deploy or run your Python TTS service
7. `npm run sync-api`
8. `npm run dev`

Then during feature work:

- build UI in `src/features`
- create or update tRPC procedures
- connect to storage/billing/lib helpers
- test upload/generation flows manually
- run lint/build checks

This is inferred from the project structure and scripts.

---

## 31. Files Most Critical For Understanding The App Fast

If a beginner asked "what 15 files should I read first?", I would say:

1. `package.json`
2. `README.md`
3. `ARCHITECTURE.md`
4. `prisma/schema.prisma`
5. `src/app/layout.tsx`
6. `src/proxy.ts`
7. `src/lib/env.ts`
8. `src/lib/db.ts`
9. `src/trpc/init.ts`
10. `src/trpc/routers/generations.ts`
11. `src/app/api/voices/create/route.ts`
12. `src/features/voices/components/voice-create-form.tsx`
13. `src/features/text-to-speech/components/text-to-speech-form.tsx`
14. `src/features/text-to-speech/views/text-to-speech-detail-view.tsx`
15. `chatterbox_tts.py`

Those files together explain most of the system.

---

## 32. One-Sentence Meaning Of Each Major Area

This section is intentionally repetitive for memory.

### App Router

This decides which page or API handler answers a URL.

### Features

This is where product-specific UI and workflows live.

### Components

This is the shared building-block layer.

### UI

This is the local design system and interaction primitive layer.

### lib

This is infrastructure and shared service integration code.

### tRPC

This is the internal typed API contract and transport layer.

### Prisma

This is the database model definition and migration history.

### Scripts

This is setup, seeding, and code generation support.

### Python service

This is the actual GPU text-to-speech engine.

---

## 33. Possible Rough Edges Or Things A Beginner Should Notice

This section is not criticism.

It is guidance.

### There are both `wavesurfer` and `wavesurfer.js` dependencies

The code uses `wavesurfer.js`.

A beginner should know this may be intentional or may be leftover duplication.

### `src/app/test/page.tsx` is clearly a dev/test route

It is useful, but not polished production UX.

### Some public SVG files are empty

This suggests starter leftovers or placeholders.

### The sign-in/sign-up pages contain `mx-quto`

That looks like a typo for `mx-auto`.

It does not affect the architecture explanation, but a beginner should notice it.

### Generated folders should not be manually edited

This especially applies to:

- `src/generated/prisma`
- `src/types/chatterbox-api.d.ts`

---

## 34. Final Summary

You built a real full-stack SaaS-shaped AI audio product.

It is made of six big ideas:

1. Next.js for the web app
2. Clerk for identity and organizations
3. tRPC for typesafe app APIs
4. Prisma + PostgreSQL for data
5. R2 for audio storage
6. Polar + Modal/Python for business and AI infrastructure

The repo is organized well enough that a beginner can learn it in layers:

- routes first
- features second
- tRPC third
- lib integrations fourth
- database and scripts fifth

The most important thing to understand is that this app is not "just frontend".

It is a coordinated system.

The browser UI, the Next.js backend, the database, the storage layer, the billing platform, and the Python TTS engine all depend on one another.

That is what makes the app work.

If you want to expand this book later, the best next additions would be:

- line-by-line commentary for the longest feature components
- screenshots with annotated UI callouts
- exact request/response examples for voice creation and generation
- environment variable reference with example values
- deployment checklist for Vercel, database, R2, Polar, and Modal

This book should already give a beginner a strong map of the repository and how its pieces fit together.

---

## Appendix A. Root File Quick Index

This appendix is more repetitive on purpose.

The main chapters explained concepts.

This appendix explains files in shorter, more reference-style blocks.

### `README.md`

File type:

- project overview document

Primary audience:

- new developers
- new contributors
- anyone opening the repo for the first time

Why it exists:

- to summarize the product and stack quickly

Runtime effect:

- none

### `ARCHITECTURE.md`

File type:

- technical architecture note

Main idea:

- high-level system diagram in prose

Why it matters:

- tells readers how frontend, backend, storage, auth, and billing connect

Runtime effect:

- none

### `CONVENTIONS.md`

File type:

- engineering rules document

Main idea:

- tells developers where code should live and how data access should work

Why it matters:

- prevents random architectural drift

Runtime effect:

- none

### `SECURITY.md`

File type:

- security process document

Main idea:

- how security is treated and reported

Runtime effect:

- none

### `design.md`

File type:

- visual specification document

Main idea:

- landing page design system and motion rules

Why it matters:

- preserves visual intent beyond raw code

Runtime effect:

- indirect, through human design decisions

### `package.json`

File type:

- Node package manifest

Main idea:

- controls scripts and dependencies

Why it matters:

- this file is the central contract for your JS toolchain

Runtime effect:

- direct, through install and script execution

### `package-lock.json`

File type:

- dependency lockfile

Main idea:

- stores exact resolved versions

Why it matters:

- reduces "works on my machine" install drift

Runtime effect:

- indirect, through package resolution

### `next.config.ts`

File type:

- Next.js config

Main idea:

- customizes framework behavior and Sentry integration

Why it matters:

- changes build and runtime behavior

Runtime effect:

- direct

### `tsconfig.json`

File type:

- TypeScript config

Main idea:

- tells the compiler how to understand the project

Why it matters:

- enables strictness and path aliases

Runtime effect:

- indirect during development/build

### `eslint.config.mjs`

File type:

- lint config

Main idea:

- static code quality rules

Runtime effect:

- indirect during development

### `postcss.config.mjs`

File type:

- CSS build config

Main idea:

- connects Tailwind to the PostCSS pipeline

Runtime effect:

- direct during CSS compilation

### `components.json`

File type:

- `shadcn/ui` generator config

Main idea:

- tells the UI scaffolder where to place components and which style system to use

Runtime effect:

- indirect during component generation

### `prisma.config.ts`

File type:

- Prisma operational config

Main idea:

- schema path, migration path, seed command

Runtime effect:

- direct during Prisma CLI usage

### `sentry.server.config.ts`

File type:

- server monitoring config

Main idea:

- initialize Sentry on the server

Runtime effect:

- direct in server runtime

### `sentry.edge.config.ts`

File type:

- edge monitoring config

Main idea:

- initialize Sentry for middleware/edge usage

Runtime effect:

- direct in edge runtime

### `chatterbox_tts.py`

File type:

- Python inference service entry point

Main idea:

- run GPU text-to-speech and voice cloning inference behind a FastAPI app on Modal

Runtime effect:

- direct in the deployed TTS service

### `AGENTS.md`

File type:

- repo operating instructions for coding agents

Main idea:

- how automation should work in this repo

Runtime effect:

- none in app runtime

### `CLAUDE.md`

File type:

- tool/assistant guidance document

Runtime effect:

- none in app runtime

### `GEMINI.md`

File type:

- tool/assistant guidance document

Runtime effect:

- none in app runtime

### `BOOK.md`

File type:

- long-form codebook

Main idea:

- teach a beginner how the repo works

Runtime effect:

- none

---

## Appendix B. Package Reference, One More Time, But More Operationally

This section is intentionally redundant.

The earlier dependency chapter grouped packages by category.

This appendix reframes them by the problem they solve in the app.

### Problem: page routing, rendering, and app shell

Packages involved:

- `next`
- `react`
- `react-dom`

What they solve:

- route files become pages
- layouts wrap pages
- server and client rendering work
- browser interactivity works

### Problem: auth and multi-tenant organization state

Packages involved:

- `@clerk/nextjs`

What they solve:

- sign in
- sign up
- organization switching
- server auth checks
- middleware route protection

### Problem: internal API communication

Packages involved:

- `@trpc/server`
- `@trpc/client`
- `@trpc/tanstack-react-query`
- `@tanstack/react-query`
- `superjson`

What they solve:

- typed query procedures
- typed mutation procedures
- cache-aware fetching
- optimistic UI foundations
- server-side prefetch hydration

### Problem: database reads and writes

Packages involved:

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`
- `pg`

What they solve:

- schema design
- migrations
- query building
- PostgreSQL connectivity

### Problem: storing private audio files

Packages involved:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

What they solve:

- upload file bytes to R2
- delete files from R2
- generate signed access URLs

### Problem: billing and usage metering

Packages involved:

- `@polar-sh/sdk`

What they solve:

- hosted checkout
- customer portal
- active subscription lookup
- usage event ingestion

### Problem: browser audio capture and playback

Packages involved:

- `recordrtc`
- `@types/recordrtc`
- `wavesurfer.js`
- `music-metadata`

What they solve:

- record microphone input
- visualize waveforms
- parse uploaded audio metadata
- enforce audio quality constraints

### Problem: forms and validation

Packages involved:

- `zod`
- `@tanstack/react-form`
- `react-hook-form`
- `@hookform/resolvers`

What they solve:

- input constraints
- form state
- error messaging
- safer submissions

### Problem: polished product UI

Packages involved:

- `tailwindcss`
- `tw-animate-css`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `lucide-react`
- `sonner`
- `cmdk`
- `vaul`
- `embla-carousel-react`
- `recharts`
- `react-day-picker`
- `react-resizable-panels`

What they solve:

- styling
- animation
- iconography
- toasts
- search popovers
- drawers
- charts
- calendars
- polished interactions

### Problem: syncing the Python API contract into TypeScript

Packages involved:

- `openapi-fetch`
- `openapi-typescript`

What they solve:

- typed REST client
- generated TS declaration contract

### Problem: observability

Packages involved:

- `@sentry/nextjs`

What they solve:

- client error reporting
- server error reporting
- edge error reporting
- replay and tracing

### Problem: productivity and environment setup

Packages involved:

- `tsx`
- `dotenv`
- TypeScript type packages

What they solve:

- run TS scripts directly
- load `.env` values in scripts
- provide editor intelligence and build typing

---

## Appendix C. Route-by-Route Functional Index

This section answers:

"If I open a URL, what file chain wakes up?"

### Route: `/landing`

Entry file:

- `src/app/landing/page.tsx`

Main children:

- `src/components/landing/navbar.tsx`
- `src/components/landing/hero.tsx`
- `src/components/landing/marquee.tsx`
- `src/components/landing/tts-section.tsx`
- `src/components/landing/bento-grid.tsx`
- `src/components/landing/pricing.tsx`
- `src/components/landing/footer.tsx`

Support files:

- `src/app/globals.css`
- `design.md`
- images from `public/`

### Route: `/sign-in`

Entry file:

- `src/app/sign-in/[[...sign-in]]/page.tsx`

Main dependency:

- Clerk sign-in component

### Route: `/sign-up`

Entry file:

- `src/app/sign-up/[[...sign-up]]/page.tsx`

Main dependency:

- Clerk sign-up component

### Route: `/org-selection`

Entry file:

- `src/app/org-selection/page.tsx`

Main dependency:

- Clerk organization list

### Route: `/`

Entry file:

- `src/app/(dashboard)/page.tsx`

Layout chain:

- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`

Feature view:

- `src/features/dashboard/views/dashboard-view.tsx`

### Route: `/voices`

Entry file:

- `src/app/(dashboard)/voices/page.tsx`

Layout chain:

- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/voices/layout.tsx`

Feature view:

- `src/features/voices/views/voices-view.tsx`

Backend dependencies:

- `trpc.voices.getAll`

### Route: `/text-to-speech`

Entry file:

- `src/app/(dashboard)/text-to-speech/page.tsx`

Layout chain:

- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/text-to-speech/layout.tsx`

Feature view:

- `src/features/text-to-speech/views/text-to-speech-view.tsx`

Backend dependencies:

- `trpc.voices.getAll`
- `trpc.generations.getAll`

### Route: `/text-to-speech/[generationId]`

Entry file:

- `src/app/(dashboard)/text-to-speech/[generationId]/page.tsx`

Feature view:

- `src/features/text-to-speech/views/text-to-speech-detail-view.tsx`

Backend dependencies:

- `trpc.generations.getById`
- `trpc.voices.getAll`
- `trpc.generations.getAll`

### Route: `/api/trpc/*`

Entry file:

- `src/app/api/trpc/[trpc]/route.ts`

Router chain:

- `src/trpc/init.ts`
- `src/trpc/routers/_app.ts`

### Route: `/api/voices/create`

Entry file:

- `src/app/api/voices/create/route.ts`

Service dependencies:

- Clerk auth
- Prisma
- R2 upload
- Polar billing
- audio metadata parsing

### Route: `/api/voices/[voiceId]`

Entry file:

- `src/app/api/voices/[voiceId]/route.ts`

Service dependencies:

- Clerk auth
- Prisma
- signed R2 fetch

### Route: `/api/audio/[generationId]`

Entry file:

- `src/app/api/audio/[generationId]/route.ts`

Service dependencies:

- Clerk auth
- Prisma
- signed R2 fetch

---

## Appendix D. Full App File Inventory With Purpose Notes

This section is intentionally dense.

Each block gives a small "index card" for a file.

### `src/app/layout.tsx`

Category:

- global layout

Reads from:

- font loaders
- `globals.css`
- `TRPCReactProvider`
- Clerk

Provides:

- app-wide providers

Read this file when:

- you want to understand the global shell

### `src/app/globals.css`

Category:

- global style and theme token file

Reads from:

- Tailwind imports

Provides:

- base CSS variables
- landing page animation styles

Read this file when:

- you want to understand how the app looks and animates

### `src/app/global-error.tsx`

Category:

- root error boundary

Reads from:

- Sentry
- Next error component

Provides:

- fallback UI when something crashes

### `src/app/landing/page.tsx`

Category:

- public route page

Reads from:

- landing components

Provides:

- the marketing site

### `src/app/sign-in/[[...sign-in]]/page.tsx`

Category:

- auth route page

Reads from:

- Clerk `SignIn`

Provides:

- sign-in UI

### `src/app/sign-up/[[...sign-up]]/page.tsx`

Category:

- auth route page

Reads from:

- Clerk `SignUp`

Provides:

- sign-up UI

### `src/app/org-selection/page.tsx`

Category:

- org selection route page

Reads from:

- Clerk `OrganizationList`

Provides:

- organization choose/create UI

### `src/app/test/page.tsx`

Category:

- dev/test page

Reads from:

- Prisma directly

Provides:

- raw DB inspection in a page form

### `src/app/(dashboard)/layout.tsx`

Category:

- private app layout

Reads from:

- cookies
- sidebar provider
- dashboard sidebar

Provides:

- authenticated shell with navigation

### `src/app/(dashboard)/page.tsx`

Category:

- private dashboard route

Reads from:

- dashboard view

Provides:

- home screen of app

### `src/app/(dashboard)/voices/layout.tsx`

Category:

- voices feature layout wrapper

Reads from:

- `VoicesLayout`

Provides:

- route-specific structure

### `src/app/(dashboard)/voices/page.tsx`

Category:

- voices index route

Reads from:

- nuqs params
- tRPC prefetch
- voices view

Provides:

- voice library page

### `src/app/(dashboard)/text-to-speech/layout.tsx`

Category:

- TTS route layout wrapper

### `src/app/(dashboard)/text-to-speech/page.tsx`

Category:

- new generation route

Reads from:

- search params
- tRPC prefetch

Provides:

- generation workspace

### `src/app/(dashboard)/text-to-speech/[generationId]/page.tsx`

Category:

- generation detail route

Reads from:

- tRPC prefetch helpers

Provides:

- replay/edit view of a past generation

### `src/app/(dashboard)/text-to-speech/loading.tsx`

Category:

- loading state route file

Provides:

- skeleton or placeholder state

### `src/app/api/trpc/[trpc]/route.ts`

Category:

- API transport route

Reads from:

- app router

Provides:

- fetch-based tRPC endpoint

### `src/app/api/voices/create/route.ts`

Category:

- REST file upload route

Reads from:

- Clerk
- Zod
- Prisma
- Polar
- R2
- metadata parser

Provides:

- custom voice creation backend

### `src/app/api/voices/[voiceId]/route.ts`

Category:

- REST audio proxy route

Provides:

- voice preview stream

### `src/app/api/audio/[generationId]/route.ts`

Category:

- REST audio proxy route

Provides:

- generated speech stream

---

## Appendix E. `src/lib` File Cards

### `src/lib/env.ts`

Purpose:

- trusted env validation

Main risk it prevents:

- missing or malformed configuration at runtime

Read this file when:

- adding a new secret or service

### `src/lib/db.ts`

Purpose:

- safe Prisma client singleton

Main risk it prevents:

- too many client instances in dev

Read this file when:

- changing DB connection setup

### `src/lib/database-url.ts`

Purpose:

- normalize connection strings

Read this file when:

- database URLs behave differently across environments

### `src/lib/chatterbox-client.ts`

Purpose:

- typed HTTP client for the Python service

Read this file when:

- changing API endpoint names or auth headers

### `src/lib/r2.ts`

Purpose:

- all audio storage helper operations

Read this file when:

- changing bucket behavior
- adding new storage actions

### `src/lib/polar.ts`

Purpose:

- single source for the Polar SDK instance

Read this file when:

- changing billing auth or environment routing

### `src/lib/utils.ts`

Purpose:

- tiny cross-cutting helpers

Read this file when:

- you need formatting or class-composition helpers

---

## Appendix F. `src/trpc` File Cards

### `src/trpc/init.ts`

Purpose:

- tRPC initialization and security-aware procedure helpers

Key idea:

- permissions are encoded once and reused everywhere

### `src/trpc/routers/_app.ts`

Purpose:

- combine router modules into one API tree

### `src/trpc/routers/voices.ts`

Purpose:

- voice querying and deletion

### `src/trpc/routers/generations.ts`

Purpose:

- generation querying and creation

### `src/trpc/routers/billing.ts`

Purpose:

- billing session and status work

### `src/trpc/client.tsx`

Purpose:

- browser/provider setup

### `src/trpc/query-client.ts`

Purpose:

- TanStack Query client factory

### `src/trpc/server.tsx`

Purpose:

- server-side prefetching and hydration bridge

---

## Appendix G. `src/hooks` File Cards

### `src/hooks/use-mobile.ts`

Purpose:

- mobile breakpoint detection

Used by:

- sidebar system

### `src/hooks/use-app-form.ts`

Purpose:

- typed TanStack Form context helpers

Used by:

- form-heavy feature components

### `src/hooks/use-audio-playback.ts`

Purpose:

- audio playback wrapper for URLs and local files

Used by:

- voice upload preview
- recorder preview

---

## Appendix H. `src/features/dashboard` File Cards

### `views/dashboard-view.tsx`

Role:

- top-level dashboard composition

### `components/dashboard-sidebar.tsx`

Role:

- left navigation and account controls

### `components/dashboard-header.tsx`

Role:

- greeting and utility actions

### `components/hero-pattern.tsx`

Role:

- decorative background

### `components/quick-action-card.tsx`

Role:

- one dashboard shortcut card

### `components/quick-actions-panel.tsx`

Role:

- list of shortcut cards

### `components/text-input-panel.tsx`

Role:

- quick prompt entry and redirect to TTS

### `data/quick-actions.ts`

Role:

- starter prompt data

---

## Appendix I. `src/features/voices` File Cards

### `data/voice-categories.ts`

Role:

- canonical category constants and labels

### `data/voice-scoping.ts`

Role:

- canonical built-in/system voice naming and scoping

### `hooks/use-audio-recorder.ts`

Role:

- browser recording engine

### `lib/params.ts`

Role:

- typed URL search param parsing

### `components/voice-recorder.tsx`

Role:

- recording UI

### `components/voice-create-form.tsx`

Role:

- create voice form with upload/record support

### `components/voice-create-dialog.tsx`

Role:

- modal wrapper around the create form

### `components/voice-card.tsx`

Role:

- display and interact with one voice

### `components/voices-list.tsx`

Role:

- list section for voices

### `components/voices-toolbar.tsx`

Role:

- top controls for voices page

### `views/VoicesLayout.tsx`

Role:

- structural layout wrapper

### `views/voices-view.tsx`

Role:

- overall voices page

---

## Appendix J. `src/features/text-to-speech` File Cards

### `data/constants.ts`

Role:

- feature constants

### `data/sliders.ts`

Role:

- metadata for generation control sliders

### `contexts/tts-voices-context.tsx`

Role:

- shared voice context for nested TTS UI

### `hooks/use-wavesurfer.ts`

Role:

- waveform handling for audio previews

### `components/text-to-speech-form.tsx`

Role:

- central form controller and mutation submitter

### `components/text-input-panel.tsx`

Role:

- main prompt editor inside the TTS workspace

### `components/generate-button.tsx`

Role:

- submit action component

### `components/prompt-suggestions.tsx`

Role:

- starter content for faster onboarding

### `components/settings-panel.tsx`

Role:

- settings/history side area composition

### `components/settings-drawer.tsx`

Role:

- mobile settings container

### `components/settings-panel-settings.tsx`

Role:

- parameter controls block

### `components/settings-panel-history.tsx`

Role:

- generation history block

### `components/history-drawer.tsx`

Role:

- mobile history UI

### `components/voice-selector.tsx`

Role:

- choose a voice for generation

### `components/voice-selector-button.tsx`

Role:

- trigger/select button for voice chooser

### `components/voice-preview-placeholder.tsx`

Role:

- empty preview state before a generation exists

### `components/voice-preview-panel.tsx`

Role:

- desktop playback/result panel

### `components/voice-preview-mobile.tsx`

Role:

- mobile playback/result panel

### `views/text-to-speech-layout.tsx`

Role:

- route layout wrapper

### `views/text-to-speech-view.tsx`

Role:

- new generation workflow page

### `views/text-to-speech-detail-view.tsx`

Role:

- completed generation workflow page

---

## Appendix K. `src/components/landing` File Cards

### `navbar.tsx`

Role:

- floating marketing nav

### `hero.tsx`

Role:

- headline and top showcase section

### `hero-title.tsx`

Role:

- animated hero title logic

### `waveform.tsx`

Role:

- decorative voice waveform animation

### `marquee.tsx`

Role:

- moving information strip

### `tts-section.tsx`

Role:

- screenshot/product explanation block

### `bento-grid.tsx`

Role:

- feature grid

### `pricing.tsx`

Role:

- pricing/plan section

### `footer.tsx`

Role:

- closing brand/footer area

---

## Appendix L. `src/components/ui` Inventory, One-Line Cards

This appendix is intentionally compact.

It gives each UI file a short identity label.

### `accordion.tsx`

- expandable content primitive

### `alert-dialog.tsx`

- destructive confirmation modal primitive

### `alert.tsx`

- inline alert/message primitive

### `aspect-ratio.tsx`

- keep media or blocks at a fixed aspect ratio

### `avatar.tsx`

- circular/square identity display primitive

### `badge.tsx`

- small status/tag pill

### `breadcrumb.tsx`

- breadcrumb navigation helpers

### `button-group.tsx`

- grouped button layout primitive

### `button.tsx`

- foundational action button primitive

### `calendar.tsx`

- date grid/calendar UI

### `card.tsx`

- boxed content surface primitive

### `carousel.tsx`

- scrollable carousel container

### `chart.tsx`

- Recharts theming/container wrapper

### `checkbox.tsx`

- checkbox input primitive

### `collapsible.tsx`

- open/close content primitive

### `combobox.tsx`

- searchable dropdown selection primitive

### `command.tsx`

- command menu/search list primitives

### `context-menu.tsx`

- right-click style action menu

### `dialog.tsx`

- modal dialog primitives

### `direction.tsx`

- directionality helper

### `drawer.tsx`

- drawer/sheet style primitive

### `dropdown-menu.tsx`

- dropdown actions primitive

### `empty.tsx`

- empty state presentation helper

### `field.tsx`

- field wrapper and validation visuals

### `form.tsx`

- `react-hook-form` glue helpers

### `hover-card.tsx`

- hover-triggered floating content

### `input-group.tsx`

- grouped input layout

### `input-otp.tsx`

- segmented OTP-style input

### `input.tsx`

- text input primitive

### `item.tsx`

- generic item/list block primitive

### `kbd.tsx`

- keyboard key visual chip

### `label.tsx`

- accessible label primitive

### `menubar.tsx`

- menubar primitives

### `native-select.tsx`

- styled native select

### `navigation-menu.tsx`

- richer navigation menu primitives

### `pagination.tsx`

- paginated list navigation controls

### `popover.tsx`

- floating overlay content primitive

### `progress.tsx`

- progress bar primitive

### `radio-group.tsx`

- mutually exclusive option group

### `resizable.tsx`

- resizable panels wrapper

### `scroll-area.tsx`

- styled scroll container

### `select.tsx`

- full custom select primitive

### `separator.tsx`

- visual divider

### `sheet.tsx`

- side panel modal primitive

### `sidebar.tsx`

- complete collapsible sidebar system

### `skeleton.tsx`

- loading shimmer placeholder

### `slider.tsx`

- drag-based numeric control

### `sonner.tsx`

- toast provider wrapper

### `spinner.tsx`

- loading spinner

### `switch.tsx`

- on/off toggle

### `table.tsx`

- table layout primitives

### `tabs.tsx`

- tabbed section primitives

### `textarea.tsx`

- multiline text input

### `toggle-group.tsx`

- grouped toggle buttons

### `toggle.tsx`

- single pressed-state toggle

### `tooltip.tsx`

- hover/focus help bubble

### `wavy-background.tsx`

- decorative animated background helper

---

## Appendix M. `public` and Binary Asset Meaning

### `public/logo.svg`

Used where product identity needs to be lightweight and crisp.

### `public/hero-bg.jpg`

Used for a richer photographic or atmospheric landing section.

### `public/Dashboard.jpg`

Used to sell the dashboard visually.

### `public/TTSpage.jpg`

Used to sell the TTS workflow visually.

### `scripts/system-voices/*.wav`

These are not frontend images.

They are seed assets for the actual audio system.

That is a crucial difference.

---

## Appendix N. Mini Glossary

### App Router

Next.js routing model based on folders, layouts, and server components.

### Clerk

Hosted auth and org management platform.

### tRPC

Typesafe API layer where client and server share procedure definitions.

### Prisma

ORM and schema migration tool for the database.

### R2

Cloudflare object storage compatible with the S3 API.

### Signed URL

A temporary URL that grants controlled access to a private object.

### Polar

Billing platform used for checkout, subscription state, and metered usage.

### Modal

Cloud execution platform used to run GPU inference for speech generation.

### FastAPI

Python API framework used by the Chatterbox service.

### Chatterbox

The speech generation engine/model service used by this app.

### Hydration

The process of taking server-prepared data and making it available to client-side React/query state.

### Query invalidation

Telling the cache that a server mutation changed data and it should be refreshed.

### Denormalized snapshot

A copy of data stored for history, even if the original record changes later.

### Org procedure

A tRPC procedure that only runs when a valid user and organization are both present.

---

## Appendix O. Environment Variable Reference

This appendix explains the env values defined in `src/lib/env.ts`.

### `POLAR_ACCESS_TOKEN`

Used by:

- `src/lib/polar.ts`

Why it exists:

- authenticate server calls to Polar

If missing:

- checkout creation breaks
- portal creation breaks
- subscription status checks break

### `POLAR_SERVER`

Used by:

- `src/lib/polar.ts`

Why it exists:

- choose sandbox or production Polar environment

If wrong:

- you may talk to the wrong billing environment

### `POLAR_PRODUCT_ID`

Used by:

- `src/trpc/routers/billing.ts`

Why it exists:

- tells Polar which product to sell in checkout

### `POLAR_METER_VOICE_CREATION`

Used by:

- `src/app/api/voices/create/route.ts`

Why it exists:

- identifies the metering event name for voice creation usage

### `POLAR_METER_TTS_GENERATION`

Used by:

- `src/trpc/routers/generations.ts`

Why it exists:

- identifies the metering event name for TTS generation usage

### `POLAR_METER_TTS_PROPERTY`

Defined in env schema:

- yes

Visible usage in current code snapshot:

- not obvious from the inspected files

What that suggests:

- reserved for expanded metering metadata or future logic

### `DATABASE_URL`

Used by:

- Prisma config
- `src/lib/db.ts`

Why it exists:

- tells Prisma how to connect to PostgreSQL

### `APP_URL`

Used by:

- tRPC client URL fallback
- billing checkout success URL

Why it exists:

- create absolute URLs on the server side

### `AWS_REGION`

Used by:

- `src/lib/r2.ts`
- seed script

Why it exists:

- R2 uses S3-compatible client setup that still expects a region value

### `R2_ACCOUNT_ID`

Used by:

- env validation
- seed script

Why it exists:

- identify the Cloudflare account backing the storage setup

### `R2_ACCESS_KEY_ID`

Used by:

- `src/lib/r2.ts`
- seed script

Why it exists:

- authenticate object storage requests

### `R2_SECRET_ACCESS_KEY`

Used by:

- `src/lib/r2.ts`
- seed script

Why it exists:

- authenticate object storage requests

### `R2_BUCKET_NAME`

Used by:

- `src/lib/r2.ts`
- seed script

Why it exists:

- tells the app which bucket contains voice and generation audio

### `CHATTERBOX_API_URL`

Used by:

- `src/lib/chatterbox-client.ts`
- `scripts/sync-api.ts`

Why it exists:

- points Next.js and tooling at the deployed Python service

### `CHATTERBOX_API_KEY`

Used by:

- `src/lib/chatterbox-client.ts`
- Python service verification logic on the other side

Why it exists:

- protects the TTS API from anonymous use

---

## Appendix P. System Voice Seed Inventory

This appendix documents the built-in voice seed data visible in `scripts/seed-system-voices.ts`.

### `Aaron`

Type:

- system voice

Category:

- `AUDIOBOOK`

Language:

- `en-US`

Description intent:

- soothing
- calm
- audiobook-style narrator

### `Abigail`

Type:

- system voice

Category:

- `CONVERSATIONAL`

Language:

- `en-GB`

Description intent:

- friendly
- warm
- approachable

### `Anaya`

Type:

- system voice

Category:

- `CUSTOMER_SERVICE`

Language:

- `en-IN`

Description intent:

- polite
- professional
- support-oriented

### `Andy`

Type:

- system voice

Category:

- `GENERAL`

Language:

- `en-US`

Description intent:

- versatile
- all-purpose
- clear

### `Archer`

Type:

- system voice

Category:

- `NARRATIVE`

Language:

- `en-US`

Description intent:

- laid-back
- reflective
- storytelling pace

### `Brian`

Type:

- system voice

Category:

- `CUSTOMER_SERVICE`

Language:

- `en-US`

Description intent:

- professional
- helpful
- support tone

### `Chloe`

Type:

- system voice

Category:

- `CORPORATE`

Language:

- `en-AU`

Description intent:

- bright
- bubbly
- polished

### `Dylan`

Type:

- system voice

Category:

- `GENERAL`

Language:

- `en-US`

Description intent:

- thoughtful
- intimate
- quiet conversation vibe

### `Emmanuel`

Type:

- system voice

Category:

- `CHARACTERS`

Language:

- `en-US`

Description intent:

- quirky
- cartoon-like
- distinctive

### `Ethan`

Type:

- system voice

Category:

- `VOICEOVER`

Language:

- `en-US`

Description intent:

- polished
- studio-like
- crisp

### `Evelyn`

Type:

- system voice

Category:

- `CONVERSATIONAL`

Language:

- `en-US`

Description intent:

- warm
- southern charm
- down-to-earth

### `Gavin`

Type:

- system voice

Category:

- `MEDITATION`

Language:

- `en-US`

Description intent:

- calm
- reassuring
- smooth

### `Gordon`

Type:

- system voice

Category:

- `MOTIVATIONAL`

Language:

- `en-US`

Description intent:

- uplifting
- encouraging
- energetic without chaos

### `Ivan`

Type:

- system voice

Category:

- `CHARACTERS`

Language:

- `ru-RU`

Description intent:

- deep
- cinematic
- dramatic

### `Laura`

Type:

- system voice

Category:

- `CONVERSATIONAL`

Language:

- `en-US`

Description intent:

- authentic
- warm
- conversational

### `Lucy`

Type:

- system voice

Category:

- `CUSTOMER_SERVICE`

Language:

- `en-US`

Description intent:

- direct
- composed
- phone-support friendly

### `Madison`

Type:

- system voice

Category:

- `PODCAST`

Language:

- `en-US`

Description intent:

- energetic
- casual
- chatty

### `Marisol`

Type:

- system voice

Category:

- `ADVERTISING`

Language:

- `en-US`

Description intent:

- confident
- persuasive
- ad-ready

### `Meera`

Type:

- system voice

Category:

- `CUSTOMER_SERVICE`

Language:

- `en-IN`

Description intent:

- friendly
- helpful
- service-oriented

### `Walter`

Type:

- system voice

Category:

- `NARRATIVE`

Language:

- `en-US`

Description intent:

- old
- raspy
- wise storyteller energy

---

## Appendix Q. End-to-End Flow Traces By File

This appendix spells out complete request chains so a beginner can follow them mechanically.

### Flow 1. Visitor opens the marketing page

1. Browser requests `/landing`.
2. `src/proxy.ts` sees that `/landing` is public.
3. Next.js loads `src/app/layout.tsx`.
4. Providers mount:
   - Clerk
   - tRPC React
   - nuqs
   - Sonner
5. Next.js renders `src/app/landing/page.tsx`.
6. That page renders:
   - navbar
   - hero
   - marquee
   - TTS section
   - bento grid
   - pricing
   - footer
7. `src/app/globals.css` provides the visuals and animation tokens.
8. Static assets are read from `public/`.

### Flow 2. User signs in and enters the app

1. User opens `/sign-in`.
2. Clerk UI from `src/app/sign-in/[[...sign-in]]/page.tsx` renders.
3. User authenticates.
4. Middleware in `src/proxy.ts` now sees a `userId`.
5. Middleware checks whether there is an active `orgId`.
6. If no org is active:
   - redirect to `/org-selection`
7. If an org is active:
   - allow access to dashboard routes

### Flow 3. User selects or creates an organization

1. Browser opens `/org-selection`.
2. `src/app/org-selection/page.tsx` renders Clerk `OrganizationList`.
3. User creates or selects an org.
4. Clerk updates auth context.
5. Middleware now sees both `userId` and `orgId`.
6. Protected app routes are unlocked.

### Flow 4. User opens the dashboard

1. Browser opens `/`.
2. `src/app/(dashboard)/layout.tsx` reads the sidebar cookie.
3. `SidebarProvider` is initialized.
4. `DashboardSidebar` renders:
   - nav items
   - org switcher
   - billing usage container
   - user button
5. `src/app/(dashboard)/page.tsx` renders `DashboardView`.
6. `DashboardView` renders:
   - `PageHeader`
   - `HeroPattern`
   - `DashboardHeader`
   - dashboard text input panel
   - quick actions panel

### Flow 5. User opens the voices page

1. Browser opens `/voices`.
2. `src/app/(dashboard)/voices/page.tsx` parses search params through `voicesSearchParamsCache`.
3. The page calls `prefetch(trpc.voices.getAll.queryOptions({ query }))`.
4. `src/trpc/server.tsx` stores prefetched data in a server QueryClient.
5. `HydrateClient` serializes that state to the client.
6. `VoicesView` reads URL query state with `nuqs`.
7. `VoicesView` runs `useSuspenseQuery(trpc.voices.getAll.queryOptions({ query }))`.
8. Because the query was prefetched, the UI can render without an extra initial wait.
9. The page displays:
   - Team Voices
   - Built-in Voices

### Flow 6. User creates a new custom voice

1. User opens the create dialog from the voices page.
2. `VoiceCreateDialog` renders `VoiceCreateForm`.
3. The user either uploads a file or records one.
4. If uploading:
   - `react-dropzone` handles local file selection
5. If recording:
   - `useAudioRecorder` requests microphone access
   - `RecordRTC` captures audio
   - `wavesurfer.js` renders the live waveform
6. The form also collects:
   - name
   - category
   - language
   - description
7. On submit, `voice-create-form.tsx` sends a `POST` request to `/api/voices/create`.
8. The route validates user and org through Clerk.
9. The route checks subscription status with Polar.
10. The route validates metadata using Zod.
11. The route validates binary audio data and duration.
12. Prisma creates a `Voice` row.
13. `src/lib/r2.ts` uploads the bytes to R2.
14. Prisma updates the row with `r2ObjectKey`.
15. Polar receives a voice creation usage event.
16. The client invalidates:
   - voice list query
   - billing status query
17. The new voice appears in Team Voices.

### Flow 7. User opens the main TTS page

1. Browser opens `/text-to-speech`.
2. `src/app/(dashboard)/text-to-speech/page.tsx` reads optional `text` and `voiceId`.
3. The page prefetched:
   - all voices
   - generation history
4. `TextToSpeechView` reads prefetched voices.
5. It merges system and custom voices into one array.
6. It resolves a valid fallback voice.
7. It builds default form values.
8. `TTSVoicesProvider` shares voice data with nested components.
9. `TextToSpeechForm` provides submit behavior.
10. The screen renders:
   - text editor area
   - empty preview placeholder
   - settings panel

### Flow 8. User generates speech

1. User enters text.
2. User picks a voice.
3. User adjusts temperature/top-p/top-k/repetition penalty.
4. User clicks generate.
5. `TextToSpeechForm` validates values with Zod.
6. It calls `trpc.generations.create`.
7. `src/trpc/routers/generations.ts` runs on the server.
8. `orgProcedure` guarantees the request has `userId` and `orgId`.
9. Polar subscription state is fetched.
10. If inactive:
   - the procedure throws a forbidden error
11. The selected voice is fetched from Prisma.
12. The procedure ensures the voice has an `r2ObjectKey`.
13. `src/lib/chatterbox-client.ts` sends a typed `POST /generate` request.
14. The Python service receives:
   - prompt
   - voice key
   - tuning parameters
15. The Python service maps the voice key into mounted R2 storage.
16. The GPU model generates audio bytes.
17. The bytes are returned to Next.js.
18. Prisma creates a generation row.
19. R2 stores the generated `.wav`.
20. Prisma updates the generation with its `r2ObjectKey`.
21. Polar receives a usage event.
22. The mutation returns `{ id }`.
23. The browser redirects to `/text-to-speech/[id]`.

### Flow 9. User views generated speech details

1. Browser opens `/text-to-speech/[generationId]`.
2. The page prefetched:
   - generation by id
   - all voices
   - generation history
3. `TextToSpeechDetailView` reads those queries.
4. It reconstructs form defaults from the stored generation.
5. It preserves `voiceName` as a snapshot for display.
6. It renders:
   - prompt panel
   - mobile preview
   - desktop preview
   - settings panel

### Flow 10. User presses play on generated audio

1. Preview UI points to `/api/audio/[generationId]`.
2. Browser requests that route.
3. `src/app/api/audio/[generationId]/route.ts` checks auth and org ownership.
4. Prisma fetches the generation row.
5. The route gets a signed R2 URL through `getSignedAudioUrl`.
6. The route fetches the private object from R2.
7. The route streams the audio body to the browser.
8. The browser audio element plays it.

### Flow 11. User previews a voice sample

1. UI requests `/api/voices/[voiceId]`.
2. The route checks auth.
3. Prisma fetches voice metadata.
4. If the voice is custom, org ownership is enforced.
5. The route builds a signed R2 URL.
6. The route fetches the stored sample.
7. The route streams the bytes back.
8. The browser plays the sample.

---

## Appendix R. Deep Backend Explanations

This appendix goes beyond "what the file is".

It explains how the backend files think.

For a beginner, backend code can feel abstract because nothing visual happens on screen.

So the best way to understand backend files is to ask four questions for each one:

1. What inputs does this file receive?
2. What trust checks does it perform?
3. What side effects does it cause?
4. What output does it return?

That is the model used below.

### R.1 `src/proxy.ts`

This file is the request gatekeeper.

It runs before many requests reach your pages.

That means it is not "page code".

It is traffic control code.

#### What inputs it receives

It receives:

- the incoming request URL
- Clerk auth context

Clerk gives it:

- `userId`
- `orgId`

Those two values are the entire basis of the app’s access rules.

#### What the route matchers mean

`createRouteMatcher` builds rule functions.

You created:

- `isPublicRoute`
- `isOrgSelectionRoute`

This is important because it keeps your middleware readable.

Instead of scattering string comparisons all over the function, the code names route groups.

That is a maintainability decision.

#### The logic in plain English

The middleware says:

- if the route is public, allow it
- if the user is not signed in:
  - redirect `/` to `/landing`
  - protect all other private routes
- if the route is the org selection route, allow it
- if the user exists but no org is selected, redirect to `/org-selection`
- otherwise allow the request

That is the whole access model.

#### Why this file matters so much

Without this file:

- users could hit routes in the wrong state
- your UI would need more defensive checks
- org-dependent pages would break more often

This middleware moves auth state enforcement to the edge of the app.

That is usually better than checking it late inside every page.

#### Why redirect `/` to `/landing`

This is a product decision hidden inside backend/middleware logic.

It means:

- signed-out users should see marketing
- signed-in users should see the app

That is classic SaaS routing behavior.

#### The `config.matcher`

This part tells Next.js when middleware should run.

It excludes many static files and framework internals.

Why?

Because middleware should not waste time processing:

- CSS files
- images
- static assets

It should focus on app routes and APIs.

That improves performance and avoids unnecessary complexity.

### R.2 `src/lib/env.ts`

This file looks small, but it is one of the safest files in the repo.

Beginners often think env files are boring.

They are not.

They are how production failures often start.

#### What problem it solves

Normally, people write:

```ts
process.env.DATABASE_URL
```

everywhere.

That is weak because:

- the value may be missing
- the value may be malformed
- nobody knows all required variables in one place

Your file solves that by defining a typed schema.

#### Why Zod is used here

Zod gives runtime validation.

That means startup or first access can fail early with a clear reason if configuration is broken.

This is much better than a mysterious failure later in:

- database code
- storage code
- billing code
- external API calls

#### Why `experimental__runtimeEnv: {}`

This reflects the split between server-only and runtime environment handling in `@t3-oss/env-nextjs`.

Your current env file is effectively server-focused.

That is correct because the listed variables are sensitive.

#### Important architectural insight

This file is a dependency root.

Many infrastructure files import `env`.

That means this file is upstream of:

- DB access
- R2 access
- Polar access
- Chatterbox access

If this file is wrong, a large part of the backend fails.

### R.3 `src/lib/db.ts`

This is the database bootstrap file.

It is short because it should be short.

Database client creation should be boring and reliable.

#### The adapter pattern here

You are using:

- `PrismaPg`
- `PrismaClient`

This means Prisma is being created with an adapter-based PostgreSQL connection strategy.

This can be useful in modern deployment setups where direct adapter control is preferred.

#### Why `normalizeDatabaseUrl`

Even though the implementation is elsewhere, the design intention is clear:

- take the raw env string
- make sure Prisma receives a consistent format

That is a defensive infrastructure pattern.

#### Why the global singleton pattern exists

In Next.js development mode, modules can reload often.

If every reload creates a new Prisma client, you can end up with too many open connections.

Your file avoids that by storing the client on `global` in non-production.

That is not random boilerplate.

It is specifically solving a real dev-runtime problem.

#### Why this file exports only `prisma`

That is good.

It keeps the rest of the codebase from caring about connection setup internals.

Most app code should think:

- "I need Prisma"

not:

- "How should Prisma be constructed?"

### R.4 `src/lib/r2.ts`

This file is the storage abstraction for audio.

It is important because the app stores audio outside the database.

That is the correct choice.

Databases are not ideal for storing and streaming lots of binary audio objects directly.

#### The S3-compatible model

Cloudflare R2 is used through the AWS S3 SDK.

That is why this file creates an `S3Client`.

Even though the storage provider is not AWS S3 itself, the API compatibility lets you reuse mature tooling.

#### `uploadAudio`

This function receives:

- a `Buffer`
- a storage `key`
- optional `contentType`

It writes an object into the configured bucket.

This function is used after:

- voice creation
- speech generation

Meaning:

it handles both source assets and generated outputs.

#### `deleteAudio`

This deletes one object by key.

In your app, deletion is a cleanup step after removing a custom voice.

Important subtlety:

The app treats storage cleanup as desirable but not more important than the DB delete.

That is visible in the `catch(() => {})` pattern elsewhere.

In other words:

- primary source of truth cleanup is DB state
- storage cleanup is best effort

That is a reasonable tradeoff in a small app.

#### `getSignedAudioUrl`

This creates a time-limited URL to access a private file.

Why not return the bucket path directly?

Because private storage should not be public by default.

This function is what makes proxy streaming possible in the API routes.

### R.5 `src/lib/chatterbox-client.ts`

This file is the bridge from your TypeScript backend to your Python backend.

#### What it hides

Without this file, generation code would need to repeat:

- base URL setup
- auth header setup
- type annotations

Instead, it centralizes those concerns once.

#### Why `openapi-fetch` is valuable here

This is not just about convenience.

It means:

- your request paths are typed
- request bodies are typed
- returned success/error structures are typed

That reduces cross-service mismatch.

This is especially valuable when the service is written in another language.

### R.6 `src/trpc/init.ts`

This file defines your server API philosophy.

It is more important than many bigger files.

#### `createTRPCContext`

Your current context creator returns an empty object.

That is okay because actual auth information is injected later by middleware-style procedures instead of the base context.

That means:

- the context starts minimal
- procedures enrich it only when needed

This can make the auth model clearer.

#### Why `superjson` is configured here

The server and client need to agree on serialization.

By placing `transformer: superjson` here, the server knows how to serialize values beyond plain JSON safely.

Then the client link also mirrors it.

That symmetry matters.

#### Sentry middleware

You attached `Sentry.trpcMiddleware`.

That means tRPC requests get instrumented centrally, rather than each route manually logging and capturing exceptions.

That is the right layer for observability.

#### `baseProcedure`

This is the lowest level reusable procedure.

It includes Sentry middleware.

Every other procedure builds on top of it.

#### `authProcedure`

This checks Clerk auth and enforces `userId`.

If no user exists, it throws `UNAUTHORIZED`.

This turns auth into reusable API structure instead of repeated inline code.

#### `orgProcedure`

This is the real backbone of your app.

Most business logic depends on organization context.

This procedure says:

- a user must exist
- an active organization must exist

If not, the API refuses the operation.

That means backend business logic can safely assume org state is present once it enters an `orgProcedure`.

This removes lots of repeated null-check clutter from router files.

### R.7 `src/trpc/routers/voices.ts`

This router is smaller than `generations.ts`, but it still shows good server design patterns.

#### `getAll`

This procedure accepts optional search input.

The search behavior is implemented by building a conditional Prisma filter.

That filter checks:

- `name`
- `description`

with case-insensitive matching.

That means search works across both short labels and descriptive text.

#### Why system and custom voices are fetched separately

You could have returned one merged list.

But you did not.

That is important.

You returned:

- `custom`
- `system`

That means the API reflects a product distinction, not just a storage distinction.

The UI likely wants:

- organization voices in one section
- built-in voices in another section

Returning separated data avoids re-splitting on the client.

That is a useful API shape.

#### `delete`

This mutation is also a permission enforcement example.

It does not merely delete by ID.

It first looks up a voice that matches:

- requested ID
- `CUSTOM` variant
- current `orgId`

This is crucial.

Why?

Because even if a user guesses another voice ID, they should not be able to delete it.

The query itself encodes authorization.

That is often better than loading broadly and checking later.

#### Cleanup strategy

The DB delete happens first.

Then storage cleanup is attempted.

This sequence says:

- app-level record truth matters first
- storage cleanup failure should not block the user operation

That is a reasonable eventual-consistency style decision.

### R.8 `src/trpc/routers/generations.ts`

This is the most backend-important TypeScript file in the repo.

It holds the core value-producing workflow.

#### The shape of the router

It has three operations:

- load one generation
- load all generations
- create a generation

The first two are history/data access.

The third is the product engine entrypoint.

#### `getById`

This reads a single generation owned by the current org.

It intentionally omits:

- `orgId`
- `r2ObjectKey`

Why omit those?

Because the client usually does not need internal org IDs or storage keys.

Instead, the server exposes a safer derived value:

- `audioUrl: /api/audio/${generation.id}`

This is good backend design.

It hides storage details and gives the UI the only URL it actually needs.

#### `getAll`

This returns generation history sorted newest first.

Again, it omits:

- `orgId`
- `r2ObjectKey`

That means the frontend gets product-friendly data, not infrastructure-leaky data.

#### `create`: why it starts with subscription checking

Generation costs money.

It uses compute.

It may use GPU-backed inference.

So the first serious business rule is:

- only subscribed orgs can generate

This check happens before voice lookup and before remote inference.

That is good because it avoids unnecessary work.

#### Polar customer state logic

The code asks Polar for `getStateExternal({ externalId: ctx.orgId })`.

This tells us your org ID is the external billing customer ID.

That is a clean cross-system identity strategy:

- Clerk org ID doubles as Polar external customer key

This avoids inventing another mapping layer.

#### Voice lookup logic

The generation code fetches a voice by ID with a rule:

- system voices are always allowed
- custom voices are allowed only if they belong to the current org

This is exactly the kind of authorization check backend code should own.

The frontend should not be trusted to enforce this.

#### Why `r2ObjectKey` existence is checked

A voice record can exist before its audio is usable if something failed during creation.

So the code checks whether the voice has an associated object key before calling inference.

That is a precondition check.

Precondition checks are a sign of good defensive backend design.

#### The Chatterbox API call

The call sends:

- prompt text
- voice key
- temperature
- top-p
- top-k
- repetition penalty
- loudness normalization flag

This is the business-level generation request.

The app backend does not generate the audio itself.

It orchestrates the generation.

That distinction is important.

#### Why Sentry logging appears before and after

The route logs:

- generation started
- audio generated
- generation failed

This gives operational visibility.

If users report failures, these logs help identify where the pipeline broke.

#### Why the DB record is created before upload finalization

The code creates a generation row first, then constructs the final R2 key using that row’s ID.

That is smart because:

- the object key becomes deterministic
- the generated DB ID becomes part of the storage path

This links storage and database cleanly.

#### Why there is manual rollback code

If DB write succeeds but later storage update fails, the code tries to delete the newly created generation row.

This is a mini rollback strategy.

It avoids half-finished generation records from cluttering the system.

That is very important backend hygiene.

#### Why billing ingestion is wrapped in a separate `try/catch`

Metering is important.

But it should not block the user from receiving their successful generation result after the core work succeeded.

So the code treats billing ingestion as:

- important
- but non-critical to the immediate response

This is a product tradeoff:

- user success first
- back-office accounting second, with monitoring

That is often the right tradeoff for SaaS UX.

### R.9 `src/trpc/routers/billing.ts`

This file is smaller, but it defines how your app thinks about paid access.

#### `createCheckout`

This mutation creates a hosted checkout.

Input:

- none from the UI, because org context already exists

Backend dependencies:

- current org ID
- configured product ID

Output:

- `checkoutUrl`

Important idea:

The frontend does not build checkout state manually.

It asks the backend for a trusted billing URL.

That is the correct pattern.

#### `createPortalSession`

This creates a billing management URL for an existing customer.

Again, the browser never gets to construct or guess this itself.

The server asks Polar and returns the official URL.

#### `getStatus`

This query is interesting because it is not just checking yes/no subscription state.

It also attempts to compute estimated usage cost by summing meter amounts.

That means billing is not only access control.

It is also user-facing transparency.

The sidebar uses that output to show current estimated period cost.

That is a product feedback loop from backend to UX.

### R.10 `src/app/api/voices/create/route.ts`

This is one of the best backend study files in the repo because it combines:

- auth
- validation
- binary request handling
- metadata parsing
- DB writes
- object storage writes
- billing events

#### Why this is a REST route instead of a tRPC procedure

The current design sends the raw audio file as the request body with metadata in query params.

That is a straightforward route-handler-friendly pattern.

Binary uploads are often simpler in explicit route handlers than in a standard JSON-shaped tRPC mutation.

So this design makes sense.

#### Step 1: auth

The route immediately gets:

- `userId`
- `orgId`

If either is missing, it returns `401`.

That means unauthenticated or org-less clients never reach expensive work.

#### Step 2: subscription gate

Before validating and storing the file deeply, the route checks Polar.

This prevents unpaid users from consuming storage and processing capacity.

That is an important backend cost-control pattern.

#### Step 3: schema validation of metadata

The route reads metadata from URL search params:

- `name`
- `category`
- `language`
- `description`

Then validates them using Zod.

Important note:

The audio file itself is not in this Zod object because the file is the raw body, not JSON metadata.

That is a normal split in binary-upload endpoints.

#### Step 4: read binary body

The route uses:

```ts
const fileBuffer = await request.arrayBuffer();
```

This means the entire uploaded audio is loaded into memory.

That is simple and fine for your current max size of 20 MB.

If files were much larger, streaming/multipart approaches would matter more.

#### Step 5: file-level validation

The route checks:

- body exists
- body size is under 20 MB
- `Content-Type` exists

This is crucial because a valid signed-in user can still send bad input.

Auth does not equal valid data.

#### Step 6: metadata parsing from actual bytes

This is a strong backend choice.

The code does not trust the file extension or header name alone.

It uses `music-metadata` to inspect the binary and get duration.

That means the route validates the content, not just the filename.

This is safer and more product-correct.

#### Step 7: minimum duration rule

The route requires at least 10 seconds of audio.

This is not only a technical rule.

It is a model-quality rule.

Short samples would likely make voice cloning worse.

So the backend is enforcing an ML/product constraint.

#### Step 8: create DB row before storage finalization

Just like generation creation, voice creation makes a DB row first so the final storage key can include the voice ID.

That gives storage a stable naming structure:

- `voices/orgs/${orgId}/${voice.id}`

That path design helps organization and debugging.

#### Step 9: upload bytes to R2

The route converts the `ArrayBuffer` to `Buffer`, then uploads it.

That is the permanent storage step.

#### Step 10: update the row with `r2ObjectKey`

The row is not fully complete until the storage location exists.

This two-step DB write pattern is common when IDs are needed to compute external keys.

#### Step 11: rollback if storage fails

If something breaks after the DB row is created, the route tries to delete the created record.

That avoids dangling voice entries.

Again, this is backend consistency work.

#### Step 12: bill/meter usage

After successful creation, the route sends a Polar usage event.

Like generation metering, this is non-blocking from the user’s perspective.

That is good UX.

### R.11 `src/app/api/voices/[voiceId]/route.ts`

This is a secure media proxy route.

#### Why not link directly to R2

Because:

- system voices may be public-ish in concept but still stored privately
- custom voices must absolutely remain org-protected

So the route becomes a permission-aware access layer.

#### The important permission rule

If the voice is custom and its `orgId` does not match the current org, return 404.

Why 404 instead of 403?

Because it leaks less.

It tells outsiders:

- "this resource is not available"

rather than:

- "yes, it exists, but you cannot access it"

That is a subtle but useful security posture.

#### Cache behavior

System voices get:

- `public, max-age=86400`

Custom voices get:

- `private, max-age=3600`

This is smart.

It reflects the different privacy and reuse expectations of each asset type.

### R.12 `src/app/api/audio/[generationId]/route.ts`

This route is similar to the voice route, but for generated speech outputs.

#### Why it matters

Generated outputs are private by default because they are tied to an org’s text content and usage.

That means they should not be public bucket URLs.

#### Data flow inside the route

1. auth check
2. generation lookup scoped to org
3. object-key existence check
4. signed URL generation
5. fetch private storage object
6. stream response body back to client

This pattern is a classic backend "asset proxy" pattern.

It lets your app stay in control of private media access.

### R.13 `src/trpc/server.tsx`

This file is not a route.

It is a server-side data bridge.

Beginners sometimes skip it because it looks infrastructural.

Do not skip it.

#### Why it exists

In App Router, you want server components to prepare data before the browser mounts.

This file gives you that path for tRPC.

#### `getQueryClient`

It uses `cache(makeQueryClient)`.

That means:

- within the same request lifecycle, the same QueryClient instance is reused

This matters because multiple prefetches on one page should accumulate into one dehydrated state.

#### `trpc = createTRPCOptionsProxy(...)`

This creates a server-friendly proxy around your app router.

It lets pages write code like:

```ts
prefetch(trpc.voices.getAll.queryOptions())
```

That is a very ergonomic pattern.

#### `HydrateClient`

This serializes the server-side query cache into a client-side hydration boundary.

That is how prefetched data becomes instantly available to `useSuspenseQuery`.

Without this file, your pages could still work, but with more client-side loading overhead and repeated fetches.

### R.14 `chatterbox_tts.py`

This is the most important non-TypeScript backend file.

It is the inference backend.

Think of it as the factory where speech is actually manufactured.

#### Top-level architecture

This file defines:

- a Modal image
- a Modal app
- a mounted R2 bucket
- a class-based GPU worker
- a FastAPI web app

This is not random Python.

It is cloud inference orchestration code.

#### Why a mounted bucket is used

The file mounts the R2 bucket read-only at `/r2`.

This means the inference service can read voice sample files by path as if they were local files.

That is convenient because many ML/audio libraries expect filesystem paths, not S3 URLs.

This design avoids downloading voice files manually inside each request.

That is a major operational simplification.

#### Modal image definition

The image installs:

- `chatterbox-tts`
- `fastapi[standard]`
- `peft`

This means the service image bundles the model runtime and API framework.

#### API key verification

The FastAPI app protects all routes with `verify_api_key`.

That means even if somebody finds the service URL, they still need the expected key.

This mirrors the TypeScript-side `CHATTERBOX_API_KEY` setup.

That is cross-service trust design.

#### `TTSRequest` model

This Pydantic model is the request contract.

It validates:

- prompt length
- voice key presence
- numeric generation settings and ranges

This means validation happens on both sides:

- TypeScript side
- Python side

That redundancy is good.

Do not rely on one service only for validation.

#### `@app.cls(...)`

This creates a class-based Modal worker with:

- GPU type `a10g`
- scale-down window
- mounted bucket
- secrets

This is your deployment/runtime policy.

It says:

- use GPU inference
- allow idle scale-down after a period
- mount storage
- inject secrets securely

#### `load_model`

This runs when the Modal worker starts.

It loads the TTS model onto CUDA.

This is important because model loading is expensive.

You do not want to reload the model for every request if the runtime can stay warm.

#### `serve`

This constructs the FastAPI app.

The `/generate` endpoint:

- checks that the voice file exists in mounted storage
- calls `self.generate.local(...)`
- returns a streaming WAV response

This method is your HTTP boundary.

#### `generate`

This is the actual inference method.

It calls the model’s `.generate(...)` function with the prompt and voice sample path.

Then it writes the generated waveform into an in-memory WAV buffer using `torchaudio`.

Then it returns raw bytes.

That is the essential "turn text + voice sample into WAV" operation.

#### `local_entrypoint`

This is a developer convenience function.

It lets you trigger a local test call and save output to disk.

That is useful for debugging the model service independently from the Next.js app.

### R.15 `scripts/seed-system-voices.ts`

This file is backend-adjacent infrastructure, not request-time backend.

It deserves deeper explanation because it sets up important production data.

#### Why a seed script exists at all

Built-in voices are not hardcoded in React.

They are database entities with storage-backed sample audio.

That means they need to be created in your system, not just displayed by frontend constants.

The seed script does that installation work.

#### Why metadata and binary audio are paired here

Each voice is not just:

- a name

It is:

- a database row
- a category
- a language
- a description
- an uploaded audio sample

This script coordinates all of those together.

#### Update-vs-create behavior

The script first checks whether a system voice already exists.

If it does:

- upload/refresh its audio file
- update metadata

If it does not:

- create it
- upload its audio
- save the storage key

This means the script is idempotent-ish.

It can be re-run to keep seed data in sync.

That is much better than a seed that only works once.

---

## Appendix S. Backend Patterns Present In This Repo

This appendix teaches patterns, not just files.

### Pattern 1. Authorization encoded in database query filters

Example:

- only delete voices where `orgId` matches current org

Why good:

- harder to forget permission checks
- reduces "load too much then filter later" mistakes

### Pattern 2. Create DB row first, then compute external storage key

Example:

- voice creation
- generation creation

Why good:

- external key can include a stable DB ID
- easier debugging and organization

### Pattern 3. Best-effort cleanup for non-primary side effects

Example:

- deleting storage object after DB delete
- Polar ingestion failures not blocking user success

Why good:

- user experience stays resilient
- operations still get logged/captured

### Pattern 4. Hide raw storage keys from the frontend

Example:

- returning `audioUrl` instead of `r2ObjectKey`

Why good:

- cleaner API
- less infrastructure leakage
- stronger encapsulation

### Pattern 5. Validate on both sides of a service boundary

Example:

- TypeScript validates generation inputs
- Python validates them again

Why good:

- one service should not blindly trust another

### Pattern 6. Separate orchestration from heavy computation

Example:

- Next.js handles auth, billing, history, storage, and permissions
- Modal/Python handles generation math

Why good:

- each runtime does what it is best at

### Pattern 7. Use route handlers for binary/media workflows

Example:

- voice upload
- audio streaming

Why good:

- media transport often needs lower-level request handling than JSON APIs

### Pattern 8. Use tRPC for structured app data workflows

Example:

- voices list
- generation history
- billing state

Why good:

- end-to-end typing
- easy cache integration
- clean frontend calling patterns

---

## Appendix T. Deep Reading Guide For Important Backend Files

This appendix is intentionally long and repetitive.

It is designed for a beginner who wants to read real backend code slowly.

The goal is not to summarize.

The goal is to teach you how to read the code with confidence.

The most important idea:

backend code is usually doing one or more of these jobs:

- validating trust
- transforming input
- calling infrastructure
- protecting data
- writing records
- returning safe output

If you keep asking which of those jobs a given line is doing, backend code becomes much easier to understand.

### T.1 How To Read `src/trpc/routers/generations.ts`

This file is the central product workflow.

If this file disappears, the app still has:

- auth
- voices
- landing page
- billing checks

But it loses its main "value creation" action:

- text becoming speech

That is why this file deserves extremely slow reading.

#### The imports

The file starts with imports:

- Sentry
- Zod
- Polar
- env
- `TRPCError`
- Chatterbox client
- Prisma client
- R2 upload helper
- text length constant
- tRPC router helpers

That import list alone teaches you the responsibilities of the file.

You can often understand a backend file by its imports before reading its body.

Here, the imports say:

- this file logs and monitors things
- this file validates input
- this file checks billing
- this file talks to an external generation service
- this file writes to the database
- this file uploads audio
- this file belongs to the org-protected API layer

That is a huge amount of architecture information just from the imports.

#### `export const generationsRouter = createTRPCRouter({ ... })`

This line means:

- we are defining a named collection of procedures
- those procedures will be mounted into the app router

Think of a router like a namespace.

Inside this namespace, the frontend will later call:

- `trpc.generations.getAll`
- `trpc.generations.getById`
- `trpc.generations.create`

The file is not just random functions.

It is defining the `generations` backend API surface.

#### `getById`

The code:

```ts
getById: orgProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => { ... })
```

Read it in layers.

Layer 1:

- `orgProcedure`

This means the request is only allowed if:

- a signed-in user exists
- an active org exists

So by the time the function body runs, `ctx.orgId` is guaranteed.

That matters.

It means the function body does not need to keep asking:

- "Do I even know who this org is?"

Layer 2:

- `.input(z.object({ id: z.string() }))`

This means the procedure requires an object with a string `id`.

Before any database work happens, the shape of the input is checked.

That prevents malformed calls from reaching your DB logic.

Layer 3:

- `.query(async ({ input, ctx }) => { ... })`

This means:

- it is a read operation
- it is async
- it gets validated `input`
- it gets trusted `ctx`

Inside:

```ts
const generation = await prisma.generation.findUnique({
  where: { id: input.id, orgId: ctx.orgId },
  omit: {
    orgId: true,
    r2ObjectKey: true,
  },
});
```

Important detail:

The query includes both:

- `id`
- `orgId`

That is security inside the query itself.

This does not say:

- load any generation by id
- then check if it belongs to this org

It says:

- only return a row if the id and org ownership both match

That is tighter and cleaner.

Then:

```ts
if (!generation) {
  throw new TRPCError({ code: "NOT_FOUND" });
}
```

This means:

- no match means either the record does not exist
- or it does exist but not for this org

In both cases the caller gets a simple not-found response.

That reduces data leakage.

Then:

```ts
return {
  ...generation,
  audioUrl: `/api/audio/${generation.id}`,
};
```

This is an example of backend response shaping.

The DB contains:

- `r2ObjectKey`

The frontend receives:

- `audioUrl`

That is a better abstraction.

The client should not need to know how the audio is stored.

It should only know how to retrieve it safely.

That is why the backend invents a cleaner output shape than the raw DB row.

#### `getAll`

This procedure is similar but simpler.

The line:

```ts
const generations = await prisma.generation.findMany({
  where: { orgId: ctx.orgId },
  orderBy: { createdAt: "desc" },
  omit: {
    orgId: true,
    r2ObjectKey: true,
  },
});
```

teaches several things.

First:

- history is org-scoped

Second:

- history is newest-first

Third:

- internal infrastructure details are hidden

That means the backend is opinionated about what the frontend needs.

That is good.

A backend should not blindly leak tables if a cleaner product representation exists.

#### `create`

This is the longest and most important procedure.

It is easier to understand if you split it into stages.

##### Stage 1. Input contract

The input Zod schema says the procedure needs:

- `text`
- `voiceId`
- `temperature`
- `topP`
- `topK`
- `repetitionPenalty`

Each field has a range.

This means the server defines the allowed generation parameter space.

That is important.

Without this, a buggy or malicious client could send absurd values.

Examples of protected constraints:

- text cannot be empty
- text cannot exceed `TEXT_MAX_LENGTH`
- temperature cannot go below 0 or above 2
- top-p cannot exceed 1
- top-k must be at least 1

This is not UI validation.

This is backend contract enforcement.

##### Stage 2. Subscription enforcement

This block:

```ts
try {
  const customerState = await polar.customers.getStateExternal({ externalId: ctx.orgId });
  const hasActiveSubscription = (customerState.activeSubscriptions ?? []).length > 0;
  if (!hasActiveSubscription) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "SUBSCRIPTION_REQUIRED",
    });
  }
} catch (err) {
  if (err instanceof TRPCError) throw err;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "SUBSCRIPTION REQUIRED",
  });
}
```

is more subtle than it first appears.

What it really says:

- try to look up the billing customer by org ID
- if they exist but have no active subscription, forbid generation
- if lookup itself fails, also forbid generation

That second rule matters.

It means:

- "customer missing in billing system" is treated the same as "not subscribed"

This is a conservative access rule.

From a business perspective, that is safer than allowing the action when billing state is uncertain.

Notice also that two slightly different messages exist:

- `SUBSCRIPTION_REQUIRED`
- `SUBSCRIPTION REQUIRED`

That inconsistency is minor, but as a reader you should notice it because client logic may care about exact strings.

In fact, your frontend checks for `"SUBSCRIPTION REQUIRED"` in one place.

That kind of exact-string coupling is something beginners should learn to spot.

##### Stage 3. Voice lookup and authorization

This block:

```ts
const voice = await prisma.voice.findUnique({
  where: {
    id: input.voiceId,
    OR: [
      { variant: "SYSTEM" },
      { variant: "CUSTOM", orgId: ctx.orgId, }
    ],
  },
  select: {
    id: true,
    name: true,
    r2ObjectKey: true,
  },
});
```

is trying to encode:

- system voices are globally allowed
- custom voices must belong to this org

The intent is very good.

The important lesson for a beginner is the intent, not just the syntax.

This block is doing both:

- existence lookup
- permission check

in one query shape.

Then:

```ts
if (!voice) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Voice not found",
  });
}
```

This avoids distinguishing:

- nonexistent voice
- forbidden voice

Again, that is a controlled information boundary.

##### Stage 4. Precondition check for media existence

This block:

```ts
if (!voice.r2ObjectKey) {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Voice audio not available",
  });
}
```

is a very good example of backend defensive programming.

Why?

Because a voice record can exist in the database while its audio sample is not usable.

That can happen if:

- upload failed
- partial setup happened
- storage was cleaned incorrectly

So the system does not assume "row exists" means "voice is ready".

That is mature backend thinking.

##### Stage 5. External generation request

This call:

```ts
const { data, error } = await chatterbox.POST("/generate", {
  body: {
    prompt: input.text,
    voice_key: voice.r2ObjectKey,
    temperature: input.temperature,
    top_p: input.topP,
    top_k: input.topK,
    repetition_penalty: input.repetitionPenalty,
    norm_loudness: true,
  },
  parseAs: "arrayBuffer",
});
```

is the line where your backend stops being self-contained and starts orchestrating another service.

This is the service boundary.

Very important beginner lesson:

Backend files often do not "do the work" directly.

They coordinate the work.

This Next.js backend is not synthesizing audio.

It is:

- validating
- authorizing
- composing a request
- calling the inference service
- handling the result safely

That is still core backend engineering.

##### Stage 6. Monitoring start event

This line:

```ts
Sentry.logger.info("Generation started", {
  orgId: ctx.orgId,
  voiceId: input.voiceId,
  textLength: input.text.length,
});
```

means:

- even before final success, the system records that work began

That is useful for:

- support debugging
- tracking load patterns
- correlating failed attempts

Observability is part of backend design, not just an extra tool.

##### Stage 7. External response validation

This block:

```ts
if (error) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to generate audio",
  });
}
```

and:

```ts
if (!(data instanceof ArrayBuffer)) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Invalid audio response",
  });
}
```

shows something important:

the backend does not blindly trust the external service.

Even after calling a typed client, the code still checks:

- did an error come back?
- is the successful data actually the binary shape we expected?

That is excellent service-boundary hygiene.

##### Stage 8. Convert bytes and prepare persistence state

```ts
const buffer = Buffer.from(data);
let generationId: string | null = null;
let r2ObjectKey: string | null = null;
```

This starts persistence preparation.

The two mutable variables are there because later rollback and final return logic need to know:

- whether the DB row was created
- what storage key was assigned

This is a simple pattern for multi-step transactions that cannot be fully wrapped in one true cross-service transaction.

##### Stage 9. Create generation row

```ts
const generation = await prisma.generation.create({
  data: {
    orgId: ctx.orgId,
    text: input.text,
    voiceName: voice.name,
    voiceId: voice.id,
    temperature: input.temperature,
    topP: input.topP,
    topK: input.topK,
    repetitionPenalty: input.repetitionPenalty,
  },
  select: {
    id: true,
  },
});
```

This step deserves careful attention.

Why store `voiceName`?

Because historical records should preserve the voice label used at generation time.

Even if later:

- the voice is renamed
- the voice is deleted

the generation still has meaningful human-readable context.

This is historical snapshot design.

That is very common and very useful in backend systems.

##### Stage 10. Construct storage key from the new row ID

```ts
r2ObjectKey = `generations/orgs/${ctx.orgId}/${generation.id}`;
```

This path is meaningful.

It encodes:

- resource type: `generations`
- ownership scope: `orgs`
- owner identity: `${ctx.orgId}`
- record identity: `${generation.id}`

That means the storage path itself tells a story.

If you ever inspect bucket contents later, the organization is obvious.

This is not required for storage to work.

It is an organizational design choice.

It is a good one.

##### Stage 11. Upload final audio

```ts
await uploadAudio({ buffer, key: r2ObjectKey });
```

This is where the generated bytes become a durable object.

Before this line:

- the result exists only in memory

After this line:

- it exists in persistent object storage

That is the difference between a temporary computation result and a user-facing saved artifact.

##### Stage 12. Update the DB row with storage metadata

```ts
await prisma.generation.update({
  where: {
    id: generation.id,
  },
  data: {
    r2ObjectKey,
  },
});
```

This finalizes the link between:

- database record
- stored audio object

The two-step create + update pattern is normal whenever:

- you need the DB-generated ID first
- then need to compute a related external key

##### Stage 13. Failure rollback block

The surrounding `try/catch` means if anything goes wrong after row creation:

- the code tries to delete the generation row

That prevents half-complete rows from polluting the user’s history.

Beginner lesson:

In backend systems, failure handling is as important as success handling.

The code path for "what if something breaks in the middle?" is often what separates toy code from production-minded code.

##### Stage 14. Billing usage ingestion

The code then separately tries to ingest a Polar event.

The event includes:

- event name from env
- external customer ID = current org
- metadata with character count
- timestamp

Why include character count?

Because billing systems often need usage dimensions.

For TTS, characters are a natural usage measure.

The event is wrapped in its own `try/catch` because generation success should not be reversed by billing telemetry failure.

That is a deliberate business decision.

##### Stage 15. Final return

```ts
return {
  id: generationId,
};
```

Notice what is not returned:

- the full record
- the raw audio bytes
- the storage key
- the voice data

Only the new generation ID is returned.

Why?

Because the frontend only needs enough information to navigate to the canonical detail page.

This keeps the mutation response small and focused.

That is good API design.

### T.2 How To Read `src/app/api/voices/create/route.ts`

This file is one of the best teaching examples in the codebase.

It has many real backend concerns packed into one route.

#### Imports teach responsibility

Imports include:

- Clerk auth
- Sentry
- `music-metadata`
- Zod
- Polar
- env
- Prisma
- R2 upload
- voice categories

From that import list alone you can say:

- this route is protected
- this route processes files
- this route validates structured input
- this route touches billing
- this route writes to DB and storage

That is already the route’s identity.

#### `createVoiceSchema`

This schema validates the non-file part of the request.

It expects:

- a non-empty name
- a category from the allowed category list
- a non-empty language string
- optional-ish description

The important detail is the category validation:

```ts
z.enum(VOICE_CATEGORIES as [VoiceCategory, ...VoiceCategory[]])
```

This means the backend is not trusting arbitrary category strings from the browser.

Only canonical category values are allowed.

That keeps DB contents clean.

#### Why `MAX_UPLOAD_SIZE_BYTES` and `MIN_AUDIO_DURATION_SECONDS` exist at file scope

These are route policy constants.

They exist outside the function because they are business rules, not request-specific calculations.

Putting them at file scope makes them:

- easy to read
- easy to change
- easy to document

#### Function signature

```ts
export async function POST(request: Request) { ... }
```

This means the route handles POST requests only.

That makes sense because the operation creates a resource.

#### Early auth check

```ts
const { userId, orgId } = await auth();

if (!userId || !orgId) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

This is an early exit.

Early exits are good in backend code.

They keep invalid requests from reaching deeper logic.

This route cannot work meaningfully without both identities.

So it exits immediately.

#### Subscription check before heavy work

The route checks Polar before:

- parsing full metadata deeply
- writing to DB
- uploading storage

That reduces wasted system effort.

When reading backend code, always ask:

- "Is expensive work happening before or after authorization/business gating?"

Here it happens after.

That is good.

#### URL param parsing

```ts
const url = new URL(request.url);
```

Then the route reads query params like:

- `name`
- `category`
- `language`
- `description`

This is a design choice.

The endpoint uses:

- raw binary body for file bytes
- query string for metadata

That is a simple low-friction upload pattern.

It avoids multipart parsing complexity in this implementation.

#### `safeParse`

Using `safeParse` instead of `parse` means:

- validation errors become a returned result instead of throwing

That is useful when you want to send a structured 400 response with issue details.

This is good API ergonomics.

#### Binary body read

```ts
const fileBuffer = await request.arrayBuffer();
```

This reads the entire request body into memory.

For your size limit, that is acceptable.

Important backend lesson:

all upload designs are tradeoffs.

This one optimizes for simplicity.

If the app later supports much larger files, this would be an area to revisit.

#### Empty-body and size checks

These checks teach a good rule:

authenticating the user is not enough.

You must also authenticate the shape of the request.

The route checks:

- is there any file at all?
- is it too large?

The correct status codes matter too:

- `400` for missing file
- `413` for too-large file

That means the backend is expressing the type of client error, not just saying "bad".

#### `Content-Type` check

The route reads the request header instead of assuming the browser always sent something good.

Then it normalizes by splitting `;`.

That is because headers can look like:

- `audio/wav`
- `audio/wav; charset=binary`

Normalization avoids downstream parsing issues.

That is a small but useful detail.

#### `parseBuffer` audio validation

This is one of the strongest lines in the route:

```ts
const metadata = await parseBuffer(
  new Uint8Array(fileBuffer),
  { mimeType: normalizedContentType },
  { duration: true },
);
```

Why is this strong?

Because the backend inspects the actual file bytes.

This means someone cannot simply rename a bad file to `.wav` and bypass quality checks.

Backend lesson:

whenever possible, validate content, not just labels.

#### Minimum duration rule

This line:

```ts
if (duration < MIN_AUDIO_DURATION_SECONDS) { ... }
```

is not a technical transport rule.

It is a product-quality rule.

The backend is protecting model usefulness.

That is a great example of business logic living server-side.

If you let the frontend enforce this alone, a custom client could bypass it.

Server-side rules are the true rules.

#### DB row creation

The route creates the voice row before upload finalization.

This is the same pattern as generation creation.

The reason is the same:

- the generated voice ID is useful for composing the permanent storage key

This gives you a predictable namespace:

```ts
voices/orgs/${orgId}/${voice.id}
```

That path is useful for later debugging, cleanup, and bucket inspection.

#### R2 upload call

```ts
await uploadAudio({
  buffer: Buffer.from(fileBuffer),
  key: r2ObjectKey,
  contentType: normalizedContentType,
});
```

Three important things happen here:

1. body bytes become a Node `Buffer`
2. the storage key links the file to org and voice ID
3. the original content type is preserved

Preserving content type matters for correct serving behavior later.

#### DB update with `r2ObjectKey`

After upload, the route updates the record with the storage key.

That means the voice becomes usable by other parts of the system.

Before this update:

- the record exists
- but it is not yet fully linked to storage

After this update:

- voice lookup code can route into generation and preview flows

#### Rollback logic

If anything in the create/upload/update sequence fails after row creation, the route tries to delete the newly created record.

That matters because otherwise users might see broken custom voices in the UI.

Consistency is not only a database theory concept.

It directly affects what users experience.

#### Billing event

The route sends a usage event after success.

Important lesson:

events are often side effects attached to the primary action.

The primary action here is:

- create a usable custom voice

The event is:

- tell billing that a billable thing happened

These are related, but not identical concerns.

The code keeps them separate.

### T.3 How To Read `src/proxy.ts`

This file is short, but beginners often underestimate short files.

Some of the most powerful code is short because it makes high-level decisions.

#### Imports

The file imports:

- `clerkMiddleware`
- `createRouteMatcher`
- `NextResponse`

That alone says:

- this file decides request access
- this file may redirect

#### Public route matcher

```ts
const isPublicRoute = createRouteMatcher([
  "/landing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk-webhook",
]);
```

This is defining routes that should not require normal protected-app access.

The most important beginner lesson here:

public does not mean unimportant.

It only means auth should not block it.

#### Org selection matcher

This creates a special-case route group.

Why special-case it?

Because:

- a signed-in user without an active org must still be able to reach org selection

If you forgot that special case, your middleware could trap users in a bad redirect loop.

That is a classic backend routing bug pattern.

This matcher prevents it.

#### Middleware function

The middleware body reads like a decision tree.

That is how it should read.

Good middleware usually answers:

- who are you?
- what route is this?
- what state are you missing?
- where should you go instead?

#### Signed-out behavior on `/`

This block:

```ts
if (!userId) {
  if (req.nextUrl.pathname === "/" || req.nextUrl.pathname === "") {
    return NextResponse.redirect(new URL("/landing", req.url));
  }
  await auth.protect();
}
```

teaches a subtle product behavior.

The app treats `/` as:

- marketing for anonymous users
- product home for authenticated users

That dual meaning is implemented by middleware, not route duplication.

That is a clever and common SaaS approach.

#### Signed-in but no-org behavior

This block:

```ts
if (userId && !orgId) {
  const orgSelectionUrl = new URL(`/org-selection`, req.url);
  return NextResponse.redirect(orgSelectionUrl);
}
```

is the operational expression of your multi-tenant product model.

It means:

- being signed in is not enough
- being inside a chosen organization is part of "ready to use the app"

That is a very important conceptual rule in this codebase.

### T.4 How To Read `src/trpc/init.ts`

This file is very abstract if you are new to tRPC.

Read it as a policy file, not just a setup file.

#### `initTRPC.create`

This creates the tRPC "toolbox".

Once created, it gives you:

- router creation
- procedure creation
- middleware composition

Think of it like creating your API framework instance.

#### `transformer: superjson`

This changes how data is serialized.

Why is that useful?

Because plain JSON loses some richer JavaScript value types.

Your app mostly deals in simple data, but setting this up now creates a safer base.

#### Sentry middleware wrapper

This centralizes request instrumentation.

Instead of manually doing logging around every procedure, the middleware becomes shared infrastructure.

That is one of the main benefits of middleware systems.

#### `authProcedure`

The important thing to notice:

it does not just throw on missing user.

It also passes a narrower context onward:

```ts
return next({
  ctx: { userId },
});
```

This means downstream code can now rely on `ctx.userId`.

That is type-and-runtime narrowing combined.

#### `orgProcedure`

This does the same but with:

- `userId`
- `orgId`

This file is the reason many router files can stay relatively clean.

The auth work happens once here.

### T.5 How To Read `src/lib/r2.ts`

This file is a nice example of infrastructure abstraction.

#### Why an abstraction layer matters

If every route created its own `S3Client` and wrote raw commands directly, the codebase would be:

- repetitive
- harder to update
- more error-prone

By centralizing:

- client creation
- upload behavior
- delete behavior
- signed URL behavior

you made storage usage consistent.

#### Client configuration

The `S3Client` is configured with:

- region
- access key
- secret

These come from validated env values.

That means this file assumes config is already trustworthy because `env.ts` enforced it.

That is layered responsibility:

- env file validates
- service file consumes

#### Function APIs

Notice the functions are narrow:

- upload one audio object
- delete one object
- sign one object URL

That is good because simple function interfaces are easier to reuse safely.

### T.6 How To Read `chatterbox_tts.py`

Python backend code can feel intimidating if you live mainly in TypeScript.

But the file is readable if you split it into zones.

#### Zone 1. Infrastructure declaration

At the top, the file declares:

- bucket info
- mount path
- Modal image
- Modal app

This zone answers:

- what runtime should exist?
- what dependencies should be installed?
- what storage should be visible?

This is cloud deployment setup.

#### Zone 2. Imported runtime modules inside `with image.imports()`

This pattern ensures those imports belong to the Modal image environment.

The important modules here are:

- `torchaudio`
- `ChatterboxTurboTTS`
- FastAPI classes
- Pydantic model support

This zone answers:

- what libraries the running model service needs

#### Zone 3. API key security

The `verify_api_key` function reads:

- request header key
- expected env key

If they do not match, it raises HTTP 403.

This is simple and effective service-to-service protection.

The Next.js app becomes a trusted caller because it knows the shared key.

#### Zone 4. Request model

`TTSRequest` is the Python-side contract.

Its job is the same as Zod on the TypeScript side:

- reject malformed requests
- define defaults
- constrain parameter ranges

This means the generation service protects itself even if the caller has a bug.

That is exactly what backend services should do.

#### Zone 5. Worker class declaration

The `@app.cls(...)` section declares runtime behavior:

- GPU type
- concurrency
- secrets
- mounted storage

This is not business logic.

It is deployment behavior.

A beginner should learn to distinguish:

- "what code does"

from:

- "what runtime shape the code runs in"

This file contains both.

#### Zone 6. `load_model`

This runs on worker startup, not on every HTTP request.

That distinction matters a lot.

Model loading is expensive.

If it happened for every request, latency would be much worse.

This is warm-worker design.

#### Zone 7. `serve`

This builds the HTTP app.

The route:

```py
@web_app.post("/generate", responses={200: {"content": {"audio/wav": {}}}})
def generate_speech(request: TTSRequest):
```

says:

- accept POST requests
- validate them using `TTSRequest`
- document the success content type as WAV

That is a nice explicit API declaration.

#### Voice path resolution

```py
voice_path = Path(R2_MOUNT_PATH) / request.voice_key
```

This line is important because it translates an application-level object key into a filesystem path inside the mounted storage volume.

This is the bridge from "storage object identity" to "file path a model can read".

That bridge is one of the key architectural benefits of the mounted-bucket approach.

#### `self.generate.local(...)`

This line means the HTTP handler delegates the actual waveform generation to another method on the worker class.

That keeps the route thin.

Thin routes are good.

They handle:

- request/response concerns

and defer:

- actual computation

to dedicated logic.

#### Zone 8. `generate`

This method is the actual computation entrypoint.

It calls the model:

```py
wav = self.model.generate(...)
```

Then it writes that waveform to a buffer via `torchaudio.save`.

Then it returns raw bytes.

This is the functional heart of the Python service.

Text and a reference voice become generated audio bytes.

#### Zone 9. `local_entrypoint`

This is a local testing convenience.

It proves that the service can be exercised outside the main web app path.

This is useful because it allows model debugging separately from:

- Clerk
- tRPC
- Prisma
- R2 proxy routes

That separation is operationally valuable.

---

## Appendix U. Annotated Backend Pseudocode

This appendix rewrites the core backend files into plain-language pseudocode.

The goal is not exact syntax.

The goal is understanding.

### U.1 Generation creation pseudocode

```text
procedure createGeneration(input, currentOrg):
  validate input fields and numeric ranges

  billingState = ask Polar about currentOrg
  if billingState is missing or inactive:
    deny the request

  voice = load voice by input.voiceId, but only if:
    voice is system
    OR voice is custom and belongs to currentOrg

  if voice does not exist:
    return not found

  if voice has no stored sample file:
    return precondition failed

  generatedAudio = call Python TTS service with:
    text
    voice sample key
    tuning parameters

  if generation service failed:
    return internal error

  dbRow = create generation record in database
  objectKey = build R2 key from org + generation id

  try:
    upload generatedAudio to R2 using objectKey
    update dbRow with objectKey
  catch:
    delete dbRow if it was created
    return internal error

  try:
    record usage event in Polar
  catch:
    log the billing error but do not fail user request

  return generation id
```

### U.2 Voice creation pseudocode

```text
route POST /api/voices/create:
  get current user and current org from Clerk
  if either is missing:
    return 401

  ask Polar whether current org has active subscription
  if not active:
    return 403

  parse query string fields:
    name, category, language, description
  validate them with Zod
  if invalid:
    return 400 with issues

  read raw request body as file bytes
  if empty:
    return 400
  if larger than 20 MB:
    return 413

  read content-type header
  if missing:
    return 400

  inspect real audio bytes with music-metadata
  if invalid audio:
    return 422
  if duration is under 10 seconds:
    return 422

  create custom voice row in database
  key = build R2 path from org + voice id

  try:
    upload file to R2
    update database row with key
  catch:
    delete created row if necessary
    return 500

  try:
    record voice creation usage event in Polar
  catch:
    log and continue

  return success
```

### U.3 Audio proxy pseudocode

```text
route GET /api/audio/:generationId:
  require signed-in user and org

  generation = load generation by id and org
  if not found:
    return 404

  if generation has no object key:
    return 409

  signedUrl = generate short-lived private R2 URL
  upstream = fetch signedUrl
  if upstream fetch fails:
    return 502

  return upstream body as audio response
```

### U.4 Voice sample proxy pseudocode

```text
route GET /api/voices/:voiceId:
  require signed-in user and org

  voice = load voice by id
  if not found:
    return 404

  if voice is custom and belongs to another org:
    return 404

  if no object key:
    return 409

  signedUrl = generate short-lived private R2 URL
  upstream = fetch signedUrl
  if upstream fails:
    return 502

  return audio stream with cache rules depending on system/custom
```

---

## Appendix V. Backend Design Lessons A Beginner Should Take From This Repo

This section is not about this repo only.

It is about what this repo teaches.

### Lesson 1. Backends are mostly trust systems

A beginner often thinks backend code is mainly about databases.

It is not.

It is mainly about deciding:

- who is allowed?
- what is valid?
- what should happen next?
- what should be hidden?

That is visible everywhere in this repo.

### Lesson 2. Validation happens many times

This app validates:

- env config
- form input
- tRPC procedure input
- upload route metadata
- actual audio bytes
- external service request shape

That repetition is not waste.

That is safety.

### Lesson 3. The database is not the whole system

Important data also lives in:

- R2 object storage
- Polar billing system
- Clerk identity system
- Python inference service state

Modern backends are often orchestration layers across systems, not one database and one API server.

### Lesson 4. Hide infrastructure details from the frontend when possible

The frontend does not get:

- raw DB connection info
- raw billing tokens
- raw storage keys in most user-facing responses

It gets app-shaped abstractions.

That is proper layering.

### Lesson 5. Good backend code plans for partial failure

This repo repeatedly asks:

- what if upload fails after DB create?
- what if billing event fails after success?
- what if external generation fails?

That is backend maturity.

### Lesson 6. Business rules belong on the server

Examples:

- subscription required
- min audio duration
- custom voice ownership
- org-scoped history access

If those rules only lived in the UI, they would not really be rules.

They would only be suggestions.

### Lesson 7. Thin clients, strong server rules

The browser mostly asks for actions.

The server decides:

- whether they are valid
- whether they are allowed
- what data shape comes back

That is a healthy backend-heavy trust model for a SaaS product.

---

## Appendix W. Expanded Explanations Of Smaller Backend-Important Files

These files are not as large as the major routers, but they still matter.

### W.1 `src/trpc/client.tsx`

This file is frontend-visible, but it exists to support backend communication correctly.

#### Why `getQueryClient()` is split for server and browser

On the server:

- always create a fresh query client

In the browser:

- reuse a singleton-like instance

This is important because browser React trees can suspend during initial render.

If you recreated the QueryClient carelessly, you could lose cached state or create unstable behavior.

This file avoids that.

#### Why `httpBatchLink`

This link batches tRPC requests over HTTP.

That can reduce network chatter when several queries happen together.

It is a practical performance optimization.

#### Why `getUrl()` checks `process.env.APP_URL`

Server-side code cannot assume `window.location`.

So this file needs an absolute base when running on the server.

That is why `APP_URL` matters operationally.

### W.2 `src/trpc/server.tsx`

This file is the reason route files can do server prefetch elegantly.

#### Why `server-only`

This import protects the file from being accidentally used on the client.

That is useful because server utilities often rely on assumptions that should never leak into browser bundles.

#### Why `dehydrate(queryClient)`

TanStack Query stores prefetched results in a cache object.

Dehydration serializes that cache into something that can cross the server-client boundary.

Then hydration reconstructs it in the browser.

That is the core mechanism behind fast first render with data already present.

### W.3 `src/lib/database-url.ts`

Even though it is small, this file matters because database URLs can vary by environment.

Sometimes cloud providers hand out URLs with shapes or query params that need normalization.

A dedicated helper prevents DB setup hacks from leaking into many files.

That is a maintainability win.

### W.4 `src/instrumentation.ts`

This file selects the right Sentry config based on runtime.

That matters because:

- server runtime and edge runtime are not identical

A beginner should learn that modern Next.js can run code in multiple runtimes, and monitoring configuration may need to respect that.

### W.5 `sentry.server.config.ts` and `sentry.edge.config.ts`

These files may look like vendor boilerplate, but they are actually operational guarantees.

They mean:

- when the backend fails, someone can know
- when middleware/edge logic fails, someone can know

Observability is not optional in serious backend systems.

It is how you see production reality.

---

## Appendix X. Questions To Ask Yourself When Reading Any Future Backend File

Use this checklist on any file you add later.

### Identity

- Who is calling this code?
- Is the caller trusted?
- How does the code know?

### Validation

- What input shape is allowed?
- What invalid input is rejected early?

### Authorization

- What records should this caller be allowed to see?
- Is ownership checked in code or only assumed?

### Side effects

- Does this write to DB?
- Does this write to storage?
- Does this call an external service?
- Does it send analytics or billing events?

### Failure behavior

- What happens if the DB step fails?
- What happens if the storage step fails?
- What happens if the external service fails?

### Response shape

- What does the caller actually need back?
- Is the response leaking infrastructure details unnecessarily?

### Observability

- If this fails in production, where will that failure be visible?

If you keep using those questions, backend files stop feeling magical.

They become structured decision engines.

---

## Appendix Y. Suggested Line-By-Line Reading Order For A Beginner

If you want to study the backend code manually, read in this exact order:

1. `src/lib/env.ts`
2. `src/lib/db.ts`
3. `src/lib/r2.ts`
4. `src/lib/chatterbox-client.ts`
5. `src/proxy.ts`
6. `src/trpc/init.ts`
7. `src/trpc/routers/billing.ts`
8. `src/trpc/routers/voices.ts`
9. `src/app/api/voices/create/route.ts`
10. `src/app/api/voices/[voiceId]/route.ts`
11. `src/app/api/audio/[generationId]/route.ts`
12. `src/trpc/routers/generations.ts`
13. `src/trpc/server.tsx`
14. `scripts/seed-system-voices.ts`
15. `chatterbox_tts.py`

Why this order works:

- start with config
- then DB/storage clients
- then request gating
- then API base setup
- then simple routers
- then file upload route
- then media proxy routes
- then the biggest workflow
- then server hydration tooling
- then operational scripts
- then the separate Python backend

This order minimizes cognitive overload.

---

## Appendix Z. Final Backend Compression Summary

If you had to explain the backend in only a few sentences, the most accurate version would be:

The Next.js backend is an orchestration layer.

It does not synthesize speech itself.

It authenticates users with Clerk, enforces org ownership, checks subscription state with Polar, stores metadata in PostgreSQL via Prisma, stores audio in R2, calls a Python Modal service to perform GPU text-to-speech generation, and exposes safe proxy routes so the frontend can consume private audio without direct infrastructure access.

That is the backend heart of Resonance.

---

## Appendix AA. Deep Frontend Architecture Explanations

Up to this point, the book spent a lot of time on backend logic.

That makes sense because the backend is where:

- trust
- permissions
- billing
- storage
- generation orchestration

are enforced.

But the frontend is not just decoration.

The frontend is where the user experiences all of that complexity in a usable form.

This appendix explains how the frontend is organized and why it is shaped this way.

### AA.1 The frontend is layered, not flat

A beginner often imagines a React app as:

- pages
- components
- CSS

This repo is more structured than that.

The frontend has several layers:

1. route layer
2. feature layer
3. shared component layer
4. UI primitive layer
5. shared hooks/utilities layer

Each layer answers a different question.

#### Route layer

Question:

- what URL is the user visiting?

Files:

- `src/app/.../page.tsx`
- `src/app/.../layout.tsx`

#### Feature layer

Question:

- what product workflow is this screen part of?

Files:

- `src/features/dashboard/*`
- `src/features/voices/*`
- `src/features/text-to-speech/*`
- `src/features/billing/*`

#### Shared component layer

Question:

- what reusable app-specific blocks do multiple screens need?

Files:

- `src/components/page-header.tsx`
- `src/components/landing/*`
- `src/components/voice-avatar/*`

#### UI primitive layer

Question:

- what are the smallest reusable styled interaction building blocks?

Files:

- `src/components/ui/*`

#### Shared hooks/utilities layer

Question:

- what non-visual reusable logic should not belong to one feature only?

Files:

- `src/hooks/*`
- `src/lib/utils.ts`

That layered structure is what keeps a project like this from turning into a giant `components` dump.

### AA.2 Why pages stay small

Look at route files like:

- `src/app/(dashboard)/voices/page.tsx`
- `src/app/(dashboard)/text-to-speech/page.tsx`

They are thin.

This is a good pattern.

Why?

Because route files should mostly answer:

- what data should be prefetched?
- what feature view should be rendered?
- what metadata belongs to this route?

They should not hold the whole UI.

If route files become huge, they start mixing:

- routing concerns
- data concerns
- UI concerns
- business workflow concerns

This repo avoids that by moving most product-specific work into feature views.

### AA.3 Why features exist

The `features` folder is the most important frontend organizational decision in this repo.

Without it, you would probably have:

- many unrelated components in one shared folder
- blurry ownership
- more circular imports
- weaker mental grouping

With features, a beginner can think:

- "I want to understand voice cloning"
- go to `src/features/voices`

or:

- "I want to understand generation"
- go to `src/features/text-to-speech`

That is a much better learning and maintenance structure.

### AA.4 Why the UI kit is local

Some people build apps by directly importing third-party UI components everywhere.

This repo does not do that.

Instead, it has a local UI layer in `src/components/ui`.

That gives you:

- consistent styling
- centralized API shapes
- control over design drift
- ability to customize internals later

This is especially useful in a product with many forms, overlays, and dashboard elements.

### AA.5 Why providers are in `src/app/layout.tsx`

The root layout wraps the app with:

- `ClerkProvider`
- `TRPCReactProvider`
- `NuqsAdapter`
- `Toaster`

That means those systems are globally available.

This is a classic React design decision:

- put cross-cutting providers high in the tree

Why?

Because the app wants:

- auth anywhere
- query caching anywhere
- query-string helpers anywhere
- toasts anywhere

If these providers were mounted lower or repeatedly, the app would become harder to reason about.

### AA.6 Why the dashboard layout matters

The private app layout is not just visual chrome.

It is the product shell.

The sidebar layout does three things at once:

- gives navigation
- anchors account/org controls
- creates a consistent private app frame

This is important because once an app grows beyond one page, shell consistency becomes part of usability.

The dashboard shell tells the user:

- "you are inside the workspace now"

That is distinct from the public landing page.

---

## Appendix AB. Deep Explanations Of Important Frontend Feature Files

This section focuses on the most important frontend files in the product experience.

### AB.1 `src/features/text-to-speech/components/text-to-speech-form.tsx`

This file is not just a form.

It is the frontend controller for the generation workflow.

#### Why this file matters

If you removed this file and spread its logic across UI components, you would get:

- duplicated mutation code
- duplicated validation logic
- harder-to-change defaults
- more tangled components

This file centralizes:

- default values
- schema rules
- mutation submission
- redirect behavior
- billing-error handling

That makes it the frontend coordinator of generation.

#### `ttsFormSchema`

This schema mirrors backend expectations.

That is important.

Frontend validation and backend validation should not be treated as substitutes.

They are complementary.

The frontend schema helps:

- give immediate feedback
- reduce pointless network calls

The backend schema/rules still remain the source of truth.

#### `defaultTTSValues`

This object is more important than it looks.

Defaults shape user behavior.

If default values are sensible, users get a stable first-run experience.

The defaults here encode product opinion:

- `temperature: 0.8`
- `topP: 0.95`
- `topK: 1000`
- `repetitionPenalty: 1.2`

This says:

- "the app believes these are reasonable starting generation settings"

Those defaults are part of product design, not just code convenience.

#### `formOptions`

This creates a reusable TanStack form config object.

That matters because feature code can compose around a stable base instead of re-declaring the same options repeatedly.

#### Mutation setup

```ts
const createMutation = useMutation(
  trpc.generations.create.mutationOptions({}),
);
```

This is where frontend and backend meet.

The frontend is not building fetch calls manually.

It is using a typed mutation contract from tRPC.

That means:

- path names are centralized
- types are inferred
- React Query manages state around the mutation

That is one of the cleanest patterns in the repo.

#### `useCheckout`

This hook is only invoked because generation may be blocked by missing subscription state.

Notice the user experience design:

- if generation works, redirect to result
- if generation fails due to subscription, offer checkout action in the toast

That is a good product pattern:

- failure is converted into a next step

#### `onSubmit`

The `onSubmit` block is the real heart.

It:

- trims text
- sends the mutation
- shows success toast
- invalidates billing status
- redirects to the generation detail page

The most important frontend idea here:

after mutation success, the UI should update the views that depend on changed server state.

That is why `queryClient.invalidateQueries(...)` matters.

Without invalidation:

- sidebar usage could stay stale

The redirect and invalidation together create a coherent user flow.

#### Error handling

This file is also a good lesson in targeted error handling.

It does not just show one generic error toast.

It specifically checks for the subscription-required message.

Then it offers the user a billing action.

That means the frontend is translating backend business errors into product actions.

That is exactly what a good product UI should do.

### AB.2 `src/features/text-to-speech/views/text-to-speech-view.tsx`

This file is the route-level feature composition for creating a new generation.

It is important because it decides how many nested components receive their data context.

#### Why voices are loaded here

The voice list affects:

- selector UI
- fallback default voice choice
- possibly preview sections

That makes this view a natural place to resolve voice data once and share it downward.

#### `const allVoices = [...customVoices, ...systemVoices];`

This merge is small but conceptually important.

The backend returns voices in separated groups.

The frontend keeps that separation where helpful, but for the generation workflow it also needs a unified pool for selection logic.

That is a normal frontend transformation step:

- preserve structure
- also derive a flattened version for workflow convenience

#### Fallback voice logic

```ts
const fallbackVoiceId = allVoices[0]?.id ?? "";
```

and:

```ts
const resolvedVoiceId =
  initialValues?.voiceId &&
  allVoices.some((v) => v.id === initialValues.voiceId)
    ? initialValues.voiceId
    : fallbackVoiceId;
```

This protects the UI from stale query params or deleted voices.

That is strong frontend defensive design.

Instead of assuming the preselected voice still exists, the UI verifies it.

That prevents broken initial state.

#### `TTSVoicesProvider`

This context provider is a prop-drilling solution.

Without it, many nested TTS components would need long prop chains.

The context says:

- all these nested components belong to the same voice-aware workflow

That is a reasonable use of React context.

### AB.3 `src/features/text-to-speech/views/text-to-speech-detail-view.tsx`

This file is one of the best examples of product-aware frontend architecture in the repo.

Why?

Because it does more than "show past result".

It turns history into a reusable working state.

#### `useSuspenseQueries`

This loads:

- generation detail
- voice list

together.

That is good because the page really depends on both datasets.

The generation tells you:

- what happened

The voice list tells you:

- what still exists and can be selected now

#### Historical snapshot logic

This comment in the code is important:

- use denormalized voiceName snapshot so preview still shows the name from generation time

That is not just technical implementation detail.

That is a product decision about historical truth.

The page should show:

- what the user generated with at the time

not:

- only what the current live voice record says now

That is a subtle but very user-friendly design choice.

#### Why the form is rehydrated from generation state

The detail page builds `defaultValues` from stored generation parameters.

That means a past generation is also a preset for generating again.

This is a smart UX pattern.

History becomes a workflow accelerator, not only a read-only log.

### AB.4 `src/features/voices/components/voice-create-form.tsx`

This is one of the most complicated frontend files in the repo.

That is normal.

It handles many interaction concerns.

#### Why the file is long

It combines:

- form state
- upload state
- recording state
- playback state
- search-select state
- mutation state
- error presentation

When a component combines many product interactions, length alone is not automatically bad.

The real question is whether the logic still has meaningful internal grouping.

This file mostly does.

#### `LANGUAGE_OPTIONS`

This turns `locale-codes` data into frontend-ready options.

That is an example of adaptation code:

- raw library data
- transformed into UI-friendly data

This kind of transformation code often belongs near the feature that uses it.

#### `FileDropzone`

This subcomponent is a good example of local component extraction.

Instead of keeping upload-specific logic inline inside the full form, the file breaks out a specialized block.

That helps readability.

The component has two modes:

- selected-file mode
- empty-dropzone mode

That is a common UI state split pattern.

#### `useAudioPlayback(file)`

Notice how the same playback hook works with a `File`.

That is a strong reusable-hook design because it lets local preview behavior match remote preview behavior conceptually.

#### `useDropzone`

This solves drag-and-drop mechanics so your feature code can focus on product behavior.

That is a good example of using a focused library for interaction-heavy UX.

#### `LanguageCombobox`

This subcomponent is a great example of composing low-level UI primitives into a product-specific input.

It uses:

- popover
- button
- command list

to build one richer field.

This is how a design system becomes a real UI, not just a pile of primitives.

#### Mutation function

The mutation function sends a raw `POST` to `/api/voices/create`.

This is useful to study because it shows a frontend route-call pattern outside tRPC.

The frontend:

- builds query params for metadata
- sets `Content-Type` to `file.type`
- sends file bytes as body

This mirrors the backend route design exactly.

That is good contract symmetry.

#### Success behavior

On success, the form:

- shows toast
- invalidates voice list
- invalidates billing status
- resets itself

This is a well-behaved mutation UI.

The reset is especially important because voice creation is a repeatable workflow.

### AB.5 `src/features/voices/hooks/use-audio-recorder.ts`

This is one of the technically most interesting frontend hooks.

#### Why it is not trivial

It deals with:

- browser permissions
- live media streams
- external recording library
- waveform rendering
- cleanup on unmount and reset

That is much more complex than normal form state.

#### `cleanup`

The cleanup function is one of the most important parts of the hook.

It clears:

- timer interval
- recorder instance
- media stream tracks
- waveform rendering

Why is this important?

Because browser media APIs leak bad behavior quickly if cleanup is sloppy.

Examples:

- microphone staying active
- duplicated streams
- memory pressure
- broken next recording attempts

This hook does the right thing by centralizing teardown.

#### Lazy importing `recordrtc`

The hook imports the library only when recording starts.

That is a performance-conscious choice.

It means recording-only code does not have to be loaded eagerly before the user needs it.

#### Live waveform rendering

The hook creates a `WaveSurfer` instance and attaches a recording plugin view to the live microphone stream.

This is a UX enhancement.

It gives users confidence that:

- the app is recording
- audio is actually flowing

That is more reassuring than only showing a timer.

#### Error handling

The hook distinguishes:

- denied microphone permissions
- generic failure

That is a sign of better UX thinking.

Users should get a helpful explanation when browser permissions are the cause.

### AB.6 `src/features/dashboard/components/dashboard-sidebar.tsx`

This file is visually-oriented, but structurally very important.

It is the navigation backbone of the private app.

#### Why this file matters

This component combines:

- custom sidebar primitives
- auth/org UI from Clerk
- billing UI
- route links

It is one of the files where "product shell" becomes visible.

#### Menu items as data

The navigation items are declared as arrays of objects.

That is good because:

- structure is explicit
- rendering becomes a map operation
- future edits are easier

#### `NavSection`

This helper component is a local abstraction that keeps repeated menu structure readable.

That is a good middle ground.

You are not over-abstracting the whole sidebar into many files, but you are removing repeated shape.

#### `OrganizationSwitcher` and `UserButton`

These Clerk components are heavily customized through `appearance`.

That tells you something important:

the app wants hosted/authenticated behavior from Clerk, but still wants strong control over how those controls fit the design system.

That is a common SaaS frontend pattern.

#### `UsageContainer`

Placing usage/billing state inside the sidebar is a product choice.

It means billing awareness is persistent, not hidden in a settings page.

That can help conversion and transparency.

---

## Appendix AC. Data Flow Between Frontend Layers

This appendix explains how values move through the frontend.

Beginners often see React trees as "components rendering components".

That is only part of the story.

There are several different kinds of data flow here.

### AC.1 Route params to feature defaults

Example:

- `/text-to-speech?text=...&voiceId=...`

Flow:

1. App Router page reads `searchParams`
2. route passes them to feature view
3. feature view resolves safe defaults
4. form controller receives those defaults
5. child components render form state

This is a route-to-form data pipeline.

### AC.2 Server prefetch to hydrated client query

Flow:

1. route file calls `prefetch(...)`
2. `src/trpc/server.tsx` stores result in server QueryClient
3. `HydrateClient` serializes cache
4. browser hydrates cache
5. `useSuspenseQuery` reads from hydrated cache

This is a server-to-client data pipeline.

### AC.3 Context provider to nested UI controls

Example:

- `TTSVoicesProvider`

Flow:

1. parent view loads voice data once
2. provider stores it in React context
3. nested selector/preview components consume it

This is a parent-to-many-descendants state sharing pipeline.

### AC.4 Mutation success to cache invalidation to UI refresh

Example:

- creating a voice
- generating speech

Flow:

1. mutation succeeds
2. frontend invalidates relevant query keys
3. dependent UI re-fetches or refreshes from cache
4. screen reflects newest server state

This is a mutation-to-refresh pipeline.

### AC.5 Local file to browser preview

Example:

- uploaded or recorded voice sample

Flow:

1. browser obtains `File`
2. playback hook creates object URL
3. `Audio` instance plays that local preview

This is a browser-local data pipeline with no server involvement yet.

---

## Appendix AD. Styling System Explanations

This repo has more styling structure than a basic Tailwind starter.

### AD.1 Tailwind is the implementation layer, not the only design layer

Beginners sometimes think Tailwind itself is the design system.

It is not.

In this repo, the actual design system comes from:

- CSS variables
- theme token mapping
- custom component APIs
- spacing and motion decisions
- local UI wrappers

Tailwind is the implementation mechanism.

### AD.2 Why `globals.css` is big

Many projects have a tiny global CSS file.

This one is bigger because it does more:

- Tailwind imports
- theme variable mapping
- base theme tokens
- dark mode tokens
- landing page motion keyframes
- visual effect helpers

This is not random CSS accumulation.

It is the shared style infrastructure file.

### AD.3 Why CSS variables matter

Variables like:

- `--background`
- `--foreground`
- `--sidebar-*`
- `--chart-*`
- `--glass-*`

let the design stay coherent across:

- regular app UI
- landing page visuals
- charts
- sidebar system

They also make component styling more composable.

### AD.4 Why some visual logic lives in CSS and not React

Animations like:

- word reveal
- underline reveal
- screenshot reveal
- marquee
- waveform

are better expressed in CSS because:

- CSS is good at declarative animation timing
- React should not need to drive every frame
- styling stays separated from data logic

That is a healthy division of labor.

---

## Appendix AE. Database Design Choices Explained More Deeply

The schema is small, but that does not mean it is simplistic.

### AE.1 Why `Voice` and `Generation` are separate models

At first glance, someone might ask:

- why not store voice fields directly on generation?

Because voices and generations have different lifecycles.

Voice lifecycle:

- created once
- reused many times
- may be previewed
- may be deleted

Generation lifecycle:

- created each time a TTS request succeeds
- belongs to history
- stores prompt-specific settings

This is a classic one-to-many domain relationship:

- one voice
- many generations

### AE.2 Why `Voice.orgId` is nullable

Because the app has two voice scopes:

- system voices
- org voices

System voices do not belong to one org.

So `orgId` must be nullable.

This is a neat way to support global built-in entities without a separate table.

### AE.3 Why enums are used

Enums:

- `VoiceVariant`
- `VoiceCategory`

make the schema more structured.

Without enums, category/variant values could drift into messy arbitrary strings.

Enums improve:

- data consistency
- developer autocomplete
- validation alignment

### AE.4 Why `Generation.voiceId` is nullable

This is tied to:

```prisma
onDelete: SetNull
```

Why is that good?

Because deleting a voice should not destroy the historical record of all generations that used it.

The app preserves history even if the linked voice is later gone.

That is a very thoughtful historical-data choice.

### AE.5 Why `voiceName` exists on generation

This is one of the most important schema-level UX decisions.

If a generation only stored `voiceId`, then after:

- rename
- deletion

history could become confusing.

By storing `voiceName` too, the app preserves historical readability.

This is denormalized data, but it is good denormalized data.

### AE.6 Why there are indexes

Indexes exist on:

- `Voice.variant`
- `Voice.orgId`
- `Generation.orgId`
- `Generation.voiceId`

This tells you which filters the app expects to use often.

And indeed, the app often queries by:

- organization
- variant
- voice relation

So the indexes reflect actual access patterns.

That is what indexes should do.

---

## Appendix AF. How The Landing Page Relates To The Product App

At a glance, the landing page and the dashboard may feel like two unrelated sites.

They are not.

They play different product roles.

### AF.1 Landing page role

The landing page exists to:

- explain value
- build trust
- show polish
- drive sign-up or entry

It is a persuasion surface.

### AF.2 Dashboard role

The dashboard exists to:

- let authenticated users do work
- keep them in a stable workflow shell
- expose product actions efficiently

It is a productivity surface.

### AF.3 Why they look different

They should look different.

Marketing and application surfaces have different goals.

Your code reflects that by separating:

- landing-specific components
- dashboard-specific feature code

That is good product architecture.

### AF.4 Why `/landing` exists as its own route

This makes middleware behavior simple.

Signed-out users are redirected from `/` to `/landing`.

Signed-in users use `/` as dashboard home.

That lets one repo serve both acquisition and product use.

---

## Appendix AG. If A Beginner Wanted To Extend The App, Where Should They Edit?

This section is practical.

### Add a new dashboard section

Likely places:

- `src/features/dashboard/views/dashboard-view.tsx`
- related new files under `src/features/dashboard/components`

### Add a new tRPC read endpoint

Likely places:

- choose the right file in `src/trpc/routers`
- add procedure
- use it from a feature view/component through `useTRPC()`

### Add a new upload rule for custom voices

Likely place:

- `src/app/api/voices/create/route.ts`

### Add a new billing gate

Likely places:

- `src/trpc/routers/generations.ts`
- `src/app/api/voices/create/route.ts`
- `src/trpc/routers/billing.ts`

depending on what action should be gated

### Add a new generated-audio history view feature

Likely places:

- `src/features/text-to-speech/components/settings-panel-history.tsx`
- `src/features/text-to-speech/components/history-drawer.tsx`
- maybe extend `trpc.generations.getAll`

### Add another system voice

Likely places:

- add `.wav` file in `scripts/system-voices/`
- update canonical names/metadata
- run the seed script

### Change generation parameter defaults

Likely places:

- `src/features/text-to-speech/components/text-to-speech-form.tsx`
- maybe `src/features/text-to-speech/data/sliders.ts`

### Change storage key structure

Likely places:

- `src/app/api/voices/create/route.ts`
- `src/trpc/routers/generations.ts`
- maybe seed script if system voice path conventions also change

### Change authentication redirect behavior

Likely place:

- `src/proxy.ts`

---

## Appendix AH. Reading The Repo Like A Course

If you were teaching yourself from this repo over several days, use this study plan.

### Session 1. Learn the product shape

Read:

- `README.md`
- `ARCHITECTURE.md`
- `package.json`
- `prisma/schema.prisma`

Goal:

- know what the app is and what services it depends on

### Session 2. Learn request access and app shell

Read:

- `src/proxy.ts`
- `src/app/layout.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/features/dashboard/components/dashboard-sidebar.tsx`

Goal:

- know how people enter the app and how the shell is structured

### Session 3. Learn the voice creation workflow

Read:

- `src/features/voices/components/voice-create-form.tsx`
- `src/features/voices/hooks/use-audio-recorder.ts`
- `src/app/api/voices/create/route.ts`
- `src/app/api/voices/[voiceId]/route.ts`

Goal:

- understand upload/record/validate/store/preview flow

### Session 4. Learn the generation workflow

Read:

- `src/features/text-to-speech/components/text-to-speech-form.tsx`
- `src/features/text-to-speech/views/text-to-speech-view.tsx`
- `src/trpc/routers/generations.ts`
- `src/app/api/audio/[generationId]/route.ts`
- `chatterbox_tts.py`

Goal:

- understand how text becomes playable audio

### Session 5. Learn billing and infrastructure

Read:

- `src/trpc/routers/billing.ts`
- `src/lib/polar.ts`
- `src/lib/r2.ts`
- `src/lib/db.ts`
- `src/lib/env.ts`

Goal:

- understand the app as a real SaaS system, not just a UI

### Session 6. Learn styling and reusable UI

Read:

- `src/app/globals.css`
- `components.json`
- `src/components/ui/button.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/chart.tsx`

Goal:

- understand how the design system works

---

## Appendix AI. Final Meta-Explanation Of This Codebase

The best high-level description of this repository is:

It is a layered product codebase where the frontend is carefully organized around user workflows, the backend is organized around trust and orchestration, and infrastructure concerns are isolated into shared libraries and a separate Python inference service.

The reason the repo feels "big" is not because it is messy.

It feels big because it solves many real product problems at once:

- acquisition
- auth
- org membership
- private media handling
- AI inference
- result history
- billing
- monitoring

That is what makes it a serious application rather than a demo.

---

## Appendix AJ. Deep Reading Guide For The App Shell

This appendix focuses on the files that make the app feel like one cohesive product instead of many disconnected pages.

These files are easy to underestimate because they do not directly create voices or generate speech.

But they control the user’s overall experience of moving through the product.

### AJ.1 `src/app/layout.tsx`

This is the true top of the React tree.

You should think of it as the global operating environment for the app.

#### Why root layouts matter

In App Router, the root layout is not just a wrapper.

It decides:

- what providers exist globally
- what global CSS applies
- what base fonts are loaded
- what every route inherits

That means mistakes here affect everything.

#### Font loading

The file loads:

- `Inter`
- `Geist_Mono`
- `Bricolage_Grotesque`
- `DM_Sans`

Each one is assigned to a CSS variable.

This is a strong approach because:

- the fonts are loaded once centrally
- the variables can be referenced in Tailwind/theme CSS
- the app can separate display typography from body typography

This is not only aesthetic.

It makes typography a system instead of one-off class strings.

#### Why the `body` class matters

The `body` receives all font variables and `antialiased`.

That means the whole app inherits a consistent typographic base.

If this was configured inconsistently across routes, the product would feel fragmented.

#### Provider stack order

The order is:

1. `ClerkProvider`
2. `TRPCReactProvider`
3. `<html>`
4. `<body>`
5. `NuqsAdapter`
6. page children
7. `Toaster`

That order tells you a lot.

Clerk sits at the top because identity should be available anywhere.

tRPC provider is also near the top because data-fetching hooks appear across many routes.

`NuqsAdapter` wraps children because route/query-state helpers are relevant inside page-level UI.

`Toaster` is mounted once because toast infrastructure should be global.

This is well-structured provider architecture.

### AJ.2 `src/app/(dashboard)/layout.tsx`

This file creates the private-app shell.

Its job is very different from the root layout.

The root layout is global.

The dashboard layout is workspace-specific.

#### Cookie-based sidebar state

The layout reads:

```ts
const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
```

This means the user’s sidebar preference survives navigation and refresh.

That is a UX polish detail.

It is not necessary for correctness.

But it makes the app feel more stable and personal.

#### `SidebarProvider`

This provider creates the shared state that the custom sidebar system needs.

This is a good example of layout-scoped state.

The sidebar state should not be global across the entire public landing page.

It belongs to the dashboard shell only.

#### `SidebarInset`

This is part of the local sidebar UI system.

Its purpose is to give the content area a layout that responds correctly to the sidebar’s presence and collapsed state.

That means the content area and the nav area are coordinated by one design system, not hacked separately.

That is good shell design.

### AJ.3 `src/features/dashboard/components/dashboard-sidebar.tsx`

This file is long because it merges many concerns into one product shell component.

It is worth reading as a shell architecture file, not only as a nav file.

#### Shell concerns it handles

- route navigation
- visual branding
- organization identity switching
- user identity display
- billing/usage visibility
- responsive sidebar behavior through lower-level UI primitives

That is why this file matters so much.

It is where navigation, account state, and monetization awareness all become persistent.

#### `usePathname`

The sidebar uses current pathname to determine active route state.

That means navigation highlighting is derived from routing state, not manually stored UI state.

That is correct.

Routing should be the source of truth for which section is active.

#### `NavSection`

This helper is a good example of local abstraction done well.

It solves a repeated structure:

- optional section label
- list of menu items
- active state
- tooltip

This extraction keeps the main sidebar component from becoming unreadable.

#### Active state logic

```ts
item.url
  ? item.url === "/"
    ? pathname === "/"
    : pathname.startsWith(item.url)
  : false
```

This little block is more important than it looks.

It defines the "what counts as active?" rule for the app shell.

Special-casing `/` matters because otherwise every route could accidentally start with `/`.

This is a small but necessary routing nuance.

#### Menu as data

The menu items are arrays of objects.

That means:

- route structure is expressed declaratively
- rendering stays simple
- future changes are easier

A beginner should notice that good UI code often moves repeated structure into data arrays rather than writing repeated JSX by hand.

#### Organization switcher placement

The org switcher is near the top of the sidebar.

That is a UX decision.

It tells the user:

- workspace identity is part of the app’s top-level context

Because this is a multi-tenant app, that is exactly where it belongs.

#### Billing card placement

The billing card sits in the sidebar footer.

This is subtle product design.

It means billing is:

- always available
- visible but not intrusive
- part of workspace context

That can improve both user awareness and conversion.

#### `UserButton`

The user button at the bottom anchors personal identity separately from org identity.

That distinction matters:

- org switcher = workspace context
- user button = personal account context

This split is clear product thinking.

---

## Appendix AK. Deep Reading Guide For `src/components/ui/sidebar.tsx`

This is one of the biggest UI infrastructure files in the repo.

It deserves special treatment because it is not just "a sidebar component".

It is a sidebar system.

### AK.1 Why this file is large

This file handles all of the following:

- desktop layout behavior
- mobile overlay behavior
- open/collapsed state
- controlled/uncontrolled state patterns
- persistence through cookies
- keyboard shortcuts
- helper subcomponents
- contextual state sharing
- width variants
- tooltip support

That is why the file is long.

It is closer to a mini framework than a one-off component.

### AK.2 The idea of a component system file

Some files define one visible component.

This file defines:

- context
- provider
- main sidebar
- trigger
- rail
- inset
- multiple structural helpers

That is a component family.

It is normal for that kind of file to be substantial.

### AK.3 Context design

The file defines a `SidebarContext`.

This context stores:

- open/closed state
- mobile-open state
- whether the viewport is mobile
- a toggling function
- derived expanded/collapsed state

This is good because the sidebar family needs a shared model.

Without context, every helper component would need prop threading.

That would be clumsy.

### AK.4 Controlled vs uncontrolled behavior

The provider accepts:

- `open`
- `onOpenChange`

but also supports internal state with `defaultOpen`.

This means the component can be used in two ways:

- self-managed
- externally controlled

That is a flexible component API design.

It makes the sidebar system reusable beyond one hardcoded usage pattern.

### AK.5 Cookie persistence

The provider writes:

```ts
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
```

This is how UI preference persists.

Notice that the provider itself writes the cookie.

That means:

- persistence is built into the component system

The layout then reads that cookie on the server and passes `defaultOpen`.

That is a full server/client loop:

1. client toggles state
2. cookie is written
3. next server render reads cookie
4. UI starts in the remembered state

That is a nice example of cross-boundary UX persistence.

### AK.6 Keyboard shortcut support

The system listens for:

- `meta+b`
- or `ctrl+b`

This gives power-user ergonomics.

That is not necessary for function, but it helps the app feel more desktop-like and intentional.

### AK.7 Mobile vs desktop branching

This file handles mobile and desktop differently.

That is important because a collapsible sidebar on desktop is not the same UI pattern as a mobile side sheet.

On mobile:

- it becomes a `Sheet`

On desktop:

- it becomes a persistent layout structure

This is the correct way to think about responsiveness:

- not only resizing
- but changing interaction model

### AK.8 Sidebar gap and container

The desktop implementation uses both:

- a gap element
- a fixed positioned sidebar container

Why both?

Because:

- the fixed sidebar needs visible position
- the content still needs layout space reserved for it

The gap acts as the reserved width in normal flow.

This is a sophisticated but common layout trick.

### AK.9 `SidebarTrigger`

This is a small component, but it shows good design system thinking.

Instead of every page re-implementing:

- a button
- icon
- onClick toggle logic

the system exports one canonical trigger.

That keeps shell behavior consistent.

### AK.10 `SidebarRail`

This is an advanced UI affordance.

It allows edge-hover/click resizing/toggling behavior around the sidebar boundary.

That makes the sidebar feel more interactive and app-like.

### AK.11 `SidebarInset`

This is the coordinated content wrapper.

It ensures content layout responds to sidebar variant and collapse state in a consistent way.

Without an inset companion, the sidebar system would be much harder to integrate cleanly.

### AK.12 Why this file matters for a beginner

Because it teaches that serious UI systems are not just styling.

They often combine:

- layout
- state
- persistence
- keyboard support
- responsive branching
- context architecture

This is frontend engineering, not only frontend decoration.

---

## Appendix AL. Deep Reading Guide For `src/app/globals.css`

This file is one of the most important non-TypeScript files in the repo.

A beginner should not skip it.

### AL.1 Why global CSS still matters in a Tailwind app

Tailwind reduces the amount of handwritten CSS you need.

It does not eliminate the need for shared style infrastructure.

This file contains:

- imports
- theme token wiring
- root variables
- dark-mode variables
- base-layer rules
- custom animation rules
- landing page special styling

That is more than "global CSS".

It is a style platform file.

### AL.2 `@import "tailwindcss";`

This activates Tailwind itself.

Without this import, your utility classes would not compile as expected.

### AL.3 `@import "tw-animate-css";`

This brings in animation utilities used by the UI system.

That expands the app’s motion vocabulary without forcing every animation to be hand-authored from scratch.

### AL.4 `@import "shadcn/tailwind.css";`

This pulls in `shadcn`-related style support.

Because your app uses a local `shadcn`-style component system, this import is part of that ecosystem working correctly.

### AL.5 `@theme inline`

This section maps CSS variables into Tailwind theme tokens.

That means classes like:

- `bg-background`
- `text-foreground`
- `bg-card`

resolve through CSS variables rather than hardcoded values.

This is powerful because:

- one token name can map to different actual values in different themes
- components can stay semantic instead of color-literal

This is one mark of a mature styling system.

### AL.6 `:root` theme values

This block defines the default light theme tokens.

Notice how many concepts get tokens:

- text
- surfaces
- border
- input
- ring
- chart colors
- sidebar colors

That means the repo is not styling everything ad hoc.

It has a semantic token layer.

### AL.7 `.dark`

This block overrides the same semantic tokens for dark mode.

Even if the current app mostly feels light-oriented, the design system is prepared for theme switching.

That is helpful for component compatibility and future flexibility.

### AL.8 `@layer base`

This sets global base rules like:

- all elements get border/outline token behavior
- `body` gets background and foreground
- clickable controls get cursor behavior

This is basic but important polish.

### AL.9 Landing page custom tokens

The later `:root` block adds:

- glass variables
- sky palette
- ink palette
- positive color
- display/body font family vars

This shows that the landing page has its own visual language layered on top of the generic app tokens.

That is why the marketing surface can feel more expressive while the dashboard stays product-oriented.

### AL.10 Animation sections

Sections like:

- hero word reveal
- highlight underline
- screenshot reveal
- marquee
- waveform
- scroll reveal

show you that motion is part of the design system, not a random afterthought.

This is good frontend craft.

### AL.11 Why this file should be studied by beginners

Because many beginners focus only on React components and ignore style infrastructure.

But in a polished product, style architecture matters just as much as component logic.

This file teaches:

- semantic tokens
- theme mapping
- animation layering
- design-system-backed CSS structure

---

## Appendix AM. One Action Through The Whole System

This appendix explains complete stack traversal in a very explicit way.

The goal is to show how one user interaction crosses many files and layers.

### AM.1 Action: user clicks "Generate speech" from the dashboard quick panel

#### Frontend step 1. Dashboard text input

File:

- `src/features/dashboard/components/text-input-panel.tsx`

The user types text into a textarea.

This component keeps local `text` state.

When the button is clicked:

```ts
router.push(`/text-to-speech?text=${encodeURIComponent(trimmed)}`);
```

This means the dashboard does not generate anything directly.

It only sends the user into the dedicated TTS workflow with prefilled route state.

That is a UX handoff.

#### Frontend step 2. Route navigation

The browser moves to:

- `/text-to-speech?text=...`

Next.js loads:

- `src/app/(dashboard)/text-to-speech/page.tsx`

That page reads the query string and passes `text` into the feature view as initial values.

#### Frontend step 3. Server prefetch

Before the page renders fully on the client, the route prefetches:

- voices
- generation history

This means the new page can render with data already waiting.

#### Frontend step 4. Feature view composes form defaults

File:

- `src/features/text-to-speech/views/text-to-speech-view.tsx`

This file:

- loads available voices
- chooses a fallback voice if needed
- creates `defaultValues`
- mounts `TextToSpeechForm`

Now the query string text has become actual form state.

#### Frontend step 5. User clicks generate

File:

- `src/features/text-to-speech/components/text-to-speech-form.tsx`

This file runs submit validation and calls the tRPC mutation.

At this moment, the action crosses from frontend workflow into backend API orchestration.

#### Backend step 6. tRPC endpoint receives request

File:

- `src/app/api/trpc/[trpc]/route.ts`

This is the network entry point for the tRPC call.

The request is handed to the tRPC router system.

#### Backend step 7. org procedure validates identity context

File:

- `src/trpc/init.ts`

`orgProcedure` ensures:

- there is a signed-in user
- there is an active organization

If this fails, the mutation never reaches product logic.

#### Backend step 8. generation router runs business logic

File:

- `src/trpc/routers/generations.ts`

The `create` procedure:

- validates values
- checks subscription
- checks voice access
- checks voice media availability

At this point, the app has determined:

- the user is allowed
- the org is allowed
- the voice is allowed
- the request is structurally valid

Only then does it spend compute and storage effort.

#### Backend step 9. external inference request

File:

- `src/lib/chatterbox-client.ts`

The Next.js backend sends a request to the Python service.

The request includes:

- prompt text
- voice sample key
- generation tuning values

#### Python backend step 10. request validation and generation

File:

- `chatterbox_tts.py`

The service:

- checks API key
- validates request structure with Pydantic
- resolves the voice sample path inside mounted R2 storage
- runs GPU generation
- returns WAV bytes

This is the true compute-heavy step.

#### Backend step 11. store result

Back in:

- `src/trpc/routers/generations.ts`

the Next.js backend:

- creates a generation row
- uploads audio to R2
- updates the DB record with the object key
- emits billing usage event

Now the result is durable.

It is not just a response payload.

It is:

- in the DB
- in object storage
- in billing telemetry

#### Frontend step 12. mutation success behavior

Back in:

- `src/features/text-to-speech/components/text-to-speech-form.tsx`

the client:

- shows success toast
- invalidates billing query
- redirects to `/text-to-speech/[generationId]`

#### Frontend step 13. detail page hydration

The detail route:

- prefetches generation data
- prefetches voices
- rehydrates into the UI

This means the result page is not an empty shell waiting on a later client fetch.

#### Backend step 14. user hits play

The preview uses:

- `/api/audio/[generationId]`

That route:

- verifies ownership
- signs R2 access
- streams audio

#### Final result

The single user action has now crossed:

- dashboard component
- route transition
- feature view
- client form controller
- tRPC transport
- auth/org middleware
- business router
- external Python service
- R2 storage
- Prisma database
- Polar billing
- audio proxy route
- browser playback

That is a full-stack action path.

That is why this app is substantial.

### AM.2 Action: user records a custom voice and saves it

This second stack walk is useful because it shows a different kind of flow.

It is media-heavy rather than generation-heavy.

#### Frontend recording

Files:

- `src/features/voices/components/voice-create-form.tsx`
- `src/features/voices/components/voice-recorder.tsx`
- `src/features/voices/hooks/use-audio-recorder.ts`

The browser:

- requests mic permission
- records audio
- visualizes waveform
- constructs a `File` object from the final blob

This is all client-side.

No server request has happened yet.

#### Frontend submission

The form sends:

- metadata in query params
- raw audio as request body

to:

- `/api/voices/create`

#### Backend validation

File:

- `src/app/api/voices/create/route.ts`

The route:

- checks auth/org
- checks subscription
- validates metadata
- validates audio bytes and duration

#### Persistence

Then it:

- creates DB voice row
- uploads file to R2
- updates row with object key
- meters billing usage

#### Frontend refresh

The client invalidates:

- voice list
- billing status

The new voice now appears in the team voices section.

That means the frontend and backend agree on the new canonical state.

---

## Appendix AN. Common Beginner Mistakes In This Repo

This section is very practical.

It explains mistakes a new developer could easily make here.

### Mistake 1. Editing generated files manually

Bad targets:

- `src/generated/prisma/*`
- `src/types/chatterbox-api.d.ts`

Why it is wrong:

- your changes will be overwritten

Correct approach:

- change the source schema or codegen source
- regenerate

### Mistake 2. Using `process.env` directly everywhere

Why it is wrong:

- loses centralized validation
- creates inconsistent config handling

Correct approach:

- import `env` from `src/lib/env.ts`

### Mistake 3. Putting business rules only in the frontend

Example bad idea:

- only checking min voice duration in the browser

Why wrong:

- custom clients can bypass UI checks

Correct approach:

- enforce real rules in backend routes or tRPC procedures

### Mistake 4. Returning raw storage keys to the UI unnecessarily

Why wrong:

- leaks infrastructure details
- makes future storage changes harder

Correct approach:

- return app-level URLs or safe derived values

### Mistake 5. Forgetting cache invalidation after mutations

Symptoms:

- voice list does not update
- billing panel looks stale
- history looks wrong until refresh

Correct approach:

- invalidate affected queries after successful mutations

### Mistake 6. Mixing route logic and feature logic in one giant page file

Why wrong:

- harder to test mentally
- harder to reuse
- pages become messy quickly

Correct approach:

- keep route files thin
- move workflow UI into `src/features`

### Mistake 7. Ignoring org ownership when adding new backend reads/writes

Why wrong:

- can leak data across tenants

Correct approach:

- use `orgProcedure` where appropriate
- scope DB queries by `orgId`

### Mistake 8. Treating system voices and custom voices as identical in all contexts

Why wrong:

- they have different ownership and caching rules
- they may need different UI grouping

Correct approach:

- preserve the conceptual distinction even if you merge them temporarily for selection convenience

### Mistake 9. Not thinking about partial failure

Example:

- DB create succeeds, R2 upload fails

Why wrong:

- leaves broken records or orphaned storage

Correct approach:

- add rollback or cleanup behavior

### Mistake 10. Assuming the Python service and TypeScript backend are one system boundary

Why wrong:

- they are separate deployable parts
- they must validate and authenticate independently

Correct approach:

- treat service boundaries explicitly

### Mistake 11. Forgetting public vs private route behavior in middleware

Why wrong:

- can create redirect loops
- can accidentally expose private routes

Correct approach:

- reason carefully about `src/proxy.ts`

### Mistake 12. Over-optimizing too early in the wrong place

Example:

- trying to micro-optimize small presentational components
- while ignoring the bigger workflow clarity

Correct approach:

- preserve clean layering first
- optimize meaningful bottlenecks later

---

## Appendix AO. What Makes This Repo Better Than A Beginner Demo

This is worth stating clearly.

A lot of projects can look impressive visually while still being shallow technically.

This repo is not shallow.

### AO.1 It has real identity boundaries

Many demos stop at:

- "is user logged in?"

This repo also models:

- active organization context

That makes it closer to a real B2B SaaS product.

### AO.2 It separates orchestration from compute

The web app does not pretend to be the model server.

It orchestrates around a specialized inference service.

That is a strong architectural choice.

### AO.3 It uses real private media infrastructure

Files are:

- stored privately
- accessed through signed/proxied flows

That is much stronger than putting everything in public static folders.

### AO.4 It has monetization logic connected to core workflows

Voice creation and generation are both gated and metered.

That is product realism.

### AO.5 It has real historical data shape decisions

Examples:

- `voiceName` snapshot on generation
- `SetNull` on deleted voice relation

Those are choices people only make when thinking about product behavior over time.

### AO.6 It has operational tooling

Examples:

- seed script
- API sync script
- instrumentation

That means the repo thinks beyond local component code.

### AO.7 It has a local design system

The app is not just stitching random library defaults together.

It has a more intentional visual and interaction layer.

---

## Appendix AP. If You Wanted To Rewrite This Repo In Simpler Mental Language

Sometimes the best way to understand a codebase is to re-explain it with very plain words.

Here is that version.

### Plain explanation of the frontend

The frontend has:

- pages that decide what screen to show
- feature folders that group the real product workflows
- reusable UI blocks that keep the design consistent
- hooks that handle repeated logic like audio playback or recording

The frontend’s main job is to guide the user through:

- choosing a voice
- entering text
- recording or uploading audio
- managing subscription-related actions
- seeing generated results

### Plain explanation of the backend

The backend has:

- middleware that decides who is allowed into the app
- tRPC procedures that power normal app data flows
- API routes for file and audio handling
- helper files that talk to the DB, billing, storage, and Python model service

The backend’s main job is to:

- make sure requests are valid
- make sure users only access their own org’s data
- store metadata
- store audio files
- call the real generation engine

### Plain explanation of the database

The database remembers:

- what voices exist
- which org owns a custom voice
- what generations were created
- what text and settings each generation used

### Plain explanation of the Python service

The Python service takes:

- text
- a voice sample path
- generation settings

and returns:

- a generated WAV file

It is the "audio brain" of the product.

### Plain explanation of the storage system

R2 stores:

- uploaded voice sample files
- generated result files

The DB stores references to those files, not the audio itself.

That is why the app can scale better than if it put binary audio directly inside SQL records.

---

## Appendix AQ. The Most Important Connections To Remember

If you forget everything else, remember these connections:

### Connection 1

`src/proxy.ts` connects auth state to routing behavior.

### Connection 2

`src/app/layout.tsx` connects global providers to the entire React tree.

### Connection 3

`src/trpc/init.ts` connects Clerk auth state to API procedure trust rules.

### Connection 4

`src/trpc/routers/generations.ts` connects frontend generation requests to:

- billing
- DB
- storage
- Python inference

### Connection 5

`src/app/api/voices/create/route.ts` connects browser audio to:

- validation
- DB voice record creation
- R2 object storage

### Connection 6

`src/lib/r2.ts` connects your app to private object storage.

### Connection 7

`src/lib/chatterbox-client.ts` connects your TypeScript backend to your Python backend.

### Connection 8

`chatterbox_tts.py` connects stored voice samples and prompt text to generated speech bytes.

### Connection 9

`src/trpc/server.tsx` connects server-side route prefetching to client-side hydrated queries.

### Connection 10

`src/features/...` folders connect abstract backend capability to concrete user workflows.

---

## Appendix AR. Closing Reading Advice

A beginner should not try to memorize this entire repo all at once.

Instead:

1. learn the shape
2. learn the major flows
3. learn one feature end to end
4. learn the infrastructure helpers that support that feature
5. repeat for the next feature

This repository rewards layered reading.

It is not best understood file-by-file in random order.

It is best understood by following:

- a route
- then its feature
- then its API
- then its storage or service dependencies

If you keep reading it that way, the repo will stop feeling large and start feeling organized.

---

## Appendix AS. Deployment And Runtime Topology

This section avoids UI and focuses only on where code likely runs and how the pieces relate operationally.

### AS.1 This is not one runtime

A beginner may think:

- "this project is a Next.js app"

That is only partly true.

Operationally, this system has multiple runtimes:

1. the Next.js runtime
2. the PostgreSQL database
3. the Cloudflare R2 bucket
4. the Polar billing service
5. the Clerk identity service
6. the Modal-hosted Python TTS service
7. the Sentry monitoring backend

So the codebase is one repository, but the product is a distributed system.

That matters because debugging often means asking:

- which runtime failed?

not just:

- which file failed?

### AS.2 Likely hosting shape

Based on the code, a likely deployment shape is:

- Next.js app on Vercel or similar Node-compatible host
- PostgreSQL on a managed database provider
- R2 on Cloudflare
- Polar as hosted billing
- Clerk as hosted auth
- Modal as hosted inference runtime
- Sentry as hosted observability

This is inference from the integrations in code.

The important learning point is:

modern SaaS apps often outsource specialized infrastructure instead of self-hosting every concern.

### AS.3 What the Next.js app is responsible for in deployment

The Next.js deployment is responsible for:

- rendering pages
- hosting API routes
- hosting the tRPC endpoint
- checking auth and org context
- checking subscription state
- orchestrating storage and generation work

It is not responsible for:

- storing large binary media itself
- running GPU inference itself
- implementing auth from scratch
- implementing billing from scratch

That boundary keeps the web runtime leaner.

### AS.4 What the Modal service is responsible for

The Python service is responsible for:

- authenticating service calls with API key
- loading the TTS model
- reading voice sample files from mounted storage
- generating WAV output

It is not responsible for:

- user auth
- org ownership
- billing
- generation history
- UI-facing access control

That separation is clean.

### AS.5 What R2 is responsible for

R2 stores:

- custom voice sample files
- system voice sample files
- generated audio outputs

R2 does not know:

- who owns a voice logically
- what subscription a user has
- what generation record exists in Prisma

That knowledge lives in the app and database.

Storage stores bytes, not business meaning.

### AS.6 What PostgreSQL is responsible for

PostgreSQL stores:

- voice metadata
- org ownership references
- generation metadata
- generation parameter history

It does not store:

- large audio payload bytes
- billing contract truth
- auth session state
- model weights

That is a good division of responsibility.

---

## Appendix AT. Security Model In Plain Backend Terms

This section is about practical backend security boundaries visible in the code.

### AT.1 Identity boundary

Identity comes from Clerk.

The app does not invent its own auth token parsing in most business logic files.

Instead it calls Clerk helpers.

That means:

- user/session trust is outsourced to a dedicated identity system

### AT.2 Organization boundary

This app’s main authorization unit is the organization.

That means the most important security question is often not:

- "which user is this?"

but:

- "which org is this action acting within?"

That is why `orgProcedure` is so central.

### AT.3 Data isolation boundary

Many backend queries enforce:

- `orgId === current org`

That is the real tenant isolation rule in this app.

A beginner should recognize this as the most important recurring pattern in the server code.

### AT.4 Media access boundary

Audio files are not public assets by default.

The app uses:

- signed URLs
- proxy routes
- ownership checks

That means private media access is treated as protected business data.

### AT.5 Service-to-service boundary

The Python generation service is protected by:

- API key header

That means even internal infrastructure calls are authenticated.

This is important because "internal" services should still have boundaries.

### AT.6 Billing boundary

The app does not trust the frontend to say:

- "yes, the user is subscribed"

It asks Polar on the server.

That is correct.

Payment and subscription trust should come from the billing backend, not browser state.

### AT.7 Error-information boundary

In several places, the app returns:

- `NOT_FOUND`

instead of more revealing permission details.

That is a security-aware response-shaping choice.

It reduces how much an attacker can learn about resource existence.

---

## Appendix AU. Observability And Failure Visibility

This section explains how the app makes failures visible.

### AU.1 Why observability matters here

This app coordinates multiple systems.

That means failures can happen in many places:

- database
- storage
- auth
- billing
- inference
- route rendering
- client hydration

Without observability, debugging production issues would be much harder.

### AU.2 Sentry appears in multiple layers

The repo uses Sentry in:

- server config
- edge config
- client config
- tRPC middleware
- explicit capture calls

This is good because it means:

- failures are observable across runtimes

not only in one place.

### AU.3 Explicit capture vs middleware capture

Some failures are captured because:

- Sentry middleware wraps procedures

Others are captured because code explicitly calls:

- `Sentry.captureException`
- `Sentry.logger.info`
- `Sentry.logger.error`

That means the observability strategy is both:

- automatic
- and intentionally instrumented

Automatic capture is useful.

Intentional semantic logging is even better for understanding workflow state.

### AU.4 What kinds of events are worth logging

The code logs meaningful lifecycle events like:

- generation started
- generation success
- generation failure

These are better than random noisy logs because they correspond to product milestones.

Good observability often maps to product actions, not just low-level code execution.

### AU.5 Silent failures vs visible failures

Some failures are intentionally non-fatal for the user:

- billing event ingestion failure
- best-effort storage cleanup failure

That does not mean they are ignored.

It means:

- user flow should continue
- operators should still know the failure happened

That is a healthy distinction.

---

## Appendix AV. Testing Reality In This Repo

There is no formal test suite configured yet.

That itself is part of understanding the repo honestly.

### AV.1 What quality gates exist right now

The documented quality gates are:

- `npm run lint`
- `npm run build`

These help catch:

- type issues
- lint issues
- some integration/build-time issues

They do not fully replace:

- unit tests
- integration tests
- end-to-end tests

### AV.2 What is manually testable from the codebase

A developer can manually test:

- sign-in and sign-up flow
- org selection flow
- voice upload
- voice recording
- voice preview
- generation creation
- generation playback
- billing redirects
- sidebar behavior

But manual testing has limits, especially for:

- permission regressions
- billing edge cases
- partial failure rollback logic
- external-service contract drift

### AV.3 Backend areas that would benefit most from tests

The highest-value future automated tests would likely cover:

- org-scoped authorization behavior
- generation creation failure paths
- voice creation validation rules
- storage-key generation conventions
- billing-required behavior
- response shaping for proxy routes

Those areas hold business and trust logic.

### AV.4 Why no tests is not the same as no structure

Even without a formal test suite, the repo already has:

- clear layering
- validation
- typed boundaries
- route/feature separation

That means it is testable in principle.

The structure is not the blocker.

The test harness simply has not been added yet.

---

## Appendix AW. Maintenance Scripts And Operational Workflows

This section explains the non-request code that keeps the system usable over time.

### AW.1 `scripts/seed-system-voices.ts` as an operational installer

This script is not part of user requests.

It is part of system setup.

Its role is to make sure built-in voices exist as real backend resources.

That means:

- the UI can list them
- the generation backend can use them
- the preview route can serve them

Without the seed script, "system voices" would only be an idea, not actual persisted resources.

### AW.2 `scripts/sync-api.ts` as a contract sync tool

This script keeps the TypeScript backend aligned with the Python backend.

That is very important in a multi-language system.

Without this kind of sync step, drift becomes more likely:

- endpoint changes
- request-body shape changes
- response-type changes

This script reduces that risk.

### AW.3 Prisma generation and migration workflow

The repo uses:

- Prisma generate
- Prisma migrations
- Prisma seed

That means backend schema evolution likely follows this operational pattern:

1. edit `prisma/schema.prisma`
2. generate migration
3. apply migration
4. regenerate Prisma client
5. reseed if system voice data changed

This is a healthy backend data-evolution workflow.

### AW.4 Why operational scripts belong in the same repo

Because they operate on the same domain model as the app.

Examples:

- the seed script understands voice categories and names
- the sync script understands the Python service contract

Keeping them in the repo ensures domain logic and operational logic evolve together.

---

## Appendix AX. Data Lifecycle Of Core Entities

This section explains how the main domain entities are born, used, and sometimes removed.

### AX.1 Lifecycle of a system voice

1. local `.wav` file exists in `scripts/system-voices`
2. seed script reads the file
3. seed script creates or updates a `Voice` row with variant `SYSTEM`
4. seed script uploads the file to R2
5. seed script stores the R2 key on the row
6. voice becomes visible in the app
7. users can preview or generate with it

This is not user-created content.

It is curated platform content.

### AX.2 Lifecycle of a custom voice

1. user uploads or records audio
2. frontend submits file + metadata
3. backend validates auth/subscription/audio
4. backend creates a `Voice` row with variant `CUSTOM`
5. backend uploads audio to R2
6. backend stores the R2 key on the row
7. voice appears in Team Voices
8. voice can be used for generation
9. if deleted, DB row is removed and storage cleanup is attempted

This is organization-owned content.

### AX.3 Lifecycle of a generation

1. user submits text and settings
2. backend validates rules and billing
3. backend calls Python service
4. Python service returns WAV bytes
5. backend creates `Generation` row
6. backend uploads WAV to R2
7. backend stores R2 key on row
8. history view can list it
9. audio proxy route can stream it

This is result content, not source voice content.

### AX.4 Lifecycle of billing usage information

1. user performs billable action
2. backend completes core action
3. backend emits usage event to Polar
4. billing status query later reads aggregated state from Polar
5. UI surfaces active status or estimated current cost

This means billing truth is mostly externalized rather than deeply stored locally.

### AX.5 Lifecycle of auth/org context

1. Clerk signs user in
2. middleware sees `userId`
3. user selects org
4. middleware and procedures see `orgId`
5. protected pages and procedures use that org context

This context is not stored as one of your main Prisma models.

It comes from Clerk at runtime.

---

## Appendix AY. Backend Refactor Opportunities A Future Maintainer Might Consider

This section is not saying the current code is bad.

It is describing natural future evolution paths.

### AY.1 Unify subscription-required error strings

Current code uses slightly different message spellings in different places.

A future cleanup could centralize:

- one canonical error code or message

That would reduce fragile frontend string matching.

### AY.2 Extract shared billing-gate helper

Both:

- generation creation
- voice creation

check active subscription.

A shared helper could reduce duplication if the logic grows.

### AY.3 Add background cleanup or retry mechanisms

Currently some cleanup is best effort.

As the app grows, background jobs could improve reliability for:

- failed storage cleanup
- billing retry
- orphan detection

### AY.4 Add integration tests around trust boundaries

The most valuable backend tests would likely target:

- org isolation
- not-found vs forbidden behavior
- file validation
- generation rollback behavior

### AY.5 Add explicit storage object naming helpers

Right now key paths are composed inline in a few places.

A shared helper could standardize:

- system voice keys
- custom voice keys
- generation keys

This becomes more valuable as the app grows.

### AY.6 Consider stronger error typing between frontend and backend

Some UI behavior depends on string messages.

A future evolution could use:

- more structured error codes

This would make client branching safer.

### AY.7 Consider webhook or local billing cache if status checks become expensive

Right now billing state is fetched from Polar when needed.

That is fine for the current stage.

At larger scale, some teams introduce:

- synced local billing state
- webhook-backed cache

That is a future scaling consideration, not a present requirement.

---

## Appendix AZ. Non-UI Summary Of The Entire System

Here is the whole repo explained again, but only in non-UI/system terms.

### What the app stores

It stores:

- voice metadata in PostgreSQL
- generation metadata in PostgreSQL
- audio bytes in R2

### What the app checks

It checks:

- whether the user is signed in
- whether an org is active
- whether the org owns the requested private resources
- whether the org has an active subscription
- whether uploaded audio is valid and long enough

### What the app computes

It computes:

- generation requests and settings on the server
- signed storage URLs
- billing state summaries
- audio object keys

The heavy ML computation itself is outsourced to the Python service.

### What the Python service computes

It computes:

- generated speech waveform bytes from text + voice sample

### What external systems do

Clerk:

- identity and organizations

Polar:

- checkout, portal, subscription state, usage metering

R2:

- durable audio file storage

Sentry:

- monitoring and error visibility

Modal:

- GPU-backed model execution

### What this means architecturally

The repo is a coordination layer around multiple specialized systems.

Its job is not to do every technical task itself.

Its job is to combine those systems into one coherent product.

---

## Appendix BA. Environment Setup And Secret-by-Secret Explanation

This section is purely operational.

It explains what each secret or environment variable means in the real system.

The goal is to answer questions like:

- why does this variable exist?
- what breaks if it is wrong?
- which file depends on it?
- is it internal-only or user-facing?

### BA.1 `DATABASE_URL`

Type:

- server secret / infrastructure config

Used by:

- Prisma config
- `src/lib/db.ts`

Purpose:

- tells Prisma how to connect to PostgreSQL

What breaks if missing:

- almost all app data access breaks
- voices and generations cannot load or save

What breaks if malformed:

- Prisma client may fail to start
- migrations may fail
- seed scripts may fail

Operational importance:

- extremely high

### BA.2 `APP_URL`

Type:

- server environment config

Used by:

- tRPC client URL fallback
- billing checkout success URL

Purpose:

- provides a canonical base URL for server-side generated links

What breaks if wrong:

- checkout success redirect may send users to the wrong domain
- server-side API URL construction may become incorrect

Operational importance:

- high

### BA.3 `POLAR_ACCESS_TOKEN`

Type:

- server secret

Used by:

- `src/lib/polar.ts`

Purpose:

- authenticate requests to Polar

What breaks if missing or invalid:

- checkout creation fails
- customer portal sessions fail
- subscription status checks fail
- billing usage events fail

Operational importance:

- extremely high for monetization flow

### BA.4 `POLAR_SERVER`

Type:

- server config

Allowed values:

- `sandbox`
- `production`

Purpose:

- selects which Polar environment the app should talk to

What breaks if wrong:

- your app could query the wrong customer/subscription environment
- developers may think billing is broken when they are simply pointed at the wrong tier

Operational importance:

- high

### BA.5 `POLAR_PRODUCT_ID`

Type:

- server config

Purpose:

- tells checkout which product to sell

What breaks if wrong:

- checkout may fail
- users may be sent to the wrong billing product

Operational importance:

- high

### BA.6 `POLAR_METER_VOICE_CREATION`

Type:

- server config

Purpose:

- event name for billable voice creation

What breaks if wrong:

- voice creation usage may not meter correctly
- billing reports may become incomplete

Operational importance:

- medium to high

### BA.7 `POLAR_METER_TTS_GENERATION`

Type:

- server config

Purpose:

- event name for billable speech generation

What breaks if wrong:

- generation usage may not meter correctly
- revenue tracking can become inaccurate

Operational importance:

- extremely important for usage billing integrity

### BA.8 `POLAR_METER_TTS_PROPERTY`

Type:

- server config

Visible current role:

- defined in env schema
- not clearly used in the inspected code paths

What that usually means:

- planned future usage
- legacy retained config
- billing metadata dimension not yet wired in

Operational importance:

- currently unclear / likely future-facing

### BA.9 `AWS_REGION`

Type:

- server config

Used by:

- `src/lib/r2.ts`
- seed script

Purpose:

- required by the S3 client configuration layer

What breaks if wrong:

- object storage client setup may fail or behave unpredictably

Operational importance:

- high

### BA.10 `R2_ACCOUNT_ID`

Type:

- server config

Purpose:

- identifies the Cloudflare account associated with storage

Current direct usage:

- env validation
- seed-script env parsing

Operational importance:

- medium, but still part of correct storage setup

### BA.11 `R2_ACCESS_KEY_ID`

Type:

- server secret

Purpose:

- authenticates object-storage client requests

What breaks if wrong:

- uploads fail
- deletes fail
- signed URL requests fail

Operational importance:

- extremely high for media workflows

### BA.12 `R2_SECRET_ACCESS_KEY`

Type:

- server secret

Purpose:

- paired credential with the access key

What breaks if wrong:

- same as above, all storage operations fail

Operational importance:

- extremely high

### BA.13 `R2_BUCKET_NAME`

Type:

- server config

Purpose:

- names the bucket that stores voices and generations

What breaks if wrong:

- app may upload to the wrong place
- app may fail to read media
- seed script may populate the wrong bucket

Operational importance:

- extremely high

### BA.14 `CHATTERBOX_API_URL`

Type:

- server config

Used by:

- `src/lib/chatterbox-client.ts`
- `scripts/sync-api.ts`

Purpose:

- points the app and tooling to the deployed Python service

What breaks if wrong:

- generation calls fail
- API type sync fails

Operational importance:

- extremely high for TTS feature

### BA.15 `CHATTERBOX_API_KEY`

Type:

- server secret

Purpose:

- authenticates app-to-Python-service generation requests

What breaks if wrong:

- Python service rejects requests with 403

Operational importance:

- extremely high

### BA.16 The Clerk keys

The README mentions:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Even though they are not declared in `src/lib/env.ts`, they are still operationally critical because Clerk requires them.

Meaning:

- one is safe for browser exposure
- one is server-only

What breaks if missing:

- auth UI
- server-side auth checks
- organization state

Operational importance:

- extremely high

### BA.17 Secret-handling lesson for beginners

Not every env var is equal.

Some are:

- public config

Some are:

- private credentials

Some are:

- runtime selection switches

When maintaining a system like this, one of the first things you should learn is:

- which values can appear in the browser
- which must stay server-only
- which external service each value unlocks

---

## Appendix BB. Schema Evolution And Migration Strategy

This section explains how the data model is expected to change over time.

### BB.1 Why schema evolution matters

Beginner projects often treat the database schema as fixed.

Real products do not stay fixed.

Eventually you may want to add:

- generation status fields
- billing snapshot fields
- deletion markers
- sharing flags
- audit logs
- webhook event history

That means you need a repeatable way to evolve the schema safely.

### BB.2 The current schema is intentionally small

The current Prisma schema only has:

- two models
- two enums

That is actually a strength for this stage.

It means:

- the domain is still understandable
- there is little accidental complexity

A future maintainer should respect that simplicity and only add fields that serve real product needs.

### BB.3 What Prisma migrations give you

Prisma migrations give:

- a recorded history of schema changes
- a way to apply changes consistently
- a way to synchronize environments

Without migrations, schema changes become ad hoc and fragile.

### BB.4 Current migration footprint

The repo currently has:

- one init migration

That means the project is still early enough that the schema has not gone through many public evolutions yet.

This is a good time to stay disciplined.

### BB.5 A healthy workflow for changing schema

A future schema change should usually follow this order:

1. decide the new domain rule or feature need
2. edit `prisma/schema.prisma`
3. generate a migration
4. apply the migration locally
5. regenerate Prisma client
6. update backend code that reads/writes the changed model
7. update feature code and forms if needed
8. consider whether seed script logic must change
9. run lint/build and manual verification

This order matters because schema is not isolated.

It affects:

- generated client types
- route handlers
- tRPC routers
- sometimes storage key behavior

### BB.6 Example schema changes and their blast radius

#### Add `title` to `Generation`

You would likely need to change:

- Prisma schema
- generation create mutation
- generation detail/history displays
- maybe prompt submission flow

#### Add `deletedAt` soft delete to `Voice`

You would likely need to change:

- Prisma schema
- voice queries
- delete mutation logic
- voice preview route
- generation eligibility rules

#### Add `status` to `Generation`

You would likely need to change:

- Prisma schema
- generation creation logic
- history list behavior
- result page assumptions
- maybe move to asynchronous generation workflow

This is a useful lesson:

schema changes are product changes.

They are rarely "just database changes".

### BB.7 Why the generated Prisma output path matters during schema change

Because your Prisma client output is checked into:

- `src/generated/prisma`

every schema change also changes generated code.

That means maintainers must remember:

- model edits imply codegen updates

### BB.8 A future schema risk to think about

Right now billing truth is mostly externalized to Polar.

If the app later needs:

- cached local billing snapshots
- invoice history
- subscription flags for analytics

the schema may grow in that area.

A future maintainer should decide carefully whether local duplication is truly needed.

---

## Appendix BC. File-by-File Backend-Oriented Inventory Of Remaining Important Files

This section intentionally revisits backend-adjacent files that are important but easier to overlook.

### BC.1 `src/lib/polar.ts`

Why it matters:

- it is the single billing-client construction point

Why centralized construction is good:

- if auth or environment setup changes, one place updates the SDK instance

What kind of file it is:

- infrastructure adapter

### BC.2 `src/trpc/query-client.ts`

Why it matters:

- it defines the QueryClient factory used for hydration behavior

Why backend-adjacent:

- even though it is mostly frontend-facing infra, it directly affects how server-prefetched data becomes client-available state

What kind of file it is:

- cross-boundary cache configuration support

### BC.3 `src/instrumentation-client.ts`

Why it still matters in backend understanding:

- failures in browser flows can reflect backend behavior indirectly
- replay and router transition tracing help correlate full user journeys

What kind of file it is:

- client observability bootstrap

### BC.4 `src/instrumentation.ts`

Why it matters:

- links runtime-specific Sentry startup into the Next.js instrumentation lifecycle

What kind of file it is:

- framework observability integration

### BC.5 `sentry.server.config.ts`

Why it matters:

- ensures server exceptions and traces are shipped out

What kind of file it is:

- server monitoring config

### BC.6 `sentry.edge.config.ts`

Why it matters:

- gives you visibility into middleware/edge failures

What kind of file it is:

- edge monitoring config

### BC.7 `prisma.config.ts`

Why it matters:

- encodes how Prisma should locate schema, migrations, and seed logic

What kind of file it is:

- data tooling config

### BC.8 `postcss.config.mjs`

Why it is not backend-related:

- it is almost purely build/styling config

Why mention it at all:

- because a full repo reading should know what can safely be ignored during backend study

### BC.9 `next.config.ts`

Backend-relevant detail:

- `proxyClientMaxBodySize: "20mb"`

Why that matters:

- voice upload route expects reasonably large audio request bodies

This is one of the few frontend-framework config lines that directly protects a backend/media workflow.

### BC.10 `src/app/global-error.tsx`

Why it matters for backend readers:

- server or route errors often surface here in user-facing fallback form

It is part of the overall failure story even though it is not server business logic itself.

### BC.11 `src/app/test/page.tsx`

Why it matters:

- it shows direct Prisma reads in a route page

Why it should be read carefully:

- it is likely development/test-only behavior, not a model for every production page

### BC.12 `src/types/chatterbox-api.d.ts`

Why it matters:

- it is the generated contract between TS and Python services

Why not edit manually:

- generated from OpenAPI

What kind of file it is:

- cross-service type artifact

---

## Appendix BD. Production Failure Scenarios And Current Behavior

This section imagines real failures and explains how the current code reacts.

This is one of the most useful ways to understand backend robustness.

### BD.1 Failure: user is signed out and opens `/`

Current behavior:

- middleware redirects to `/landing`

User impact:

- friendly public experience instead of raw auth error

Operational meaning:

- homepage doubles as marketing entry for anonymous traffic

### BD.2 Failure: user is signed in but no org is active

Current behavior:

- middleware redirects to `/org-selection`

User impact:

- they are guided into the missing context step

Operational meaning:

- org context is required for meaningful protected app usage

### BD.3 Failure: user tries to create a voice without subscription

Current behavior:

- `/api/voices/create` returns `403` with subscription-required message

User impact:

- workflow is blocked before storage/DB work

Operational meaning:

- paid feature gating is server-enforced

### BD.4 Failure: uploaded file is empty

Current behavior:

- voice creation route returns `400`

Why good:

- client gets immediate bad-request response
- no unnecessary DB writes happen

### BD.5 Failure: uploaded file is too large

Current behavior:

- voice creation route returns `413`

Why good:

- expresses correct kind of error
- prevents excessive memory/storage work

### BD.6 Failure: uploaded file is not valid audio

Current behavior:

- route returns `422`

Why good:

- semantic validation failure
- the server validated real bytes, not just filename

### BD.7 Failure: uploaded audio is too short

Current behavior:

- route returns `422`

Why good:

- model-quality guardrail is enforced before persistence

### BD.8 Failure: DB row creates but R2 upload fails during voice creation

Current behavior:

- route tries to delete the created voice row
- returns `500`

Why this matters:

- avoids broken voice entries lingering in the DB

Remaining risk:

- if rollback delete also fails, manual cleanup may be needed

### BD.9 Failure: billing event fails after successful voice creation

Current behavior:

- error is logged
- user still gets success response

Why this tradeoff makes sense:

- user should not lose a successful core action because metering telemetry failed

### BD.10 Failure: generation called without subscription

Current behavior:

- `trpc.generations.create` throws forbidden error

Frontend behavior:

- generation form catches error
- shows toast
- offers checkout action

This is a good full-stack error-to-UX flow.

### BD.11 Failure: selected voice does not exist or is inaccessible

Current behavior:

- generation route throws `NOT_FOUND`

Why good:

- does not expose whether the resource exists for another tenant

### BD.12 Failure: selected voice row exists but audio object key is missing

Current behavior:

- generation route throws `PRECONDITION_FAILED`

Meaning:

- DB state alone is not enough
- media readiness is a separate requirement

### BD.13 Failure: Python service returns error

Current behavior:

- generation route throws internal server error for failed audio generation

User impact:

- generation fails cleanly rather than storing bad data

### BD.14 Failure: Python service returns wrong response shape

Current behavior:

- route checks `ArrayBuffer` shape
- throws internal error if invalid

Why good:

- external-service success responses are not blindly trusted

### BD.15 Failure: generation DB row created but R2 upload fails

Current behavior:

- generation route tries to delete created generation row
- logs failure state
- throws internal error

Why good:

- avoids polluted history with unusable records

### BD.16 Failure: billing event fails after successful generation

Current behavior:

- exception is captured
- user still gets successful generation

Tradeoff:

- product success prioritized over metering perfection

### BD.17 Failure: audio proxy route cannot fetch from R2

Current behavior:

- route returns `502`

Why this status code fits:

- upstream dependency failed

### BD.18 Failure: unauthorized request hits `/api/audio/[generationId]`

Current behavior:

- route returns `401`

Why good:

- private media access is protected independently of UI behavior

### BD.19 Failure: custom voice from another org is requested

Current behavior:

- voice proxy route returns `404`

Why good:

- hides ownership details

### BD.20 Failure: middleware or edge logic throws

Current behavior:

- Sentry edge instrumentation should help surface the failure

Lesson:

- even routing/access logic is treated as observable production code

---

## Appendix BE. Operational Checklists For A Maintainer

This section is intentionally repetitive and practical.

### BE.1 When changing the database schema

Checklist:

1. edit `prisma/schema.prisma`
2. create/apply migration
3. regenerate Prisma client
4. inspect `src/generated/prisma`
5. update affected tRPC routes / API handlers
6. update any seed logic if needed
7. run lint/build
8. manually verify affected workflows

### BE.2 When changing voice creation rules

Checklist:

1. update frontend form if user-facing constraint changes
2. update backend route in `/api/voices/create`
3. keep server validation as source of truth
4. consider seed/system voice implications if relevant
5. manually test:
   - upload path
   - record path
   - preview path

### BE.3 When changing generation behavior

Checklist:

1. update frontend defaults if product behavior changes
2. update backend router validation and logic
3. update Python request contract if service inputs changed
4. run `npm run sync-api` if OpenAPI changed
5. verify result storage and playback still work

### BE.4 When changing billing behavior

Checklist:

1. inspect `src/trpc/routers/billing.ts`
2. inspect generation and voice creation gating paths
3. ensure frontend error handling still matches backend behavior
4. verify checkout and portal URLs work
5. confirm usage events still map to correct meter names

### BE.5 When changing storage key conventions

Checklist:

1. update key generation in relevant backend files
2. update seed script if system voice keys are affected
3. consider backward compatibility of already stored objects
4. consider proxy route expectations
5. consider cleanup scripts or migration needs

### BE.6 When debugging a production incident

Checklist:

1. identify which subsystem failed:
   - auth
   - org routing
   - DB
   - storage
   - billing
   - inference
2. inspect Sentry
3. inspect the relevant route/router
4. verify env values for the failing subsystem
5. check whether failure happened before or after persistence
6. check whether rollback or cleanup ran

---

## Appendix BF. Final Non-UI Study Map

If you want to study only the non-UI side of this repo, use this exact sequence:

1. `README.md`
2. `ARCHITECTURE.md`
3. `prisma/schema.prisma`
4. `src/lib/env.ts`
5. `src/lib/db.ts`
6. `src/lib/r2.ts`
7. `src/lib/polar.ts`
8. `src/lib/chatterbox-client.ts`
9. `src/proxy.ts`
10. `src/trpc/init.ts`
11. `src/trpc/routers/billing.ts`
12. `src/trpc/routers/voices.ts`
13. `src/app/api/voices/create/route.ts`
14. `src/app/api/voices/[voiceId]/route.ts`
15. `src/trpc/routers/generations.ts`
16. `src/app/api/audio/[generationId]/route.ts`
17. `src/trpc/server.tsx`
18. `scripts/seed-system-voices.ts`
19. `scripts/sync-api.ts`
20. `chatterbox_tts.py`

By the time you finish that sequence, you will understand:

- how trust enters the system
- how data is stored
- how media is protected
- how billing is enforced
- how generation is orchestrated
- how infrastructure pieces fit together

That is the non-UI backbone of Resonance.

---

## Appendix BG. Backend Glossary For This Repo

This glossary is intentionally practical.

It explains terms the way they matter inside this repository, not only in generic textbook form.

### Access control

The rules that decide whether a request is allowed to do something.

In this repo, access control is mostly enforced by:

- Clerk auth checks
- org-aware route/procedure logic
- org-scoped Prisma queries

### API route

A Next.js route handler under `src/app/api/...`.

In this repo, API routes are used for:

- tRPC transport
- raw media upload
- audio streaming/proxying

### ArrayBuffer

A binary data format used in JavaScript.

In this repo, generated WAV audio is returned from the Python service as an `ArrayBuffer`, then converted into a Node `Buffer` for storage.

### Billing gate

A backend rule that blocks an action if billing state is insufficient.

In this repo, billing gates protect:

- custom voice creation
- speech generation

### Bucket

An object-storage container.

In this repo, the R2 bucket stores:

- system voice samples
- custom voice samples
- generated audio outputs

### Cache invalidation

Telling the query system that previously loaded data may now be stale.

In this repo, mutation success often invalidates:

- voice list queries
- billing status queries

### Caller

A server-side way to invoke tRPC procedures directly.

This repo exports caller factory support in `src/trpc/init.ts`, though the main pattern here is route-based tRPC access.

### Clerk

The hosted identity and organization platform used by the app.

It provides:

- user auth
- org membership and switching
- server-side auth helpers

### CloudBucketMount

A Modal feature that mounts object storage like a filesystem.

In this repo, the Python TTS service mounts the R2 bucket at `/r2`.

### Context

Shared request-level or tree-level state.

In this repo there are multiple contexts:

- tRPC request context
- React provider contexts
- TTS voices context
- sidebar context

### Custom voice

A voice uploaded or recorded by a user for a specific organization.

In the DB:

- `variant = CUSTOM`
- `orgId` is set

### Dehydration

Turning server-side query cache data into a serializable form that can be sent to the client.

In this repo, `src/trpc/server.tsx` does this for prefetch hydration.

### Denormalized snapshot

A copy of some information stored redundantly on purpose for history or convenience.

In this repo:

- `Generation.voiceName` is a denormalized snapshot

### External customer ID

An ID your app uses to identify the same entity in a third-party system.

In this repo, the Clerk org ID is used as the Polar external customer ID.

### FastAPI

The Python web framework used by the TTS service.

### Hydration

Restoring server-prepared state into the client so the browser can continue from it without refetching everything immediately.

### Inference

The process of using a trained model to produce output from input.

In this repo, inference means:

- generating speech from prompt text and a voice reference

### Middleware

Code that runs before the main route or procedure logic.

In this repo:

- Clerk middleware protects routes
- Sentry middleware instruments tRPC
- tRPC procedures use auth/org middleware patterns

### Modal

The platform running the GPU-based Python generation service.

### Mutation

An API action that changes server state.

In this repo, examples include:

- creating a voice
- creating a generation
- deleting a voice
- creating billing sessions

### Object key

The storage path/name of a file inside the bucket.

In this repo, examples look like:

- `voices/system/...`
- `voices/orgs/...`
- `generations/orgs/...`

### Org ID

The active organization identifier from Clerk.

This is one of the most important values in the whole system.

It is used for:

- permissions
- storage namespacing
- generation ownership
- Polar customer identity

### Orchestration

Coordinating multiple systems to complete one product action.

The Next.js backend in this repo is primarily an orchestration layer.

### Polar

The hosted billing and metering system used by the app.

### Precondition

A condition that must be true before an operation can continue.

In this repo:

- a voice must have an audio object key before generation can use it

### Prisma

The ORM and schema system used to talk to PostgreSQL.

### Procedure

A tRPC endpoint unit.

Examples:

- `voices.getAll`
- `generations.create`
- `billing.getStatus`

### Proxy route

A route that fetches data from another source and re-serves it to the client.

In this repo:

- audio routes proxy private R2 media

### R2

Cloudflare’s object storage, used here via S3-compatible APIs.

### Rollback

Cleanup logic that attempts to undo a partially completed workflow after a failure.

In this repo:

- created DB rows may be deleted if a later storage step fails

### Route handler

A Next.js server function that responds to HTTP requests.

Used here for:

- upload route
- audio proxy routes
- tRPC fetch endpoint

### Sentry

Monitoring and error tracking system used across client, server, and edge layers.

### Signed URL

A temporary, permission-bearing URL for accessing a private object.

### Superjson

A serializer used by tRPC to safely transfer richer values than plain JSON alone.

### System voice

A built-in platform voice seeded by scripts.

In the DB:

- `variant = SYSTEM`
- `orgId = null`

### tRPC

The internal typesafe API layer connecting the frontend and backend parts of the Next.js app.

### Voice sample

The source audio used as a voice reference for cloning/generation.

### WAV

The audio format used for generated output and many sample files in this repo.

---

## Appendix BH. How To Debug This App In Production

This section is about process, not code syntax.

When a production problem happens, your main job is to locate which subsystem is failing first.

### BH.1 First question: what category of failure is this?

Ask:

- auth failure?
- org-routing failure?
- billing failure?
- database failure?
- storage failure?
- inference failure?
- hydration/query failure?

Most debugging time is saved by categorizing correctly early.

### BH.2 If users cannot enter the app

Start with:

- `src/proxy.ts`
- Clerk config/keys
- org-selection flow

Things to inspect:

- are users signed in?
- are they missing org context?
- are public/private routes behaving as expected?

Likely failure sources:

- Clerk credentials
- broken middleware logic
- org redirect loop

### BH.3 If users can enter but cannot create voices

Check:

- `/api/voices/create`
- Polar subscription state
- upload size/content type
- R2 credentials
- DB connectivity

Ask:

- does the request fail before DB create?
- after DB create?
- during storage upload?
- after success when metering?

This lets you separate:

- validation failures
- persistence failures
- billing failures

### BH.4 If users can create voices but cannot generate speech

Check:

- `src/trpc/routers/generations.ts`
- Polar billing state
- voice `r2ObjectKey` existence
- Chatterbox API reachability
- Python service auth key

Ask:

- does generation fail before calling the Python service?
- during the Python call?
- after bytes return but before final persistence?

That narrows the issue quickly.

### BH.5 If playback fails after successful generation

Check:

- generation row exists?
- `r2ObjectKey` present?
- R2 object actually exists?
- signed URL fetch succeeds?
- `/api/audio/[generationId]` returning 401, 404, 409, or 502?

Playback failures are often not "generation" failures.

They are often:

- media access failures
- storage failures
- ownership or auth failures

### BH.6 If billing UI looks wrong

Check:

- `src/trpc/routers/billing.ts`
- latest Polar customer state
- whether usage events were ingested
- whether frontend invalidation happened after mutations

This can be:

- a backend state issue
- or a stale cache/UI refresh issue

### BH.7 Use Sentry to anchor the timeline

Look for:

- when request started
- whether generation success log exists
- whether generation failure log exists
- whether billing ingestion exceptions appeared

Good observability should let you answer:

- how far did the workflow get?

That is usually the most important production-debugging question.

### BH.8 Read by workflow, not by file type

When debugging:

do not jump randomly between files.

Instead follow the workflow:

1. entry route or mutation
2. auth/org enforcement
3. main backend business logic
4. DB write/read
5. storage action
6. third-party call
7. response shaping

This keeps debugging coherent.

### BH.9 Production debugging mindset

Always ask:

- what was the first thing that definitely succeeded?
- what is the first thing that definitely failed?

Everything in between becomes your search space.

That is a far better method than rereading the whole repo under stress.

---

## Appendix BI. How Data Moves Between Clerk, Prisma, R2, Polar, And Modal

This is the most system-level chapter in the book.

It explains the major external boundaries and how data crosses them.

### BI.1 Clerk to Next.js

Clerk provides:

- `userId`
- `orgId`

These values move into:

- middleware decisions
- tRPC procedure context
- route-handler permission logic

This is identity and tenancy information moving from auth provider into app logic.

### BI.2 Next.js to Prisma

Next.js backend code sends:

- query filters
- create data
- update data
- delete conditions

Prisma returns:

- voice rows
- generation rows
- IDs
- timestamps

This is business metadata flow.

Not binary file flow.

### BI.3 Next.js to R2

Next.js backend sends:

- uploaded voice buffers
- generated audio buffers

R2 stores:

- opaque file bytes under object keys

Later, Next.js asks R2 for:

- signed URLs

This is binary object flow.

### BI.4 Next.js to Polar

Next.js backend sends:

- checkout creation requests
- customer portal session requests
- usage events

Polar returns:

- checkout URLs
- portal URLs
- customer subscription state
- meter state

This is billing and monetization flow.

### BI.5 Next.js to Modal/Python

Next.js backend sends:

- prompt text
- voice key
- tuning params
- API key auth header

Python service returns:

- WAV bytes

This is inference-request flow.

### BI.6 Modal/Python to R2 mount

The Python service does not usually ask the Next.js app for voice bytes.

Instead it reads the sample from mounted bucket storage.

That means:

- the app passes a storage key
- the Python service resolves that key into mounted filesystem data

This is a storage-mounted compute pattern.

### BI.7 Why this architecture is good

It means:

- auth data comes from a dedicated identity provider
- metadata comes from the DB
- large binary content comes from object storage
- billing comes from a billing platform
- heavy compute comes from a compute service

Each system does the job it is best at.

The app backend coordinates them.

### BI.8 The hidden dependency chain

For generation to succeed, all of these must align:

1. Clerk must authenticate the user
2. org context must exist
3. Polar must consider the org billable/active
4. Prisma must return a valid voice record
5. that voice record must have a valid `r2ObjectKey`
6. the object must exist in R2
7. the Python service must accept the API key
8. the model must generate valid WAV bytes
9. Next.js must write generation metadata
10. R2 must accept the final output upload

This chain is why production reliability depends on multiple services, not only code correctness in one file.

---

## Appendix BJ. What To Watch Out For When Deploying Changes

Deployment risk is not only about syntax errors.

It is about changing assumptions across boundaries.

### BJ.1 Deploying schema changes

Watch out for:

- app code expecting new fields before migration runs
- generated Prisma client being out of sync
- seed script assumptions no longer matching schema

Safe pattern:

- migrate first or coordinate migration with deploy carefully

### BJ.2 Deploying billing changes

Watch out for:

- wrong product ID
- wrong meter name
- wrong Polar environment
- frontend expecting old error strings

Safe pattern:

- verify both checkout and protected workflows after deploy

### BJ.3 Deploying storage-key convention changes

Watch out for:

- older records pointing to older key patterns
- seed script continuing to write old conventions
- proxy routes assuming key structure indirectly

Safe pattern:

- maintain backward compatibility or migrate old references deliberately

### BJ.4 Deploying Python API changes

Watch out for:

- TypeScript client contract no longer matching Python service
- needing to rerun `npm run sync-api`
- new required fields on one side only

Safe pattern:

- change Python service
- sync OpenAPI types
- update TS backend caller
- verify end-to-end generation

### BJ.5 Deploying env changes

Watch out for:

- new env vars added in code but not in deployment platform
- wrong values in one environment only
- stale local assumptions compared with production

Safe pattern:

- treat env changes like code changes
- verify deployment configuration explicitly

### BJ.6 Deploying auth/middleware changes

Watch out for:

- redirect loops
- newly-public routes accidentally requiring auth
- newly-private routes accidentally left open

Safe pattern:

- test signed-out, signed-in no-org, and signed-in with-org flows

### BJ.7 Deploying generation logic changes

Watch out for:

- parameter mismatch between frontend defaults and backend validation
- Python service range mismatch
- persistence flow regressions after successful generation

Safe pattern:

- verify generation from end to end, including playback

### BJ.8 Deploying "small" refactors to shared files

Files like:

- `src/lib/env.ts`
- `src/lib/r2.ts`
- `src/trpc/init.ts`
- `src/proxy.ts`

look small but have huge blast radius.

A maintainer should treat them as high-risk shared infrastructure files.

Their size is misleading.

---

## Appendix BK. Final Systems Chapter

If you explain the whole codebase from the perspective of systems design only, the cleanest summary is this:

The repository is a product orchestration system.

It receives identity from Clerk, stores domain metadata in PostgreSQL through Prisma, stores binary audio in Cloudflare R2, checks subscription and usage state through Polar, calls a dedicated Modal-hosted Python inference service to generate speech, and uses Sentry to observe failures across the whole workflow chain.

The Next.js code in the repo is the coordinator that turns all of those external capabilities into one coherent application.

That systems perspective is the deepest non-UI truth of the project.

---

## Appendix BL. Incident Response Playbooks

This section is written like an operations manual.

It assumes something is wrong in production and a maintainer needs a repeatable response pattern.

### BL.1 Incident: users report "I cannot generate audio"

Start with the narrowest question:

- does the request fail before inference, during inference, or after inference?

Check in this order:

1. Sentry logs around `generations.create`
2. Polar subscription state for the affected org
3. whether the selected voice exists and has `r2ObjectKey`
4. whether the Python service is reachable
5. whether the Python service accepts the API key
6. whether R2 upload of the result succeeded
7. whether the generation row was rolled back

Likely root-cause categories:

- billing gate rejection
- broken voice media
- Python service failure
- result persistence failure

### BL.2 Incident: users report "My voice was created but I cannot use it"

Check:

1. did `/api/voices/create` return success?
2. does the `Voice` row exist in Prisma?
3. does that row have `r2ObjectKey`?
4. does the object exist in R2?
5. does `/api/voices/[voiceId]` stream correctly?
6. does generation reject because `r2ObjectKey` is missing?

Likely root-cause categories:

- partial failure after DB create
- storage upload failure
- stale frontend state
- object missing in bucket

### BL.3 Incident: users report "Playback is broken"

Clarify:

- voice preview broken?
- generation playback broken?

Then check:

1. auth state and org ownership
2. route response code from proxy route
3. presence of object key in DB
4. signed URL generation
5. signed URL fetch result

Useful distinction:

- if generation exists but playback fails, the problem is often storage access, not inference

### BL.4 Incident: billing panel shows wrong values

Check:

1. `billing.getStatus` response
2. Polar dashboard/customer state
3. whether usage events are being ingested
4. whether frontend invalidation ran after mutations

Likely root-cause categories:

- stale cache
- missing/incorrect meter name
- Polar-side state delay
- portal or checkout environment mismatch

### BL.5 Incident: signed-in users are stuck in redirects

Check:

1. `src/proxy.ts`
2. current Clerk session state
3. whether `orgId` is present
4. whether public route matching accidentally changed

Common causes:

- route matcher regression
- missing org-selection exception
- auth provider misconfiguration

### BL.6 Incident: system voices disappeared

Check:

1. `Voice` rows with `variant = SYSTEM`
2. whether seed script was run in the current environment
3. whether R2 objects for system voices exist
4. whether list query still separates system voices correctly

Recovery path:

- rerun seed script with correct environment

### BL.7 Incident: local development works, production fails

Check:

1. environment variable parity
2. `APP_URL` correctness
3. Clerk credentials/environment
4. Polar environment mode
5. R2 credentials and bucket
6. Chatterbox URL/API key

This category is usually configuration drift.

Not code drift.

---

## Appendix BM. Cross-System Integrity Checks

This section explains the kinds of consistency relationships the system relies on.

These are not all automatically enforced by one database transaction.

They are distributed integrity assumptions.

### BM.1 Voice row and voice object must agree

For a usable voice:

- Prisma row must exist
- `r2ObjectKey` must be present
- corresponding R2 object must exist

If any one of those is false, the voice is not truly usable.

### BM.2 Generation row and generation object must agree

For a playable generation:

- Prisma row must exist
- `r2ObjectKey` must be present
- corresponding R2 object must exist

This is the same consistency rule applied to output artifacts.

### BM.3 Org ID must align across systems

The same org identity concept is used in:

- Clerk
- Prisma rows
- R2 path names
- Polar external customer ID

This is convenient, but it also means org-ID mistakes have large blast radius.

### BM.4 Billing state and feature gates must agree

If Polar says:

- inactive subscription

then:

- generation should be blocked
- custom voice creation should be blocked

If those gates ever drift, product rules become inconsistent.

### BM.5 Python request contract and TS client contract must agree

The TypeScript app assumes:

- `/generate` exists
- it accepts specific fields
- it returns WAV bytes

The Python service must continue honoring that contract.

That is why the OpenAPI sync flow matters.

### BM.6 Proxy routes and storage layout must agree

If object key conventions change, then:

- creation code
- preview routes
- generation playback routes
- seed behavior

must all stay aligned.

This is a multi-file integrity dependency.

---

## Appendix BN. Scaling Pressure Points

This section is not saying the app is currently broken.

It explains where growth would likely create pressure first.

### BN.1 More generated audio means more storage pressure

As usage grows:

- generation count grows
- stored audio volume grows

Pressure points:

- bucket size
- cleanup policies
- retention strategy

Future questions:

- should old generations ever expire?
- should there be archival rules?

### BN.2 More generations means more billing-event volume

Every successful billable workflow emits Polar events.

At larger scale, you may need to think about:

- retries
- event durability
- local buffering or queueing

Right now direct request-time event emission is acceptable for the current scale implied by the repo.

### BN.3 More traffic means more dependency on query efficiency

Even with a small schema, growth increases importance of:

- indexes
- query shape discipline
- avoiding unnecessary overfetch

The current schema already has reasonable indexes for present access paths.

### BN.4 More users means stricter incident visibility needs

As user count grows, "manual debugging from a single report" stops scaling.

At that point, observability quality becomes even more important:

- structured logs
- grouped errors
- clear workflow stage markers

### BN.5 More model traffic means Python service availability matters more

Today the Python service is the compute heart of the app.

As demand rises, pressure points likely include:

- cold starts
- concurrency
- queueing latency
- cost management

The current code already assumes a separated inference service, which is the right starting architecture.

### BN.6 More product complexity may pressure the current schema

If future product features include:

- async jobs
- shared voices
- generation statuses
- audit trails
- webhooks

the data model will need to expand.

The current model is good for the current feature scope, but it is intentionally lean.

---

## Appendix BO. Backend Code Review Checklist

This section is for future maintainers reviewing backend changes.

When reviewing a PR or local change, ask these questions.

### BO.1 Authorization questions

- Does the change preserve org isolation?
- Is `orgId` still enforced at the right boundary?
- Are not-found vs forbidden semantics still intentional?

### BO.2 Validation questions

- Is new input validated on the server?
- Are ranges and required fields explicit?
- Does the backend trust any browser-only assumption it should not?

### BO.3 Storage questions

- Are object keys deterministic and consistent?
- What happens if upload fails?
- What happens if delete fails?
- Is there any new orphan-object risk?

### BO.4 Billing questions

- Is the action supposed to be gated by subscription?
- If yes, is the gate enforced server-side?
- If the action is billable, is metering emitted?
- If metering fails, is user-facing behavior still acceptable?

### BO.5 Service-boundary questions

- Does the Python API contract still match?
- Is auth between services still correct?
- Are response-shape assumptions validated?

### BO.6 Response-shape questions

- Is the backend returning only what the client needs?
- Is any infrastructure detail leaking unnecessarily?

### BO.7 Rollback questions

- If step 1 succeeds and step 2 fails, what state remains?
- Should cleanup be attempted?
- Is cleanup blocking or best effort?

### BO.8 Observability questions

- If this new code fails in production, where will that failure be visible?
- Should there be a log, capture, or metric at this workflow point?

---

## Appendix BP. Change Risk Ranking By File Type

This section helps a maintainer understand which files deserve extra caution.

### Highest-risk backend files

These have large blast radius:

- `src/proxy.ts`
- `src/lib/env.ts`
- `src/lib/db.ts`
- `src/lib/r2.ts`
- `src/trpc/init.ts`
- `src/trpc/routers/generations.ts`
- `src/app/api/voices/create/route.ts`
- `chatterbox_tts.py`

Why high risk:

- they sit on shared paths or critical workflows

### Medium-risk backend files

- `src/trpc/routers/voices.ts`
- `src/trpc/routers/billing.ts`
- `src/app/api/audio/[generationId]/route.ts`
- `src/app/api/voices/[voiceId]/route.ts`
- `scripts/seed-system-voices.ts`
- `scripts/sync-api.ts`

Why medium risk:

- important, but narrower blast radius than the core shell and generation pipeline

### Lower-risk backend-adjacent files

- docs files
- static assets
- local test page

Why lower risk:

- changes here rarely threaten core trust or persistence flows directly

Important note:

Low-risk does not mean "safe to be sloppy".

It only means lower system-wide blast radius.

---

## Appendix BQ. Final Maintainer Mental Model

If you maintain this repo long-term, the best mental model is:

There are four kinds of code here.

### Type 1. Trust code

Examples:

- `src/proxy.ts`
- `src/trpc/init.ts`
- org-scoped queries

Job:

- decide who is allowed

### Type 2. Orchestration code

Examples:

- `src/trpc/routers/generations.ts`
- `src/app/api/voices/create/route.ts`

Job:

- coordinate multiple systems to complete one product action

### Type 3. Infrastructure adapter code

Examples:

- `src/lib/db.ts`
- `src/lib/r2.ts`
- `src/lib/polar.ts`
- `src/lib/chatterbox-client.ts`

Job:

- hide service setup details behind clean local APIs

### Type 4. Operational support code

Examples:

- seed script
- API sync script
- instrumentation configs

Job:

- keep the whole system maintainable over time

If you can classify any file into one of those four buckets, the repo becomes much easier to reason about.

---

## Appendix BR. Final Non-UI Closing Summary

This repository is a multi-system SaaS backend wrapped in a Next.js application.

Its core job is to take authenticated organization-scoped requests, validate them, enforce billing rules, persist metadata, store private media, call an external inference service, and safely expose results back to the user.

The most important non-UI truths of the repo are:

- identity comes from Clerk
- tenant isolation is enforced with org-aware logic
- persistence is split between PostgreSQL metadata and R2 media
- monetization is enforced and metered through Polar
- heavy inference is delegated to a Python Modal service
- Sentry provides the visibility needed to operate the system

If a beginner fully understands those points, they understand the real backbone of Resonance.
