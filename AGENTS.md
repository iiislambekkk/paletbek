<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENTS.md — Paletbek

## Project

Paletbek is a pharmacy warehouse application for quickly finding products stored on pallets.

Each product has a name, series, and one or more pallet locations. Example address: `P-1-2-3/1` (storage area, row, level, section, pallet number).

Users should be able to search products, add new ones, and update their series and locations directly from search results.

Stack: Next.js, TypeScript, Prisma, PostgreSQL, Better Auth, shadcn/ui, Tailwind CSS, pnpm.

## UI/UX — Highest Priority

- **Mobile-first.** The application is primarily used on smartphones inside a warehouse.
- Prioritize speed, simplicity, accessibility, and one-handed usability.
- Minimize taps required to search, find, or update a product.
- Make search fast, prominent, and convenient.
- Keep product names, series, and pallet addresses clearly readable.
- **Use shadcn/ui and Tailwind CSS wherever possible.**
- **Always implement and support both light and dark themes.**
- Ensure all pages, components, and UI states look polished and remain readable in both themes.
- Use semantic theme tokens instead of hardcoded colors.
- Follow the system theme by default and provide a theme switcher.
- Prefer existing UI components and design tokens over custom implementations.
- Maintain a polished, consistent, responsive interface.
- You have creative freedom over layouts, interactions, navigation, and visual design.

## Database — Strict Restrictions

- **NEVER connect to or interact with any database**, including development and test databases.
- NEVER execute SQL, apply migrations, run seeds, use Prisma Studio, or perform `db push`, `db pull`, or `db reset`.
- You MAY edit Prisma schemas, create migration files, and write seed scripts.
- You MAY run `prisma generate`, `prisma format`, and offline schema validation.
- **Only the user executes database-changing commands.**
- After schema changes, provide the exact commands the user must run manually.
- Never execute database-changing commands, even if the task requires them.

## Testing — Strict Restrictions

- **NEVER run E2E tests, browser automation, or use browsers or sandbox environments.**
- Do not use Playwright, Puppeteer, browser MCP, Docker, or cloud browsers.
- Do not start development servers or run the application.
- Only static checks are permitted, such as TypeScript, ESLint, and formatting.
- Do not run builds or runtime tests.
- Do not claim runtime functionality has been verified.

## Authentication

- Better Auth with email/password only.
- No public registration or email verification.
- Initial SUPER_ADMIN is created through a seed script.
- Only SUPER_ADMIN can manage users.
- Enforce authorization on the server.

## Development Principles

- Follow existing project conventions.
- Prefer clean, maintainable, type-safe code.
- Avoid unnecessary dependencies and overengineering.
- Make independent implementation decisions without asking for approval on minor details.
- Preserve creative freedom in architecture, UX, and implementation.
- Keep tool usage, file reads, and output concise to conserve tokens.

## Communication

- Respond in Russian.
- Briefly summarize changes and static checks.
- When database changes are involved, **always provide manual migration commands**.
- Mention limitations only when relevant.
- Avoid lengthy explanations unless requested.

<!-- END:nextjs-agent-rules -->
