# Aether UI

**Zero-hydration UI projection for agent systems.**

---

## The Idea

What if UI rendering didn't happen in the browser at all?

Aether UI is a projection-based execution model. The agent computes the UI. The browser displays it.

```
Traditional:  Server → JS Bundle → Parse → Hydrate → VDOM → Reconcile → DOM
Aether:       Agent  → Sliver    → SSE   → Kernel  → textContent        → DOM
```

The browser is not an application runtime. It's a **projection surface**.

---

## What This Actually Changes

Aether is not a faster framework. It's a different execution model.

| Traditional Frameworks | Aether |
|------------------------|--------|
| Client computes UI | Agent computes UI |
| Hydration required | No hydration |
| Component lifecycle | No lifecycle |
| Virtual DOM reconciliation | No reconciliation |
| Client-side state for rendering | No client state |
| Runtime in browser | No runtime (868B kernel) |

> Aether does not optimize rendering. It eliminates it.

This is a different execution model, not an optimization.

---

## Start Here (Flagship Demo)

If you only look at one thing, look at this:

```bash
git clone https://github.com/jeff0926/aether-ui.git
cd aether-ui && npm install && npm run dev
```

Open: **http://localhost:5173/examples/eds-leapfrog/side-by-side.html**

This shows React and Aether rendering the same EDS blocks side-by-side, receiving the same SSE stream.

---

## Quick Start

**1. Include the kernel:**
```html
<script src="dist/aether-kernel.min.js"></script>
```

**2. Add slots:**
```html
<aether-runtime endpoint="/api/sse" namespace="alerts">
  <h3 data-aether-slot="title"></h3>
  <p data-aether-slot="body"></p>
</aether-runtime>

<script type="module" src="src/adapter/web-component.js"></script>
```

**3. Stream from server:**
```javascript
{
  "phase": "deliberation",
  "vars": { "--accent-color": "#dc2626" },
  "content": { "title": "Alert", "body": "Message here" }
}
```

The kernel injects content into slots and applies CSS variables. Nothing else runs.

---

## How This Differs from LiveView / HTMX

Aether is not server-rendered HTML synchronization. It's projection.

| LiveView / HTMX | Aether |
|-----------------|--------|
| Server maintains DOM | No server-side DOM |
| Diffs sent to client | No diffing |
| Component tree on server | No component tree |
| HTML fragments | CSS variables as state carrier |
| Request-response | Agent cognition → phases |
| Error = broken UI | Verification → ghost mode |

The SSE message carries **phase** (reflex, deliberation, complete, ghost), **vars** (CSS properties), and **content** (slot text). The kernel applies them directly. No parsing. No diffing. No tree.

This is projection, not synchronization.

---

## SSE Message Format

```typescript
interface Pulse {
  phase: 'reflex' | 'deliberation' | 'complete' | 'ghost';
  vars?: Record<string, string>;
  content?: Record<string, string>;
}
```

**Phases reflect agent cognition:**
- `reflex` — immediate response
- `deliberation` — thinking/processing
- `complete` — final state
- `ghost` — degraded/fallback

---

## Bundle Size

```
┌─────────────────────┬──────────┬──────────┐
│ Component           │ Raw      │ Gzipped  │
├─────────────────────┼──────────┼──────────┤
│ Kernel              │ 2,208 B  │ 868 B    │
│ Orchestrator        │ 837 B    │ 414 B    │
├─────────────────────┼──────────┼──────────┤
│ Total               │ 3,045 B  │ 1,282 B  │
└─────────────────────┴──────────┴──────────┘
```

This is not a minified framework. This is the entire execution surface.

---

## Preliminary Benchmarks (Development Environment)

Measured against React 18 + EDS blocks. Development server, n=10, Playwright/Chromium.

| Metric | React 18 | Aether |
|--------|----------|--------|
| First Contentful Paint | 1,504 ms | 416 ms |
| DOM Interactive | 1,475 ms | 402 ms |
| Kernel Size (gzipped) | 80-200 KB | 868 B |

These are preliminary measurements in a development environment. Production characteristics may differ. See `paper/data/eds-leapfrog-benchmark-2026-03-26.json` for methodology.

---

## Core Insight

If the server can compute what the UI should be, the browser only needs to display it. No parsing. No compilation. No reconciliation. No state management. Just projection.

---

## Dual-Mode Operation

**Standalone:** Works with any SSE-capable backend (Node, Python, Go, Edge Functions).

**Capsule Plugin:** Projection layer for Aether Capsule agents. Capsules own their UI. The host provides the surface.

```javascript
{
  "capsule": "weather-expert",
  "projection": {
    "type": "aether-ui",
    "endpoint": "/capsules/weather/sse",
    "slots": ["condition", "temperature"]
  }
}
```

---

## Examples

| Example | Description |
|---------|-------------|
| [eds-leapfrog/](examples/eds-leapfrog/) | Flagship: React vs Aether comparison |
| [weather/](examples/weather/) | Snap-in: coexist with React |
| [dashboard/](examples/dashboard/) | Multi-agent orchestration |
| [chat/](examples/chat/) | Streaming text |
| [net-new/](examples/net-new/) | Pure Aether, no framework |

---

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Execution model
- [docs/API.md](docs/API.md) — Kernel and Orchestrator
- [docs/ADAPTER.md](docs/ADAPTER.md) — Integration modes
- [docs/EDS.md](docs/EDS.md) — Design system integration

---

## When to Use

**Good fit:** Real-time displays, agent UIs, dashboards, notifications, streaming interfaces.

**Not a fit:** Heavy form interactions, complex client state machines, offline-first apps.

---

## Research

**Paper:** "Semantic Projection: Zero-Hydration UI for Agentic Systems"

In preparation. See `paper/main.tex`.

---

## License

MIT

---

<p align="center">
  <em>The browser is a projection surface.</em>
</p>
