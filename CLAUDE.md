# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A text-to-speech (TTS) service that processes audio generation requests through Modal and stores audio files in S3. Features include voice selection, generation settings, and audio preview.

## Project Structure

```
src/
├── app/                   # Next.js App Router pages and layouts
├── components/            # Shared UI components (shadcn/ui)
├── features/              # Feature-based modules
│   └── text-to-speech/   # TTS feature
│       ├── components/    # TTS-specific components
│       └── hooks/        # TTS-specific hooks
├── lib/                   # Shared utilities (cn() helper in utils.ts)
└── db/                    # Database schema and migrations

public/                    # Static assets (SVGs, icons)

prisma/                    # Database schema and migrations
```

## Build & Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Create production build
npm run start    # Serve production build
npm run lint     # Run ESLint (main quality gate)
```

## Coding Conventions

- **TypeScript** with strict mode
- **`.tsx`** for React components
- **PascalCase** for React components
- **camelCase** for functions and variables
- **Lowercase** route segment names: `src/app/about/page.tsx`
- **Double quotes** and semicolons in app files
- **tRPC** for API communication
- **Zod** for validation
- Use `@/*` import alias from `tsconfig.json`

## Styling

- Tailwind utility classes
- Global theme tokens in `src/app/globals.css`

## Testing

Before opening a PR:
- Run `npm run lint`
- Run `npm run build`

## Prisma Commands

```bash
npx prisma generate       # Generate Prisma client
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed database
```

## Commit Style

Brief, sentence-style commit messages:
- `feat: add voice selection dropdown`
- `fix: resolve audio preview loading state`

## Core Models

1. **Voice** - Voice profiles with categories and variants
2. **Generation** - Audio generation requests with parameters

## Architecture

```
User → Next.js API → Modal (TTS) → S3 → Response URL
```
