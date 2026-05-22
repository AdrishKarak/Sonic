# Security Policy

## Overview
Resonance is committed to providing a secure platform for text-to-speech and voice cloning. This document outlines our security practices and how to report vulnerabilities.

## Security Practices

### Authentication & Authorization
- **Clerk:** We use Clerk for all authentication. Session tokens are managed securely by Clerk.
- **tRPC Procedures:** All sensitive data access is guarded by `authProcedure` or `orgProcedure`.
- **Organization Isolation:** Data is strictly isolated by `orgId`. Every database query and storage request must include an `orgId` check.

### Data Protection
- **Cloudflare R2:** All media (voice samples and generations) is stored in private R2 buckets.
- **Signed URLs:** Access to R2 objects is granted via short-lived pre-signed URLs, ensuring media is never publicly accessible without authorization.
- **Input Validation:** We use Zod for rigorous schema validation on all API inputs to prevent injection and malformed data attacks.

### Secret Management
- **Environment Variables:** Secrets (API keys, DB URLs, etc.) are managed via environment variables and validated at runtime using `@t3-oss/env-nextjs`.
- **Modal Secrets:** Secrets required by the TTS engine (e.g., Hugging Face tokens, R2 credentials) are stored and injected via Modal's built-in Secret management.

### Monitoring
- **Sentry:** We use Sentry for real-time error tracking and performance monitoring. Sensitive data (like PII) should be filtered out before being sent to Sentry.

## Reporting a Vulnerability
If you discover a security vulnerability, please do not open a public issue. Instead, report it privately.

### Process
1. Send an email to [adrishkarak@gmail.com](mailto:adrishkarak@gmail.com) 
2. Include a detailed description of the vulnerability.
3. Provide steps to reproduce the issue.
4. We will acknowledge your report within 48 hours and work with you to resolve it.

## Secure Coding Guidelines
- Never log or print secrets or PII.
- Always use the `orgId` from the tRPC context; never trust an `orgId` provided directly in the procedure input unless explicitly required and validated against the session.
- Keep dependencies updated using `npm audit` and automated tools.
- Use `readonly` for Prisma queries where possible to prevent accidental mutations.
