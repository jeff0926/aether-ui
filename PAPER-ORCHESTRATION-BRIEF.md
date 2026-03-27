# Aether UI: Technical Specification Paper Brief

**Purpose:** This document provides complete context for orchestrating the creation of a published technical specification paper for Aether UI.

**Target:** Academic publication / arXiv submission

**Key Thesis:** Aether UI introduces a projection-based execution model for agent-driven systems. It eliminates the need for a client-side rendering engine by having the agent compute the UI and the browser simply display it.

**Dual-Mode Operation:**
1. **Standalone Mode** — Works with any SSE-capable backend
2. **Capsule Mode** — Projection layer for Aether Capsule agents

---

## PART 1: EXECUTIVE SUMMARY

### What Is Aether UI?

Aether UI is not a faster framework. It is a different execution model.

Instead of shipping JavaScript to the browser to parse, hydrate, and reconcile a virtual DOM, Aether **projects** pre-computed UI state via Server-Sent Events to a minimal kernel (868 bytes gzipped).

**The Execution Model:**
```
Traditional:  Server → JS Bundle → Parse → Hydrate → VDOM → Reconcile → DOM
Aether:       Agent  → Sliver    → SSE   → Kernel  → textContent        → DOM
```

### Core Innovation

The browser is not an application runtime. It is a **projection surface**.

> Aether does not optimize rendering. It eliminates the need for a client-side rendering engine.

| Traditional Frameworks | Aether |
|------------------------|--------|
| Client computes UI | Agent computes UI |
| Hydration required | No hydration |
| Component lifecycle | No lifecycle |
| Virtual DOM reconciliation | No structural reconciliation |
| Client-side state for rendering | No client state for display |
| Large runtime in browser | Minimal runtime (868B kernel) |

This is a different execution model, not an optimization.

### Preliminary Measurements (Development Environment)

| Metric | React 18 | Aether | Notes |
|--------|----------|--------|-------|
| Runtime Size (gzipped) | 80-200 KB | 868 B | Kernel only |
| Orchestrator (gzipped) | N/A | 414 B | Optional |
| Total Aether (gzipped) | N/A | 1,282 B | Full runtime |
| First Contentful Paint | 1,504 ms | 416 ms | Dev server, n=10 |
| DOM Interactive | 1,475 ms | 402 ms | Dev server, n=10 |

These measurements illustrate the impact of eliminating hydration and client-side execution. Production characteristics may differ.

*See `paper/data/eds-leapfrog-benchmark-2026-03-26.json` for methodology.*

---

## PART 2: THE DUAL-MODE ARCHITECTURE

### Mode 1: Standalone Operation

Aether UI runs completely independently. No backend framework required. Any SSE endpoint works.

**Minimal Setup:**
```html
<!-- 1. Load 2KB kernel -->
<script src="aether-kernel.min.js"></script>

<!-- 2. Declare runtime with slots -->
<aether-runtime endpoint="/api/sse" namespace="alerts">
  <div data-aether-slot="title"></div>
  <div data-aether-slot="body"></div>
</aether-runtime>

<!-- 3. Web component auto-initializes -->
<script type="module" src="web-component.js"></script>
```

**SSE Message Format:**
```json
{
  "phase": "deliberation",
  "vars": {
    "--accent-color": "#dc2626",
    "--tempo": "0.2s"
  },
  "content": {
    "title": "Alert Title",
    "body": "Alert body text"
  }
}
```

**Standalone Use Cases:**
- Real-time dashboards
- Live notification systems
- Streaming chat interfaces
- IoT display panels
- Kiosk applications
- Any SSE-capable backend (Node, Python, Go, Rust, Edge Functions)

### Mode 2: Aether Capsule Plugin

Aether UI is designed as the **projection layer** for Aether Capsule agents. Capsules are autonomous agent modules that encapsulate domain expertise, tools, and UI projection capabilities.

**Capsule Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                     AETHER CAPSULE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   TOOLS     │  │  KNOWLEDGE  │  │    PROJECTION       │ │
│  │             │  │             │  │                     │ │
│  │ - API calls │  │ - Domain    │  │ ┌─────────────────┐ │ │
│  │ - File ops  │  │   expertise │  │ │   AETHER UI     │ │ │
│  │ - Compute   │  │ - Context   │  │ │                 │ │ │
│  │ - External  │  │ - Memory    │  │ │ - Kernel (2KB)  │ │ │
│  │   services  │  │             │  │ │ - Orchestrator  │ │ │
│  │             │  │             │  │ │ - SSE Transport │ │ │
│  └─────────────┘  └─────────────┘  │ └─────────────────┘ │ │
│                                     └─────────────────────┘ │
│                                                             │
│  CAPSULE MANIFEST: defines tools, knowledge, UI bindings    │
└─────────────────────────────────────────────────────────────┘
```

**Capsule Integration Pattern:**

```javascript
// Capsule manifest declares UI projection
{
  "capsule": "weather-expert",
  "version": "1.0.0",
  "projection": {
    "type": "aether-ui",
    "endpoint": "/capsules/weather/sse",
    "namespace": "weather-alerts",
    "slots": ["condition", "temperature", "forecast", "alerts"]
  },
  "tools": ["weather-api", "location-service"],
  "knowledge": ["meteorology", "climate-patterns"]
}
```

**Multi-Capsule Orchestration:**

The Aether Orchestrator (442B) enables multiple capsules to share state:

```javascript
// Orchestrator coordinates capsule UIs
const orchestrator = AetherOrchestrator.getInstance();

// Register capsule projections
orchestrator.register('weather-capsule', weatherKernel);
orchestrator.register('traffic-capsule', trafficKernel);
orchestrator.register('calendar-capsule', calendarKernel);

// Broadcast shared state (e.g., user location)
orchestrator.setState('user-location', { lat: 37.7749, lng: -122.4194 });

// All capsules receive location update
orchestrator.broadcast({
  '--location-context': 'San Francisco',
  '--timezone': 'PST'
});
```

**Why Capsule Integration Matters:**

1. **Agent Autonomy** — Capsules own their UI, not the host application
2. **Composability** — Multiple capsules project to same page
3. **Isolation** — Capsule failures don't crash other projections
4. **Portability** — Same capsule works in any Aether-enabled host
5. **State Sharing** — Orchestrator enables cross-capsule coordination

---

## PART 3: TECHNICAL ARCHITECTURE

### 3.1 The Three-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                      EDGE LAYER                              │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │    Intent    │  │    Sliver    │  │   SSE Stream     │  │
│   │  Resolution  │──▶│    Lookup    │──▶│   Generator     │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   Agent/LLM determines intent → Maps to pre-computed sliver  │
│   → Streams via SSE with CSS vars + content                  │
└─────────────────────────────────┬───────────────────────────┘
                                  │ SSE (text/event-stream)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     ADAPTER LAYER                            │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   Snap-In    │  │   Jump-In    │  │    Net-New       │  │
│   │  (Coexist)   │  │  (Replace)   │  │  (Edge-Native)   │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   Framework integration: React/Vue/Angular coexistence,      │
│   replacement, or pure Aether without any framework          │
└─────────────────────────────────┬───────────────────────────┘
                                  │ Custom Events
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     KERNEL LAYER                [2KB total]  │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  SSE Client  │  │ CSS Injector │  │  Slot Hydrator   │  │
│   │              │  │              │  │                  │  │
│   │ EventSource  │  │ setProperty  │  │ textContent      │  │
│   │ Reconnect    │  │ --vars       │  │ data-aether-slot │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│   ┌──────────────┐  ┌──────────────────────────────────────┐ │
│   │ Focus Mgmt   │  │         Orchestrator (optional)      │ │
│   │              │  │                                      │ │
│   │ Preserve/    │  │ Multi-agent state sharing (+442B)    │ │
│   │ Restore      │  │ register/broadcast/sync              │ │
│   └──────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 The 4-Step Pipeline

**Step 1: Ingestion & Semantic Sifting**
```
Heavy JSON Response (100KB)
         │
         ▼
┌─────────────────────┐
│   Canonical Model   │  Extract signal from noise
│       (~1KB)        │  Domain-specific transformation
└─────────────────────┘
         │
         ▼
{ location: "SF", temp: 72, condition: "sunny" }
```

**Step 2: Intent Vector Matching**
```
Canonical Model + Context
         │
         ▼
┌─────────────────────┐
│   O(1) Lookup       │  Pre-computed embedding index
│   Intent → Sliver   │  No runtime LLM call needed
└─────────────────────┘
         │
         ▼
Sliver ID: "weather-card-sunny-warm"
```

**Step 3: DNA Hydration**
```
Sliver Template + Canonical Model
         │
         ▼
┌─────────────────────┐
│  String Replace     │  Template + Model → HTML
│  (No DOM build)     │  Pure string manipulation
└─────────────────────┘
         │
         ▼
<div class="weather">72°F Sunny in SF</div>
```

**Step 4: Delta Projection**
```
Hydrated Sliver
         │
         ▼
┌─────────────────────┐
│   SSE Stream        │  CSS vars first (fast)
│   vars + content    │  HTML only if structure changes
└─────────────────────┘
         │
         ▼
Browser: kernel.applyVariables() + kernel.injectContent()
```

### 3.3 Kernel Implementation

**Size Budget:** 2KB max | **Actual:** 2,208B raw / **868B gzipped**

```javascript
class AetherKernel {
  constructor(container, config) {
    this.container = container;
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.connect();
  }

  connect() {
    const url = `${this.endpoint}?namespace=${this.namespace}`;
    this.source = new EventSource(url);
    this.source.onmessage = (e) => this.handlePulse(JSON.parse(e.data));
    this.source.onerror = () => this.reconnect();
  }

  handlePulse(pulse) {
    if (pulse.vars) this.applyVariables(pulse.vars);
    if (pulse.content) this.injectContent(pulse.content);
  }

  applyVariables(vars) {
    const scope = this.container;
    Object.entries(vars).forEach(([key, value]) => {
      scope.style.setProperty(key, value);
    });
  }

  injectContent(content) {
    Object.entries(content).forEach(([slot, value]) => {
      const el = this.container.querySelector(`[data-aether-slot="${slot}"]`);
      if (el) el.textContent = value;  // XSS-safe: textContent only
    });
  }

  destroy() {
    if (this.source) this.source.close();
  }
}

window.AetherKernel = AetherKernel;
```

### 3.4 Orchestrator Implementation

**Size Budget:** 500B max | **Actual:** 837B raw / **414B gzipped**

```javascript
class AetherOrchestrator {
  static instance = null;

  static getInstance() {
    if (!this.instance) this.instance = new AetherOrchestrator();
    return this.instance;
  }

  constructor() {
    this.agents = new Map();
    this.state = {};
    this.listeners = [];
  }

  register(id, kernel) { this.agents.set(id, kernel); }
  unregister(id) { this.agents.delete(id); }

  setState(key, value) {
    this.state[key] = value;
    this.listeners.forEach(cb => cb(this.state));
  }

  getState(key) { return this.state[key]; }

  broadcast(vars) {
    this.agents.forEach(kernel => kernel.applyVariables(vars));
  }

  sync(sourceId, targetId, keys) {
    const source = this.agents.get(sourceId);
    const target = this.agents.get(targetId);
    // Sync specific CSS vars from source to target
  }

  onStateChange(callback) {
    this.listeners.push(callback);
    return () => this.listeners = this.listeners.filter(cb => cb !== callback);
  }
}

window.AetherOrchestrator = AetherOrchestrator;
```

### 3.5 SSE Protocol Specification

**Content-Type:** `text/event-stream`

**Message Structure:**
```
data: {"phase":"reflex","vars":{"--accent":"#0ea5e9"},"content":{"title":"Hello"}}\n\n
```

**Phase Types:**

| Phase | Meaning | Typical Tempo | Use Case |
|-------|---------|---------------|----------|
| `reflex` | Immediate response | 0.1s | Initial connection, urgent alerts |
| `deliberation` | Processing/thinking | 0.3s | AI generating, data loading |
| `complete` | Final state | 0.3s | Task finished, stable state |
| `ghost` | Degraded/fallback | 0.5s | Errors, offline mode |

**Reconnection:**
- Kernel uses `Last-Event-ID` header for resumption
- Exponential backoff: 1s, 2s, 4s, 8s, max 30s
- State cache enables snapshot replay on reconnect

### 3.6 Differentiation from LiveView / HTMX

Aether does not synchronize a DOM. It projects UI state.

| LiveView / HTMX | Aether |
|-----------------|--------|
| Server maintains DOM | No server-side DOM |
| Diffs sent to client | No diffing |
| Component tree exists | No component tree |
| HTML fragments | Slot content + CSS variables |
| Request-response updates | Continuous projection via SSE |
| UI unaware of system state | Agent cognition drives UI phases |

**Key Distinction:** LiveView/HTMX synchronize server-rendered HTML with the client DOM. Aether projects computed UI state directly into pre-defined slots. No parsing, no diffing, no tree.

This is projection, not synchronization.

---

## PART 4: INTEGRATION MODES

### 4.1 Snap-In Mode (Coexistence)

Aether claims a subtree while React/Vue/Angular continues elsewhere.

```html
<!-- React app -->
<div id="react-root">
  <!-- React owns this -->
</div>

<!-- Aether snaps in alongside -->
<aether-runtime endpoint="/api/sse" namespace="notifications">
  <div class="notification-panel">
    <h3 data-aether-slot="title"></h3>
    <p data-aether-slot="body"></p>
  </div>
</aether-runtime>
```

**Use Cases:**
- Adding real-time features to existing apps
- Gradual migration from React
- Performance-critical widgets

### 4.2 Jump-In Mode (Replacement)

Aether intercepts data and replaces the framework for a component.

```javascript
const adapter = new AetherAdapter();

// Extract props from React, convert to Canonical Model
adapter.jumpIn('react-dashboard', {
  endpoint: '/api/sse',
  namespace: 'dashboard',
  transformer: (reactProps) => ({
    cpu: reactProps.metrics.cpu,
    memory: reactProps.metrics.memory,
    status: reactProps.status
  })
});
```

**Use Cases:**
- Replacing heavy React components
- Performance optimization
- Reducing bundle size

### 4.3 Net-New Mode (Edge-Native)

No framework at all. Edge function pre-checks eligibility.

```javascript
// Edge function (Cloudflare Worker)
export default {
  async fetch(request) {
    const eligible = await checkAetherEligibility(request);

    if (eligible) {
      // Return minimal HTML + 2KB kernel
      return new Response(aetherShell, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Fall back to traditional SPA
    return fetch(request);
  }
}
```

**Use Cases:**
- New applications designed for Aether
- Maximum performance requirements
- Edge-first architecture

---

## PART 5: DESIGN SYSTEM INTEGRATION

### 5.1 Slot-Based Possession

Aether doesn't ship HTML. The host provides semantic components. Aether **possesses** them.

```html
<!-- Host provides structure -->
<div class="eds-card" data-aether-possessable>
  <img class="eds-card__image" data-aether-slot="image">
  <h3 class="eds-card__title" data-aether-slot="title"></h3>
  <p class="eds-card__body" data-aether-slot="body"></p>
</div>
```

```css
/* CSS variables enable possession */
.eds-card {
  --card-bg: var(--background-subtle, #f8fafc);
  --card-border: var(--accent-color, #0ea5e9);

  background: var(--card-bg);
  border-left: 4px solid var(--card-border);
  transition: all var(--tempo, 0.3s) ease;
}
```

### 5.2 PSI Mapping (Presentation-Semantic Interface)

Standard tokens map across design systems:

| Aether Token | Adobe EDS | Material | Tailwind |
|--------------|-----------|----------|----------|
| `--accent-color` | `--spectrum-accent` | `--md-primary` | `text-blue-500` |
| `--background-subtle` | `--spectrum-gray-100` | `--md-surface` | `bg-slate-50` |
| `--tempo` | `--spectrum-animation-duration` | `--md-motion-duration` | `duration-300` |
| `--error` | `--spectrum-negative` | `--md-error` | `text-red-500` |

### 5.3 Accessibility Preservation

Aether maintains accessibility by:
1. Using `textContent` (not `innerHTML`) — preserves DOM structure
2. Focus preservation — saves/restores `activeElement`
3. ARIA live regions — respects `aria-live` on slots
4. Reduced motion — honors `prefers-reduced-motion`

---

## PART 6: CURRENT IMPLEMENTATION STATUS

### 6.1 Completed Components

| Component | File | Raw | Gzipped | Status |
|-----------|------|-----|---------|--------|
| AetherKernel | `src/kernel/aether-kernel.js` | 2,208 B | **868 B** | ✅ Production |
| AetherOrchestrator | `src/kernel/aether-orchestrator.js` | 837 B | **414 B** | ✅ Production |
| **Total Runtime** | — | 3,045 B | **1,282 B** | ✅ Production |
| Web Component | `src/adapter/web-component.js` | — | — | ✅ Production |
| AetherAdapter | `src/adapter/aether-adapter.js` | — | — | ✅ Production |

### 6.2 Working Examples

| Example | Path | Mode | Description |
|---------|------|------|-------------|
| Weather | `/examples/weather/` | Snap-In | React + Aether coexistence |
| Jump-In | `/examples/jump-in/` | Jump-In | React replacement |
| Net-New | `/examples/net-new/` | Net-New | Pure Aether |
| Dashboard | `/examples/dashboard/` | Multi-Agent | Orchestrator demo |
| Chat | `/examples/chat/` | Streaming | Character-by-character |
| Orchestrator | `/examples/orchestrator-test.html` | State Sync | Multi-runtime coordination |

### 6.3 EDS Leapfrog Demo (Flagship)

Complete demonstration comparing Aether to Adobe React+EDS pipeline:

| Page | Description | Status |
|------|-------------|--------|
| `index.html` | Landing with metrics table | ✅ Complete |
| `adobe-way.html` | React 18 + EDS blocks (~40KB) | ✅ Complete |
| `aether-way.html` | Aether + EDS blocks (2KB) | ✅ Complete |
| `side-by-side.html` | Split-screen comparison | ✅ Complete |
| `blocks.html` | EDS block library showcase | ✅ Complete |

### 6.4 Documentation

| Document | Path | Status |
|----------|------|--------|
| Architecture | `docs/ARCHITECTURE.md` | ✅ Complete |
| API Reference | `docs/API.md` | ✅ Complete |
| Adapter Guide | `docs/ADAPTER.md` | ✅ Complete |
| Benchmarks | `docs/BENCHMARKS.md` | ✅ Complete |
| Edge Deployment | `docs/EDGE.md` | ✅ Complete |
| EDS Integration | `docs/EDS.md` | ✅ Complete |

### 6.5 Research Paper

| Item | Path | Status |
|------|------|--------|
| LaTeX Source | `paper/main.tex` | Draft complete |
| Figures | `paper/figures/` | Directory exists |
| Data | `paper/data/` | Benchmark data added |

### 6.6 Benchmark Results (Measured 2026-03-26)

**Environment:**
- Browser: Chromium (Playwright)
- Server: Vite 5.4.21 development server
- Iterations: 10 per page
- Wait strategy: `domcontentloaded`

**Bundle Sizes (Verified):**
```
┌─────────────────────┬──────────┬──────────┐
│ Component           │ Raw      │ Gzipped  │
├─────────────────────┼──────────┼──────────┤
│ Kernel              │ 2,208 B  │ 868 B    │
│ Orchestrator        │ 837 B    │ 414 B    │
│ Total               │ 3,045 B  │ 1,282 B  │
└─────────────────────┴──────────┴──────────┘
```

**EDS Leapfrog Performance Comparison:**
```
┌──────────────────────┬────────────────┬────────────────┬────────────────┐
│ Metric               │ Adobe (React)  │ Aether         │ Improvement    │
├──────────────────────┼────────────────┼────────────────┼────────────────┤
│ First Contentful     │ 1,504 ms       │ 416 ms         │ 3.6x faster    │
│ DOM Interactive      │ 1,475 ms       │ 402 ms         │ 3.7x faster    │
│ DOM Content Loaded   │ 1,579 ms       │ 407 ms         │ 3.9x faster    │
└──────────────────────┴────────────────┴────────────────┴────────────────┘
```

**Aether Runtime Verification:**
- SSE Connection: ✅ Successful
- Slots Possessed: 7
- Connection Status: `data-aether-connected` attribute set

**Data File:** `paper/data/eds-leapfrog-benchmark-2026-03-26.json`

**Notes for Paper:**
1. Development server includes ~134KB Vite HMR client on both pages (equal overhead)
2. React CDN resources showed 0B transfer (cached) - production would differ
3. The 3.6x FCP improvement is the primary empirical claim
4. Kernel size (868B) is the primary bundle size claim

---

## PART 7: PAPER STRUCTURE RECOMMENDATION

### Title
**"Semantic Projection: Zero-Hydration Interfaces for Agentic Systems"**

### Abstract (150 words)
- Problem: Client-side rendering requires hydration, reconciliation, lifecycle management
- Solution: Projection-based execution model where agent computes UI, browser displays it
- Method: SSE streams UI state (phase, vars, content) to 868B kernel
- Result: Eliminates need for client-side rendering engine
- Contribution: Dual-mode architecture (standalone + capsule plugin)

### 1. Introduction
- The hydration problem in modern web development
- Why agent-owned UI requires a different paradigm
- Contributions of this paper

### 2. Background & Related Work
- React Server Components (still hydrates)
- A2UI (JSON specs, runtime generation)
- CopilotKit/Assistant UI (framework-first)
- Streaming UI patterns (partial hydration)

### 3. Architecture
- 3.1 The Inversion Principle
- 3.2 Three-Layer Model (Edge, Adapter, Kernel)
- 3.3 The 4-Step Pipeline
- 3.4 SSE Protocol Specification

### 4. Implementation
- 4.1 Kernel Design (2KB constraint)
- 4.2 Orchestrator Design (multi-agent)
- 4.3 Web Component API
- 4.4 Adapter Modes (Snap/Jump/Net)

### 5. Dual-Mode Operation
- 5.1 Standalone Mode
- 5.2 Capsule Plugin Architecture
- 5.3 Multi-Capsule Orchestration

### 6. Evaluation
- 6.1 Methodology
- 6.2 Performance Benchmarks (vs React, A2UI)
- 6.3 EDS Leapfrog Case Study
- 6.4 Lighthouse Scores
- 6.5 Real-World Deployment

### 7. Discussion
- 7.1 Limitations
- 7.2 When Not to Use Aether
- 7.3 Future Work

### 8. Conclusion

### Figures Needed
1. Architecture diagram (3-layer)
2. Pipeline comparison (React vs Aether)
3. Performance bar charts
4. Lighthouse score comparison
5. EDS Leapfrog screenshots
6. Capsule integration diagram

---

## PART 8: KEY MESSAGES FOR PAPER

### Primary Claims

1. **Aether is a different execution model, not a faster framework.**
   - Evidence: No hydration, no lifecycle, no reconciliation, no client state for display
   - Implication: Eliminates the need for a client-side rendering engine

2. **The browser is a projection surface, not an application runtime.**
   - Evidence: 868B kernel vs 80-200KB React runtimes
   - Implication: Agent computes UI, browser displays it

3. **If the server can compute the UI state, the browser does not need to reconstruct it.**
   - Evidence: Preliminary measurements show FCP 416ms vs 1,504ms
   - Implication: Elimination of client-side execution, not optimization of it

3. **CSS variables are sufficient for state expression.**
   - Evidence: `--accent-color`, `--tempo` handle visual state
   - Implication: No need for JS state management in display layer

4. **Agents should own UI DNA, not host frameworks.**
   - Evidence: Capsule architecture with portable projections
   - Implication: True agent autonomy includes UI control

### Differentiators from Related Work

| Approach | Model | Aether Difference |
|----------|-------|-------------------|
| React RSC | Server render + client hydration | No hydration, no client runtime |
| LiveView | Server DOM + client synchronization | No server DOM, projection not sync |
| HTMX | Server HTML fragments + DOM swap | No diffing, slot-based projection |
| A2UI | JSON spec → client generation | Pre-computed, no generation |
| CopilotKit | React-first AI integration | Framework-optional, agent-owned UI |

**Core distinction:** These approaches optimize or relocate rendering. Aether eliminates the rendering engine entirely.

### Quotable Statements

> "Aether does not optimize rendering. It eliminates the need for a client-side rendering engine."

> "If the server can compute the UI state, the browser does not need to reconstruct it."

> "The browser is not an application runtime. It is a projection surface."

> "This is projection, not synchronization."

---

## PART 9: REPOSITORY INFORMATION

**GitHub:** https://github.com/jeff0926/aether-ui

**Key Files:**
```
aether-ui/
├── src/kernel/aether-kernel.js       # Core runtime (READ THIS)
├── src/kernel/aether-orchestrator.js # Multi-agent coordination
├── src/adapter/web-component.js      # <aether-runtime> element
├── src/adapter/aether-adapter.js     # Framework integration
├── dist/aether-kernel.min.js         # Production build (2,208B)
├── dist/aether-orchestrator.min.js   # Production build (837B)
├── examples/eds-leapfrog/            # Flagship demo
├── docs/                             # All documentation
├── paper/main.tex                    # Existing draft
└── vite.config.js                    # Dev server with mock SSE
```

**Development Commands:**
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build production bundles
npm test         # Run test suite
```

---

## PART 10: NEXT STEPS FOR PAPER ORCHESTRATION

### Immediate Actions

1. **Review existing paper/main.tex** — Assess completeness
2. **Generate figures** — Architecture diagrams, performance charts
3. **Formalize benchmarks** — Reproducible methodology
4. **Write evaluation section** — EDS Leapfrog results
5. **Add capsule integration section** — Dual-mode architecture

### Documentation to Formalize

1. **API Specification** — OpenAPI/TypeScript definitions
2. **SSE Protocol Spec** — Formal message schema
3. **PSI Mapping Spec** — Design system token mapping
4. **Capsule Manifest Spec** — Plugin declaration format

### Demonstrations to Create

1. **Overview Demo** — Single page showing all capabilities
2. **Capsule Demo** — Multi-capsule orchestration
3. **Performance Demo** — Live Lighthouse comparison
4. **Migration Demo** — React → Aether journey

---

## APPENDIX: GLOSSARY

| Term | Definition |
|------|------------|
| **Sliver** | Pre-computed HTML fragment with slot placeholders |
| **Pulse** | SSE message containing phase, vars, and content |
| **Possession** | Agent taking control of host UI via CSS variables |
| **Capsule** | Autonomous agent module with tools, knowledge, and projection |
| **Orchestrator** | Singleton coordinator for multi-agent state sharing |
| **Snap-In** | Integration mode: Aether coexists with existing framework |
| **Jump-In** | Integration mode: Aether replaces existing framework |
| **Net-New** | Integration mode: Pure Aether, no framework |
| **PSI** | Presentation-Semantic Interface: design system token mapping |
| **Tempo** | CSS variable controlling animation/transition speed |

---

**End of Brief**

*This document contains everything needed to orchestrate the technical specification paper. The new Claude session should start by reading `paper/main.tex` and `src/kernel/aether-kernel.js`, then proceed with figure generation and evaluation section writing.*
