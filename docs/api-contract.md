# CRICZONE — API Contract

> Stub. Filled in by Planning Agent during Phase 4.

Every server action:
1. Zod-validates input
2. Calls `requireAdmin()` (admin-only routes)
3. Re-checks business rules server-side
4. Runs atomic RPC for multi-table writes
5. Returns `{ ok: boolean, error?: { code, message } }`