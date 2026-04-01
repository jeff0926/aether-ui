# Aether UI

**Zero-hydration UI projection for agent-driven systems.**

No hydration. No bundle. No interpretation layer.

---

## Proof: Canonical Demo

Run this, then decide:

```bash
git clone https://github.com/jeff0926/aether-ui.git
cd aether-ui && npm install && npm run dev
```

Open: http://localhost:5173/examples/eds-leapfrog/side-by-side.html

**What you'll see:**

| Metric                 | React 18   | Aether   | Difference |
| ---------------------- | ---------- | -------- | ---------- |
| First Contentful Paint | 1,504 ms   | 416 ms   | **3.6×**   |
| Runtime Size (gzipped) | 80–200 KB  | 868 B    | **~200×**  |
| Hydration              | Required   | None     | Eliminated |
| Interpretation Layers  | 3          | 0        | Eliminated |

```
React:   Agent → JSON → React → VDOM → UI   (3 interpretation layers)
Aether:  Agent → UI                         (0 interpretation layers)
```

**What the agent sends = what the user sees.**

Benchmark data: `paper/data/eds-leapfrog-benchmark-2026-03-26.json`

---

## Proof: Visual UI System

Live demos showing phase-aware, CSS-only visual behavior:

| Demo | Path | What It Proves |
|------|------|----------------|
| **Alerts** | `/examples/ui/alert.html` | 4 SSE-driven status notifications |
| **Metrics** | `/examples/ui/metrics.html` | 6 live telemetry cards with deltas |
| **Dashboard** | `/examples/ui/dashboard.html` | Multi-slot composition (header, sidebar, main) |

All demos demonstrate:
- Live SSE updates
- Phase transitions: `reflex` → `deliberation` → `complete`
- CSS-only visual behavior (NO JavaScript logic)
- Progressive enhancement (works without JS)

---

## Proof: Payload Discipline

Every SSE payload in this repo uses only:

```typescript
interface Pulse {
  phase: 'reflex' | 'deliberation' | 'complete' | 'ghost';
  vars?: Record<string, string>;   // CSS variables
  content?: Record<string, string>; // Slot content
}
```

**Audit Results:**

| Category | Count |
|----------|-------|
| Namespaces Audited | 20 |
| Passing | 20 |
| Failing | 0 |
| **Pass Rate** | **100%** |

**Forbidden (and absent):**
- UI schemas
- Component descriptors
- Layout JSON
- Render instructions
- Type hints
- Structural metadata

Full audit: `WS6-PAYLOAD-AUDIT.md`

---

## Core Principles

Aether is not a faster framework. It is a different execution model.

| What We Removed | Why |
|-----------------|-----|
| UI schemas | Agent computes final HTML, not schema for client to interpret |
| Component JSON | No `{ "type": "Alert", "props": {...} }` for client to render |
| Mapping layers | No JSON → Component → VDOM → DOM pipeline |
| Frontend decision logic | Browser displays, it does not decide |

The browser is a **projection surface**, not an application runtime.

---

## Quick Start

**1. Copy the kernel (868 bytes gzipped):**

```html
<script src="dist/aether-kernel.min.js"></script>
```

**2. Create slots:**

```html
<aether-runtime endpoint="/api/sse" namespace="alerts">
  <h3 data-aether-slot="title"></h3>
  <p data-aether-slot="body"></p>
</aether-runtime>

<script type="module" src="src/adapter/web-component.js"></script>
```

**3. Emit a Pulse from your server:**

```javascript
// SSE event
event: alerts
data: {"phase":"complete","content":{"title":"Alert","body":"Message"}}
```

The kernel injects slot content and applies CSS variables. No parsing, no diffing, no reconciliation.

---

## Phase System

Phases reflect agent cognitive state:

| Phase | Meaning | CSS Behavior |
|-------|---------|--------------|
| `reflex` | Immediate response | Fast animation (0.15s) |
| `deliberation` | Processing | Pulsing border, thinking bar |
| `complete` | Final state | Subtle scale, green dot |
| `ghost` | Degraded/uncertain | Grayscale, reduced opacity |

All phase behavior is **CSS-only**. The kernel sets `data-phase` attribute; CSS selectors handle visuals.

```css
[data-phase="deliberation"]::before {
  content: '';
  animation: thinking-bar 1.5s ease-in-out infinite;
}
```

---

## Bundle Size

```
┌─────────────────────┬──────────┬──────────┐
│ Component           │ Raw      │ Gzipped  │
├─────────────────────┼──────────┼──────────┤
│ Kernel              │ 2,267 B  │ 868 B    │
│ Orchestrator        │ 837 B    │ 414 B    │
├─────────────────────┼──────────┼──────────┤
│ Total               │ 3,104 B  │ 1,282 B  │
└─────────────────────┴──────────┴──────────┘
```

This is the entire client-side execution surface.

---

## Progressive Enhancement

With JavaScript disabled:
- **Aether:** Static content visible, only live updates unavailable
- **React:** Blank page

Every demo includes `<noscript>` notices proving this.

---

## Examples

| Example | Path | Description |
|---------|------|-------------|
| **Jump-in Mode** | `/examples/mode-jumpin/` | **The "aha" demo: 50ms content vs 1500ms** |
| **Snap-in Mode** | `/examples/mode-snapin/` | Aether widgets inside a React app |
| **Replace Mode** | `/examples/react-replacement/` | Full React replacement |
| **EDS Leapfrog** | `/examples/eds-leapfrog/` | React vs Aether side-by-side |
| **Alerts** | `/examples/ui/alert.html` | Status notifications |
| **Metrics** | `/examples/ui/metrics.html` | Live telemetry dashboard |
| **Dashboard** | `/examples/ui/dashboard.html` | Multi-slot composition |

---

## Integration Modes

Aether supports three integration modes for existing React apps:

### 1. Jump-in Mode (Most Impressive)

Add one script tag. Content appears in **<50ms** instead of 1500ms.

```
Without Aether:  Blank → React loading → hydrate → fetch → render (1500ms)
With Aether:     Content visible (50ms) → React hydrates in background
```

The user sees content **30× faster**. React can still hydrate for interactivity.

**Demo:** `/examples/mode-jumpin/`

### 2. Replace Mode

Remove React entirely. Use Aether for content-driven UIs.

**Demo:** `/examples/react-replacement/`

### 3. Snap-in Mode (Most Practical)

Aether widgets coexist with React on the same page. The realistic adoption path.

```
React handles:  Navigation, forms, tables (interactive)
Aether handles: Notifications, live stats, activity feeds (real-time)
```

Low risk. Prove value on one widget before committing.

**Demo:** `/examples/mode-snapin/`

---

## Links

- **Paper:** *Semantic Projection: Zero-Hydration UI for Agentic Systems* — `paper/main.tex`
- **AETHER Framework:** [github.com/jeff0926/aether](https://github.com/jeff0926/aether)
- **Live Demos:** Run `npm run dev` and open http://localhost:5173

---

## When to Use

**Good fit:**
- Real-time displays
- Agent-driven UI
- Dashboards and monitoring
- Streaming interfaces
- Notifications

**Not a fit:**
- Complex client-side state machines
- Heavy form interaction workflows
- Offline-first applications

---

## License

MIT

---

<p align="center">
  <em>The browser is a projection surface.</em>
</p>
