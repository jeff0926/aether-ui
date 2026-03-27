# Aether UI

**868-byte zero-hydration UI runtime. Project interfaces from agent intelligence.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/gzipped-868B-brightgreen.svg)](#bundle-size)

---

## The Idea

What if the browser didn't need to run your framework? What if it just... displayed what you sent it?

Aether UI inverts the traditional frontend paradigm. Instead of shipping JavaScript bundles to hydrate virtual DOM trees, we **project** pre-computed HTML slivers via Server-Sent Events to a minimal kernel.

```
Traditional:  Server → JS Bundle → Parse → Hydrate → VDOM → Reconcile → DOM
Aether:       Agent  → Sliver    → SSE   → Kernel  → textContent        → DOM
```

The browser is not an application runtime. It's a **projection surface**.

---

## Measured Performance

Benchmarked against React 18 + EDS blocks (10 iterations, Playwright/Chromium):

| Metric | React 18 | Aether UI | Improvement |
|--------|----------|-----------|-------------|
| First Contentful Paint | 1,504 ms | 416 ms | **3.6x faster** |
| DOM Interactive | 1,475 ms | 402 ms | **3.7x faster** |
| Kernel Size (gzipped) | 80-200 KB | **868 B** | **92-230x smaller** |

*See `paper/data/eds-leapfrog-benchmark-2026-03-26.json` for full methodology.*

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

That's the entire runtime. No dependencies. No build step required.

---

## Quick Start

**1. Include the kernel (868 bytes gzipped):**
```html
<script src="https://unpkg.com/aether-ui/dist/aether-kernel.min.js"></script>
```

**2. Add a runtime with slots:**
```html
<aether-runtime endpoint="/api/sse" namespace="alerts">
  <div class="alert">
    <h3 data-aether-slot="title">Loading...</h3>
    <p data-aether-slot="body"></p>
  </div>
</aether-runtime>

<script type="module" src="https://unpkg.com/aether-ui/src/adapter/web-component.js"></script>
```

**3. Stream content from any SSE endpoint:**
```javascript
// Your server sends:
{
  "phase": "deliberation",
  "vars": { "--accent-color": "#dc2626" },
  "content": { "title": "Heat Warning", "body": "Temperature exceeding 95°F" }
}
```

The kernel injects `content` into matching `data-aether-slot` elements and applies `vars` as CSS custom properties. That's it.

---

## How It Works

### The Kernel (868B)

Four responsibilities, nothing more:

1. **SSE Connection** — EventSource to your endpoint, auto-reconnect with backoff
2. **CSS Injection** — `vars` applied via `element.style.setProperty()`
3. **Slot Hydration** — `content` injected via `textContent` (XSS-safe)
4. **Focus Preservation** — Saves/restores `activeElement` across updates

### The Orchestrator (+414B, optional)

Multi-agent coordination for complex UIs:

```javascript
const orchestrator = AetherOrchestrator.getInstance();
orchestrator.register('weather', weatherKernel);
orchestrator.register('traffic', trafficKernel);

// Broadcast to all agents
orchestrator.broadcast({ '--theme': 'dark' });

// Share state across agents
orchestrator.setState('user-location', { lat: 37.7749, lng: -122.4194 });
```

---

## Integration Modes

### Snap-In (Coexist with React/Vue/Angular)
```html
<!-- Your existing React app -->
<div id="react-root">...</div>

<!-- Aether handles this part -->
<aether-runtime endpoint="/api/notifications" namespace="alerts">
  <div data-aether-slot="message"></div>
</aether-runtime>
```

### Jump-In (Replace a component)
```javascript
const adapter = new AetherAdapter();
adapter.jumpIn('react-dashboard', {
  endpoint: '/api/sse',
  namespace: 'dashboard',
  transformer: (props) => ({ cpu: props.metrics.cpu })
});
```

### Net-New (Pure Aether, no framework)
```html
<!DOCTYPE html>
<html>
<head>
  <script src="aether-kernel.min.js"></script>
</head>
<body>
  <aether-runtime endpoint="/api/sse" namespace="app">
    <!-- Your entire UI here -->
  </aether-runtime>
</body>
</html>
```

---

## Live Examples

```bash
git clone https://github.com/jeff0926/aether-ui.git
cd aether-ui && npm install && npm run dev
```

Then open http://localhost:5173/examples/

| Example | Mode | Description |
|---------|------|-------------|
| [weather/](examples/weather/) | Snap-In | React + Aether coexistence |
| [jump-in/](examples/jump-in/) | Jump-In | Replace React component |
| [net-new/](examples/net-new/) | Net-New | Pure Aether, no framework |
| [dashboard/](examples/dashboard/) | Multi-Agent | Three agents sharing state |
| [chat/](examples/chat/) | Streaming | Character-by-character SSE |
| [eds-leapfrog/](examples/eds-leapfrog/) | **Flagship** | Adobe EDS comparison demo |

### EDS Leapfrog Demo

Our flagship demonstration compares Aether to Adobe's React+EDS pipeline:

- **[Adobe Way](examples/eds-leapfrog/adobe-way.html)** — React 18 + Babel + EDS blocks
- **[Aether Way](examples/eds-leapfrog/aether-way.html)** — 868B kernel + same EDS blocks
- **[Side-by-Side](examples/eds-leapfrog/side-by-side.html)** — Split-screen comparison

Same visual output. 3.6x faster. 92x smaller.

---

## SSE Message Format

```typescript
interface Pulse {
  phase: 'reflex' | 'deliberation' | 'complete' | 'ghost';
  vars?: Record<string, string>;    // CSS custom properties
  content?: Record<string, string>; // Slot content
}
```

**Phases:**
- `reflex` — Immediate response (fast transitions)
- `deliberation` — Processing/thinking (medium transitions)
- `complete` — Final state
- `ghost` — Degraded/fallback mode

---

## Dual-Mode Architecture

Aether UI operates in two modes:

### 1. Standalone
Run independently with any SSE-capable backend (Node, Python, Go, Rust, Edge Functions).

### 2. Capsule Plugin
Integrate as the projection layer for [Aether Capsule](https://github.com/jeff0926/aether-capsule) agents:

```javascript
// Capsule manifest
{
  "capsule": "weather-expert",
  "projection": {
    "type": "aether-ui",
    "endpoint": "/capsules/weather/sse",
    "slots": ["condition", "temperature", "forecast"]
  }
}
```

Capsules own their UI. The host application just provides the projection surface.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, three-layer model |
| [docs/API.md](docs/API.md) | Kernel, Orchestrator, Web Component API |
| [docs/ADAPTER.md](docs/ADAPTER.md) | Framework integration modes |
| [docs/EDGE.md](docs/EDGE.md) | Cloudflare Workers, Vercel Edge |
| [docs/BENCHMARKS.md](docs/BENCHMARKS.md) | Performance methodology |
| [docs/EDS.md](docs/EDS.md) | Adobe EDS integration |

---

## When to Use Aether

**Good fit:**
- Real-time dashboards and monitoring
- Live notifications and alerts
- Streaming chat interfaces
- Agent-owned UI projections
- Performance-critical widgets
- Edge-first applications

**Not a fit:**
- Heavy form interactions (use React)
- Complex client-side state machines
- Offline-first applications
- When you need React's ecosystem

---

## Philosophy

> "UI is not built. It is manifested from agent intelligence."

Traditional frameworks exist because:
1. Browsers couldn't efficiently update DOM
2. Developers needed component abstractions
3. State management required reconciliation

Aether's insight: **If the server can pre-compute the final DOM state, none of these steps are necessary.**

The browser just needs HTML. Aether gives it HTML.

---

## Research

**Paper:** "Semantic Projection: Zero-Hydration UI for Agentic Systems"

```
paper/
├── main.tex              # LaTeX source
├── data/                 # Benchmark data
└── figures/              # Architecture diagrams
```

*In preparation for arXiv submission, 2026.*

---

## License

MIT

---

## Contributing

Issues and PRs welcome at [github.com/jeff0926/aether-ui](https://github.com/jeff0926/aether-ui).

---

<p align="center">
  <strong>868 bytes. Zero hydration. Infinite possibilities.</strong>
</p>
