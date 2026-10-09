# CRICZONE — Architecture

> Stub. Filled in by Planning Agent during Phase 4.

## Multi-tenancy
Every entity belongs to exactly one `tournament`. Realtime channels are scoped per tournament.
Two or more tournaments can run live simultaneously with fully isolated state.

## Realtime contract
- Client subscribes ONCE per tournament channel.
- Server sets final state; client drives shuffle animation locally (no polling).