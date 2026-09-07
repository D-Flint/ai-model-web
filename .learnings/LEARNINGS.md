## [LRN-20260907-001] correction

**Logged**: 2026-09-07
**Priority**: medium
**Status**: pending
**Area**: backend

### Summary
LiveBench includes an Agentic Coding category; local ingestion omitted its field.

### Details
Initial diagnosis incorrectly stated that LiveBench had no Agentic Coding score. Current `livebenchData.json` and `liveBenchRowSchema` omit `agentic_coding`, while `ModelExplorer.tsx` hardcodes its value to `null`.

### Suggested Action
Add `agentic_coding` to the LiveBench fixture/schema, ingest it as the agentic metric, and verify release provenance before publication.

### Metadata
- Source: conversation
- Related Files: src/pipeline/types.ts, src/pipeline/livebench.ts, src/components/ModelExplorer.tsx
- Tags: livebench, agentic-coding, correction

---
