# Goatshed

Goatshed is a Nuxt + Mastra project with an authenticated `/clone` chat experience, conversation history, and user impression/favorability tracking.

## Production Database Recommendation

For production, use a **managed PostgreSQL** database (for example Neon, Supabase, or AWS RDS).

### Why PostgreSQL

- Conversation history and impression/favorability data need durable storage across deploys/restarts.
- Multiple app instances require shared, consistent storage.
- PostgreSQL provides strong reliability, backups, and good scaling options.

### Avoid in production

- Local file storage such as `file:./mastra.db` for shared multi-instance workloads.
- Ephemeral/local runtime storage for critical chat data.

### Suggested direction

1. Use PostgreSQL for both Mastra storage and application data (history/impressions).
2. Keep credentials in environment variables.
3. Add routine backups and basic retention policies.

## Development

```bash
npm run dev
npm run build
```
