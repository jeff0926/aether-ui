# Aether UI

**Zero-hydration UI projection for agent-driven systems.**

---

## The Idea

What if UI rendering didn’t happen in the browser at all?

Aether UI introduces a projection-based execution model where the agent computes the interface and the browser simply displays it.

```
Traditional:  Server → JS Bundle → Parse → Hydrate → VDOM → Reconcile → DOM
Aether:       Agent  → Sliver    → SSE   → Kernel  → textContent        → DOM
```

The browser is not an application runtime.
It is a **projection surface**.

---

## What This Actually Changes

Aether is not a faster framework. It is a different execution model.

| Traditional Frameworks          | Aether                        |
| ------------------------------- | ----------------------------- |
| Client computes UI              | Agent computes UI             |
| Hydration required              | No hydration                  |
| Component lifecycle             | No lifecycle                  |
| Virtual DOM reconciliation      | No structural reconciliation  |
| Client-side state for rendering | No client state for display   |
| Large runtime in browser        | Minimal runtime (868B kernel) |

> Aether does not optimize rendering. It eliminates the need for a client-side rendering engine.

This is a different execution model, not an optimization.

---

## Start Here (Flagship Demo)

If you only look at one thing, look at this.

```bash
git clone https://github.com/jeff0926/aether-ui.git
cd aether-ui && npm install && npm run dev
```

Open:

http://localhost:5173/examples/eds-leapfrog/side-by-side.html

This demonstrates:

* Identical UI (Adobe EDS blocks)
* React vs Aether
* Hydration vs projection
* Elimination of client-side execution

---

## Quick Start

**1. Include the kernel:**

```html
<script src="dist/aether-kernel.min.js"></script>
```

**2. Define projection slots:**

```html
<aether-runtime endpoint="/api/sse" namespace="alerts">
  <h3 data-aether-slot="title"></h3>
  <p data-aether-slot="body"></p>
</aether-runtime>

<script type="module" src="src/adapter/web-component.js"></script>
```

**3. Stream UI from the server:**

```javascript
{
  "phase": "deliberation",
  "vars": { "--accent-color": "#dc2626" },
  "content": { "title": "Alert", "body": "Message here" }
}
```

The kernel injects slot content and applies CSS variables. No parsing, no diffing, no reconciliation.

---

## How This Differs from LiveView / HTMX

Aether does not synchronize a DOM. It projects UI state.

| LiveView / HTMX            | Aether                           |
| -------------------------- | -------------------------------- |
| Server maintains DOM       | No server-side DOM               |
| Diffs sent to client       | No diffing                       |
| Component tree exists      | No component tree                |
| HTML fragments             | Slot content + CSS variables     |
| Request-response updates   | Continuous projection via SSE    |
| UI unaware of system state | Agent cognition drives UI phases |

The SSE stream carries:

* **phase** — system state (`reflex`, `deliberation`, `complete`, `ghost`)
* **vars** — visual state (CSS properties)
* **content** — slot content

The kernel applies these directly to the DOM.

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

**Phases reflect system state:**

* `reflex` — immediate response
* `deliberation` — processing
* `complete` — final state
* `ghost` — degraded or uncertain state

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

This is the entire client-side execution surface.

---

## Preliminary Benchmarks (Development Environment)

Measured against React 18 + EDS blocks (Playwright/Chromium, n=10, development server).

| Metric                 | React 18  | Aether |
| ---------------------- | --------- | ------ |
| First Contentful Paint | 1,504 ms  | 416 ms |
| DOM Interactive        | 1,475 ms  | 402 ms |
| Runtime Size (gzipped) | 80–200 KB | 868 B  |

These measurements illustrate the impact of eliminating hydration and client-side execution.
Production characteristics may differ.

See `paper/data/eds-leapfrog-benchmark-2026-03-26.json` for methodology.

---

## Core Insight

If the server can compute the UI state, the browser does not need to reconstruct it.

It only needs to display it.

Aether removes the need for a client-side rendering engine entirely.

---

## Dual-Mode Operation

**Standalone:** Works with any SSE-capable backend (Node, Python, Go, Edge).

**Capsule Plugin:** Projection layer for Aether Capsule agents.

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

Capsules compute UI. The host provides the projection surface.

---

## Examples

| Example      | Description                         |
| ------------ | ----------------------------------- |
| eds-leapfrog | Flagship React vs Aether comparison |
| weather      | Snap-in coexistence                 |
| dashboard    | Multi-agent UI                      |
| chat         | Streaming UI                        |
| net-new      | Pure Aether                         |

---

## Documentation

* docs/ARCHITECTURE.md — execution model
* docs/API.md — kernel and orchestrator
* docs/ADAPTER.md — integration modes
* docs/EDS.md — design system integration

---

## When to Use

**Good fit:**

* Real-time displays
* Agent-driven UI
* Dashboards and monitoring
* Streaming interfaces
* Notifications

**Not a fit:**

* Complex client-side state machines
* Heavy form interaction workflows
* Offline-first applications

---

## Research

**Paper:** *Semantic Projection: Zero-Hydration UI for Agentic Systems*

See `paper/main.tex`.

---

## License

MIT

---

<p align="center">
  <em>The browser is a projection surface.</em>
</p>
