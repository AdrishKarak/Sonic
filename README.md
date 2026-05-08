# Resonance

A text-to-speech (TTS) service that processes audio generation requests through Modal and stores audio files in S3.

## Tech Stack

- **Next.js 16** with App Router and TypeScript
- **Clerk** for authentication
- **Prisma** with PostgreSQL for data persistence
- **Modal** for TTS processing
- **S3** for audio file storage
- **Tailwind CSS** and **shadcn/ui** for styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

## Environment Variables

Configure the following environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- Additional variables for S3 and Modal integration

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Shared UI components (shadcn/ui)
├── lib/              # Shared utilities
├── hooks/            # Custom React hooks
├── generated/        # Prisma client generated files
└── db/               # Database schema and migrations

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## Data Flow

User → Next.js API → Modal (TTS) → S3 → Response URL
