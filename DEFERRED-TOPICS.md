# Aether UI: Deferred Topics & Progress Tracker

**Last Updated:** 2026-03-26

---

## Project Status: PAPER PREPARATION PHASE

The core framework is functional. Focus has shifted to documentation and academic paper preparation.

---

## Completed Work

### Core Framework
- [x] Kernel implementation (868B gzipped)
- [x] Orchestrator implementation (414B gzipped)
- [x] Web component adapter (`<aether-runtime>`)
- [x] SSE streaming infrastructure
- [x] Phase system (reflex, deliberation, complete, ghost)
- [x] Slot-based content projection
- [x] CSS variable injection

### Examples
- [x] EDS Leapfrog (flagship React vs Aether comparison)
- [x] Weather demo (snap-in coexistence)
- [x] Dashboard (multi-agent UI)
- [x] Chat (streaming UI)
- [x] Net-new (pure Aether)
- [x] Project Overview page

### Benchmarks
- [x] Playwright benchmark script (`benchmarks/eds-leapfrog-benchmark.js`)
- [x] Benchmark data captured (`paper/data/eds-leapfrog-benchmark-2026-03-26.json`)
- [x] Results: 3.6x FCP improvement (416ms vs 1504ms)

### Documentation
- [x] README.md (repositioned: execution model, not optimization)
- [x] PAPER-ORCHESTRATION-BRIEF.md (755 lines, paper-ready)
- [x] project-overview.html (aligned with positioning)
- [x] CLAUDE.md (development context)
- [x] docs/ARCHITECTURE.md
- [x] docs/API.md
- [x] docs/ADAPTER.md
- [x] docs/EDS.md

---

## In Progress

### Paper Preparation
- [ ] Tech spec paper draft (`paper/main.tex`)
- [ ] Formal methodology section
- [ ] Production benchmark data (vs development server)
- [ ] Peer review / technical validation

---

## Deferred Topics

### Technical Enhancements

| Topic | Priority | Notes |
|-------|----------|-------|
| Production build benchmarks | HIGH | Current data is dev server only; production would show true JS payload difference |
| Error handling / graceful degradation | MEDIUM | What happens when SSE connection drops? |
| Reconnection logic | MEDIUM | Auto-reconnect with exponential backoff |
| Multiple namespace support | LOW | Orchestrating multiple `<aether-runtime>` instances |
| TypeScript definitions | LOW | `.d.ts` files for kernel/orchestrator |
| Unit test suite | MEDIUM | Jest/Vitest tests for kernel |

### Integration Modes (Documented but not demoed)

| Mode | Status | Notes |
|------|--------|-------|
| Snap-In | Demoed | Weather example |
| Jump-In | Documented | Needs dedicated example |
| Net-New | Demoed | Pure Aether example |
| Capsule Plugin | Spec'd | Needs Aether Capsule integration demo |

### Paper Sections to Address

| Section | Status | Deferred Reason |
|---------|--------|-----------------|
| Section 6: Empirical Validation | NEEDS WORK | Need production benchmarks |
| Section 7: Limitations | DRAFT | Need more edge case analysis |
| LiveView/HTMX comparison table | READY | In brief, needs paper formatting |
| Multi-agent orchestration theory | IDEA | Complex topic, may be future work |

### Ideas for Future Exploration

1. **Offline fallback mode**
   - Cache last-known state
   - Service worker integration
   - Status: IDEA (conflicts with real-time nature)

2. **Binary protocol option**
   - MessagePack or CBOR instead of JSON
   - Potential latency reduction
   - Status: IDEA (JSON is human-debuggable)

3. **Bidirectional communication**
   - User input events back to agent
   - Form handling patterns
   - Status: IDEA (currently read-only projection)

4. **Multi-tenant orchestration**
   - Multiple agents projecting to same surface
   - Conflict resolution
   - Status: IDEA (complex coordination)

5. **DevTools extension**
   - Visualize SSE stream
   - Slot inspection
   - Phase timeline
   - Status: IDEA (nice-to-have)

---

## Decisions Made

### Positioning (2026-03-26)
**Decision:** Frame Aether as "projection-based execution model" NOT "faster framework"

**Rationale:**
- Performance is supporting evidence, not primary claim
- Differentiates from optimization-focused competitors
- Aligns with agent-first architecture vision
- Avoids benchmark wars

**Anchor statement:** "Aether does not optimize rendering. It eliminates the need for a client-side rendering engine."

### LiveView/HTMX Differentiation
**Decision:** Explicitly contrast with LiveView/HTMX as "projection, not synchronization"

**Key differences:**
- No server-side DOM
- No diffing
- No component tree
- Continuous projection vs request-response

---

## Blocking Issues

*None currently*

---

## Questions to Resolve

1. **Paper venue?** - Academic conference, arXiv preprint, or blog post?
2. **Open source timing?** - When to publicize beyond current repo?
3. **Capsule integration demo** - Need working Aether Capsule to demonstrate plugin mode

---

## Session Handoff Notes

When resuming work, start with:
1. Read this file for context
2. Read `PAPER-ORCHESTRATION-BRIEF.md` for paper details
3. Read `README.md` for positioning
4. Run `npm run dev` to start development server
5. Visit `http://localhost:5173/examples/eds-leapfrog/side-by-side.html` for flagship demo

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-26 | Created deferred-topics.md |
| 2026-03-26 | Repositioned all docs to "execution model" framing |
| 2026-03-26 | Captured benchmark data (3.6x FCP improvement) |
| 2026-03-26 | Created PAPER-ORCHESTRATION-BRIEF.md |
