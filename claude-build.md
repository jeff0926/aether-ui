

#### Skin Nodes (Aesthetics)
```json
{
  "@type": "SkinNode",
  "nodeId": "https://aether.io/skin/high-urgency",
  "tokenSet": "eds-2024",
  "mood": {
    "base": "critical",
    "tempo": 0.15,
    "intensity": 0.9
  },
  "cssVariables": {
    "--accent-color": "#dc2626",
    "--background-subtle": "#fef2f2",
    "--tempo": "0.15s"
  }
}
```

#### Intelligence Nodes (Logic)
```json
{
  "@type": "IntelligenceNode",
  "nodeId": "https://aether.io/intent/weather-urgency",
  "trigger": {
    "observation.severity": ["warning", "critical"],
    "disruptionPotential.travel": {"$gt": 0.7}
  },
  "resolution": {
    "anatomy": "https://aether.io/anatomy/alert-card",
    "skin": "https://aether.io/skin/high-urgency"
  }
}
```

### 2.2 The 4-Step Pipeline

```
┌─────────────────────────────────────────┐
│  1. INGESTION & SEMANTIC SIFTING         │
│  Heavy JSON (100KB) → Canonical Model    │
│  (1KB signal) via adapter transformation │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  2. INTENT VECTOR MATCHING               │
│  O(1) lookup: situation → sliver ID      │
│  Pre-computed embedding index (HNSW)     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  3. DNA HYDRATION                        │
│  Template + Canonical Model → HTML       │
│  String replacement, no DOM build        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  4. DELTA PROJECTION                     │
│  SSE stream (0.04ms) → Kernel injection  │
│  CSS variables first, HTML if structural │
└─────────────────────────────────────────┘
```

### 2.3 The 2KB Kernel

The browser runtime has four responsibilities:

#### SSE Connection Manager
- Opens `EventSource` to edge endpoint
- Handles `Last-Event-ID` for reconnection
- Maintains `state_cache` for snapshot replay
- Auto-reconnect with exponential backoff

#### CSS Variable Injector
- Receives `vars` payload from SSE
- Applies to `:root` or scoped container
- Transitions via `transition: all var(--tempo)`
- No React-style state reconciliation

#### Slot Content Sanitizer
- Targets `data-aether-slot` attributes
- Injects via `element.textContent` (XSS-safe)
- Optional: lightweight markdown parser
- Never `innerHTML`

#### Focus Preservation Engine
```javascript
// Pre-projection: save
const active = document.activeElement;
const selector = generateSelector(active);

// Post-projection: restore
const restored = document.querySelector(selector);
if (restored) restored.focus();
```

### 2.4 The Adapter: 3-Mode Integration

#### Mode 1: Snap-In (Coexistence)
Host framework and Aether share the DOM. Aether claims a subtree.

```javascript
// React host
function Dashboard() {
  return (
    <div className="legacy-charts">
      <OldChart /> {/* React hydrates */}
      <aether-runtime 
        endpoint="/edge/dai"
        namespace="alert-panel"
        context={severity}
      /> {/* Aether projects */}
    </div>
  );
}
```

#### Mode 2: Jump-In (Replacement)
Aether intercepts data, unmounts React, claims territory.

```javascript
// Adapter API
const adapter = new AetherAdapter();
adapter.jumpIn('#react-root', {
  endpoint: '/edge/dai',
  namespace: 'full-dashboard',
  transformer: (reactProps) => canonicalModel
});
```

Mechanism:
- Traps React unmount
- Extracts props as Canonical Model
- Destroys React tree
- Mounts `<aether-runtime>` in same container
- Broadcasts to kernel via custom event

#### Mode 3: Net-New (Edge-Native)
No host framework. Edge function pre-checks route, injects kernel, skips React bundle entirely.

```javascript
// Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const aetherEligible = await checkAetherRoute(url.pathname);
    
    if (aetherEligible) {
      return new Response(generateAetherShell(url), {
        headers: {'Content-Type': 'text/html'}
      });
    }
    
    return env.ASSETS.fetch(request); // Fallback to origin
  }
};
```

---

## 3. Edge Architecture

### 3.1 Deployment Targets

| Platform | Runtime | Storage | SSE Support |
|----------|---------|---------|-------------|
| Cloudflare Workers | V8 isolates | KV, R2 | Native Web Streams |
| Vercel Edge Functions | Node.js compat | Edge Config | Native |
| Deno Deploy | Deno | KV | Native |
| Fastly Compute@Edge | WASM | Config store | Native |

### 3.2 The Edge Function

```javascript
// edge/aether-worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agent');
    const lastEventId = request.headers.get('Last-Event-ID');
    
    // Intent resolution (10ms)
    const intent = await resolveIntent(agentId, env.KV);
    
    // Sliver lookup (cached)
    const sliver = await env.KV.get(`sliver:${intent.sliverId}`);
    
    // State cache for reconnections
    const stateCache = await env.KV.get(`state:${agentId}`) || {};
    
    const stream = new ReadableStream({
      start(controller) {
        // Immediate snapshot if reconnecting
        if (lastEventId) {
          controller.enqueue(formatSnapshot(stateCache));
        }
        
        // Live pulses
        const interval = setInterval(() => {
          const pulse = generatePulse(intent, stateCache);
          controller.enqueue(formatSSE(pulse));
        }, 50); // 20fps max
        
        ctx.waitUntil(new Promise(resolve => {
          // Cleanup on client disconnect
          request.signal.addEventListener('abort', () => {
            clearInterval(interval);
            env.KV.put(`state:${agentId}`, JSON.stringify(stateCache));
            resolve();
          });
        }));
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
};
```

### 3.3 State Cache Strategy

CSS variables are stateful—only final values matter. The edge maintains:

```json
{
  "agentId": "weather-bos-001",
  "currentVars": {
    "--accent-color": "#dc2626",
    "--tempo": "0.15s"
  },
  "accumulatedContent": {
    "location": "Boston",
    "temperature": "32°F",
    "condition": "Snow"
  },
  "structuralHash": "a1b2c3...",
  "lastPulse": 1703123456789
}
```

On reconnection: full snapshot in one SSE frame.

---

## 4. Design System Integration (EDS)

### 4.1 Universal EDS Possession

Aether does not ship HTML. Hosts provide semantic components. Agents possess them via CSS variables.

#### Host Component (Generic)
```html
<!-- Provided by SAP Fiori, Adobe AEM, etc. -->
<div class="eds-card" data-aether-possessable="true">
  <h3 class="eds-card-title" data-aether-slot="title"></h3>
  <p class="eds-card-body" data-aether-slot="body"></p>
</div>
```

#### PSI Mapping (Presentation-Semantic Interface)
```json
{
  "@context": "https://aether.io/psi/v1",
  "host": "sap-fiori-2024",
  "mappings": {
    "--eds-card-bg": "--background-subtle",
    "--eds-card-border": "--accent-color",
    "--eds-title-font": "--font-heading",
    ".eds-card:hover": {
      "transform": "scale(var(--hover-scale))",
      "transition": "all var(--tempo)"
    }
  }
}
```

#### Agent Possession
1. Agent detects host EDS from `meta` tag or header
2. Loads `psi.jsonld` mapping for that host
3. Projects CSS variables that override host defaults
4. Injects content into `data-aether-slot` attributes

### 4.2 Token Registry

Standard tokens all hosts map to:

| Token | Purpose | Default |
|-------|---------|---------|
| `--tempo` | Animation duration | 0.3s |
| `--accent-color` | Primary action/alert | #0ea5e9 |
| `--background-subtle` | Secondary surfaces | #f8fafc |
| `--font-heading` | Typography | system-ui |
| `--hover-scale` | Interaction feedback | 1.02 |
| `--ghost-opacity` | Degraded state | 0.6 |

---

## 5. Benchmarks & Validation

### 5.1 Target Metrics

| Metric | React 18 | A2UI | Aether | Win |
|--------|----------|------|--------|-----|
| Time to Interactive | 200-500ms | 100-300ms | <50ms | 10x |
| JavaScript Payload | 80-200KB | 15-40KB | 2KB | 40-100x |
| First Contentful Paint | 150-400ms | 100-250ms | <30ms | 5x |
| Cumulative Layout Shift | 0.1-0.3 | 0.05-0.2 | <0.05 | 2x |
| Lighthouse Performance | 70-85 | 75-90 | 95-100 | - |
| Accessibility (axe-core) | Manual | Adapter-dependent | Automatic | - |

### 5.2 Test Methodology

```javascript
// benchmarks/tti-test.js
const { chromium } = require('playwright');

async function measureTTI(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(url);
  
  const tti = await page.evaluate(() => {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const ttiEntry = entries.find(e => e.name === 'interactive');
        resolve(ttiEntry.startTime);
      });
      observer.observe({ entryTypes: ['longtask'] });
    });
  });
  
  await browser.close();
  return tti;
}
```

---

## 6. File Structure

```
/aether-ui
├── /src
│   ├── /kernel
│   │   ├── aether-kernel.js          # Source (ES6 modules)
│   │   ├── aether-kernel.min.js      # Build output (2KB target)
│   │   └── /tests
│   │       ├── size.spec.js          # 2KB enforcement
│   │       ├── sse.spec.js           # Connection resilience
│   │       └── focus.spec.js         # Accessibility preservation
│   │
│   ├── /adapter
│   │   ├── aether-adapter.js         # 3-mode integration API
│   │   ├── web-component.js            # <aether-runtime> definition
│   │   └── /frameworks
│   │       ├── react-trap.js         # unmount interception
│   │       ├── vue-plugin.js         # composition API bridge
│   │       └── angular-schema.js     # CUSTOM_ELEMENTS_SCHEMA
│   │
│   └── /spec
│       ├── meta-schema.json          # Sliver validation
│       ├── psi-schema.jsonld         # Design system mapping
│       └── canonical-model.ts        # TypeScript definitions
│
├── /examples
│   ├── /weather                        # A2UI-equivalent
│   │   ├── index.html                  # Side-by-side demo
│   │   ├── aether.html                 # Aether-only
│   │   └── react.html                  # React baseline
│   │
│   ├── /dashboard                      # Multi-agent consensus
│   │   ├── index.html                  # 3 tabs, 1 SSE connection
│   │   └── /agents                     # Planner, Executor, Critic
│   │
│   └── /chat                           # Streaming text
│       ├── index.html                  # No React, live typing
│       └── /components                 # Message slivers
│
├── /edge
│   ├── cloudflare-worker.js            # Cloudflare deployment
│   ├── vercel-edge-function.js         # Vercel deployment
│   └── /tests                          # Edge latency benchmarks
│
├── /docs
│   ├── ARCHITECTURE.md                 # This document
│   ├── ADAPTER.md                      # 3-mode integration guide
│   ├── EDS.md                          # Design system mapping
│   ├── EDGE.md                         # Deployment guide
│   ├── BENCHMARKS.md                   # Performance validation
│   └── API.md                          # Kernel + adapter reference
│
├── /paper
│   ├── main.tex                        # arXiv LaTeX source
│   ├── /figures                        # Architecture diagrams
│   └── /data                           # Benchmark results (CSV)
│
├── /benchmarks
│   ├── lighthouse-ci.json              # Automated CI config
│   ├── tti-test.js                     # Playwright TTI measurement
│   └── payload-audit.js                # Bundle size tracking
│
├── package.json
├── README.md
├── LICENSE (MIT)
└── .github/workflows/ci.yml            # Size check + benchmarks
```

---

## 7. Competitive Positioning

### 7.1 vs. React Server Components

| | RSC | Aether |
|--|-----|--------|
| Server execution | React renders on server | No React, pre-computed slivers |
| Client payload | Still hydrates | Zero hydration |
| Streaming | Yes, but React chunks | Raw SSE, no parsing |
| Caching | Complex invalidation | Sliver immutable, versioned |

### 7.2 vs. A2UI

| | A2UI | Aether |
|--|------|--------|
| Philosophy | AI generates JSON | Agent projects HTML |
| Client engine | Lit/Flutter/Angular adapters | 2KB vanilla kernel |
| Latency | 100-500ms LLM generation | <50ms vector lookup |
| Multi-agent | Single surface | Conductor consensus |
| Design system | Google's registry | Any, token-mapped |
| Edge native | No | Yes |

### 7.3 vs. CopilotKit / Assistant UI

| | CopilotKit | Aether |
|--|------------|--------|
| Integration | React component | Any framework, Web Component |
| Rendering | React runtime | Zero runtime projection |
| Agent control | CopilotKit orchestrates | Host agent owns UI DNA |

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Kernel exceeds 2KB | Tree-shaking audit, feature freeze, gzip -9 |
| Host framework rejects Web Component | iframe fallback (5KB), PostMessage bridge |
| Edge function cold start | Warm pools, regional replication |
| SSE blocked by corporate firewall | Long-polling fallback, 5s interval |
| A2UI copies pattern | Speed to market, community lock-in via EDS registry |
| No enterprise traction | Pivot to developer tools (VS Code extension) |

---

## 9. Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| Day 10 | GitHub stars | 500 |
| Week 2 | arXiv citations | 5 |
| Month 1 | Production deployments | 3 |
| Month 3 | Conference submissions | 2 (CHI, UIST) |
| Month 6 | Enterprise pilots | 5 |
| Month 12 | Design system integrations | 10 (Material, Carbon, etc.) |

---

## 10. The One-Line Validation

> Aether UI demonstrates that semantic projection—pre-computed sliver graphs streamed via Server-Sent Events—eliminates the hydration tax of generative UI frameworks while maintaining design system portability, accessibility compliance, and edge-native latency.

---

**Status:** Day 0. Foundation lock.

**Next:** Kernel v0.2 implementation.
```

---

## `claude-build.md`

```markdown
# Aether UI: Build Plan

## 10-Day Execution Schedule

---

## Pre-Flight Checklist

- [ ] Project folder `/aether-ui/` created
- [ ] Sibling to `/aether/` (core framework)
- [ ] Node.js 20+ installed
- [ ] Git initialized
- [ ] GitHub repo created (private until Day 10)
- [ ] Cloudflare account (free tier)
- [ ] Vercel account (free tier)

---

## Day 1: Kernel Foundation

### Morning: Project Scaffold

```bash
mkdir -p /aether-ui/src/kernel/tests
mkdir -p /aether-ui/src/adapter/frameworks
mkdir -p /aether-ui/examples/weather
mkdir -p /aether-ui/edge
mkdir -p /aether-ui/docs
mkdir -p /aether-ui/paper/figures
cd /aether-ui && npm init -y
```

**Files to create:**

- `package.json` (see below)
- `.gitignore` (node_modules, dist, .env)
- `README.md` (stub)

```json
{
  "name": "aether-ui",
  "version": "0.2.0",
  "description": "Zero-hydration interface framework for agentic systems",
  "type": "module",
  "scripts": {
    "build": "rollup -c",
    "size": "gzip -c dist/aether-kernel.min.js | wc -c",
    "test": "vitest",
    "test:size": "node scripts/size-check.js",
    "dev": "vite",
    "deploy:edge": "wrangler deploy",
    "benchmark": "node benchmarks/tti-test.js"
  },
  "devDependencies": {
    "rollup": "^4.0.0",
    "@rollup/plugin-terser": "^0.4.0",
    "vitest": "^1.0.0",
    "vite": "^5.0.0",
    "wrangler": "^3.0.0",
    "playwright": "^1.40.0"
  }
}
```

### Afternoon: Kernel v0.1

**File:** `src/kernel/aether-kernel.js`

```javascript
/**
 * Aether UI Kernel v0.2
 * Zero-hydration projection runtime
 * Target: 2KB gzipped
 */

class AetherKernel {
  constructor(container, config = {}) {
    this.container = container;
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.stateCache = new Map();
    this.focusPath = null;
    this.eventSource = null;
    
    this.init();
  }
  
  init() {
    this.preserveFocus();
    this.connect();
    this.observeSlots();
  }
  
  connect() {
    const url = new URL(this.endpoint, window.location.href);
    url.searchParams.set('namespace', this.namespace);
    url.searchParams.set('init', 'true');
    
    this.eventSource = new EventSource(url.toString());
    
    this.eventSource.onopen = () => {
      this.container.setAttribute('data-aether-connected', 'true');
    };
    
    this.eventSource.onmessage = (event) => {
      const pulse = JSON.parse(event.data);
      this.handlePulse(pulse);
    };
    
    this.eventSource.onerror = () => {
      this.container.setAttribute('data-aether-error', 'true');
      // Auto-reconnect handled by browser
    };
  }
  
  handlePulse(pulse) {
    // Phase: reflex | deliberation | complete | ghost
    
    if (pulse.vars) {
      this.applyVariables(pulse.vars);
      this.stateCache.set('vars', {...this.stateCache.get('vars'), ...pulse.vars});
    }
    
    if (pulse.content) {
      this.injectContent(pulse.content);
    }
    
    if (pulse.phase === 'complete' || pulse.phase === 'ghost') {
      this.restoreFocus();
    }
  }
  
  applyVariables(vars) {
    const scope = this.container.shadowRoot || this.container;
    Object.entries(vars).forEach(([key, value]) => {
      scope.style.setProperty(key, value);
    });
  }
  
  injectContent(contentMap) {
    Object.entries(contentMap).forEach(([slot, text]) => {
      const el = this.container.querySelector(`[data-aether-slot="${slot}"]`);
      if (el) {
        el.textContent = text; // XSS-safe
      }
    });
  }
  
  preserveFocus() {
    const active = document.activeElement;
    if (active && this.container.contains(active)) {
      this.focusPath = this.generatePath(active);
    }
  }
  
  restoreFocus() {
    if (!this.focusPath) return;
    const el = this.container.querySelector(this.focusPath);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'nearest' });
    }
    this.focusPath = null;
  }
  
  generatePath(el) {
    // Simple selector generation for focus restoration
    if (el.id) return `#${el.id}`;
    if (el.dataset.aetherSlot) return `[data-aether-slot="${el.dataset.aetherSlot}"]`;
    return el.tagName.toLowerCase();
  }
  
  observeSlots() {
    // MutationObserver for slot changes (future: two-way binding)
  }
  
  destroy() {
    this.eventSource?.close();
    this.stateCache.clear();
  }
}

// Auto-initialize from DOM
document.querySelectorAll('aether-runtime').forEach(el => {
  const config = {
    endpoint: el.getAttribute('endpoint'),
    namespace: el.getAttribute('namespace')
  };
  el._aether = new AetherKernel(el, config);
});

export { AetherKernel };
```

### Evening: Build Pipeline

**File:** `rollup.config.js`

```javascript
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'src/kernel/aether-kernel.js',
  output: {
    file: 'dist/aether-kernel.min.js',
    format: 'iife',
    name: 'AetherKernel'
  },
  plugins: [
    terser({
      compress: {
        passes: 3,
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true
      },
      mangle: {
        properties: {
          regex: /^_/ // Only mangle private
        }
      }
    })
  ]
};
```

**File:** `scripts/size-check.js`

```javascript
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

const code = readFileSync('dist/aether-kernel.min.js');
const gzipped = gzipSync(code);
const size = gzipped.length;

console.log(`Kernel size: ${size} bytes (gzipped)`);
console.log(`Target: 2048 bytes`);
console.log(`Status: ${size <= 2048 ? 'PASS' : 'FAIL - need ' + (size - 2048) + ' bytes reduction'}`);

process.exit(size <= 2048 ? 0 : 1);
```

**Verification:**

```bash
npm run build
npm run size
# Must output: <= 2048 bytes
```

**End of Day 1 deliverable:** Kernel builds, size <= 2KB.

---

## Day 2: Web Component + Tests

### Morning: Web Component Wrapper

**File:** `src/adapter/web-component.js`

```javascript
/**
 * <aether-runtime> Web Component
 * Framework-agnostic host integration
 */

class AetherRuntime extends HTMLElement {
  static observedAttributes = ['endpoint', 'namespace', 'mood'];
  
  constructor() {
    super();
    this._kernel = null;
    this._shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
  }
  
  connectedCallback() {
    this.renderShell();
    this.initializeKernel();
  }
  
  renderShell() {
    this._shadow.innerHTML = `
      <style>
        :host {
          display: block;
          contain: layout style paint;
        }
        :host([data-aether-connected]) .status { opacity: 0; }
        :host([data-aether-error]) .status { color: var(--error, #dc2626); }
        .sliver-container { transition: all var(--tempo, 0.3s); }
      </style>
      <div class="status" aria-live="polite">Connecting...</div>
      <div class="sliver-container" part="sliver">
        <slot></slot>
      </div>
    `;
  }
  
  initializeKernel() {
    const config = {
      endpoint: this.getAttribute('endpoint'),
      namespace: this.getAttribute('namespace'),
      mood: this.getAttribute('mood')
    };
    
    // Lazy load kernel if not present
    if (!window.AetherKernel) {
      this.loadKernel().then(() => {
        this._kernel = new window.AetherKernel(this._shadow, config);
      });
    } else {
      this._kernel = new window.AetherKernel(this._shadow, config);
    }
  }
  
  async loadKernel() {
    const script = document.createElement('script');
    script.src = 'https://cdn.aether.io/kernel/0.2.0/aether-kernel.min.js';
    // Or: inline the 2KB kernel here for zero-dependency
    document.head.appendChild(script);
    return new Promise(resolve => {
      script.onload = resolve;
    });
  }
  
  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._kernel) return;
    // Dynamic reconfiguration
    if (name === 'mood') {
      this._kernel.applyVariables({ '--mood': newVal });
    }
  }
  
  disconnectedCallback() {
    this._kernel?.destroy();
  }
}

customElements.define('aether-runtime', AetherRuntime);
```

### Afternoon: Kernel Tests

**File:** `src/kernel/tests/size.spec.js`

```javascript
import { test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

test('kernel is <= 2KB gzipped', () => {
  const code = readFileSync('dist/aether-kernel.min.js');
  const gzipped = gzipSync(code);
  expect(gzipped.length).toBeLessThanOrEqual(2048);
});
```

**File:** `src/kernel/tests/sse.spec.js`

```javascript
import { test, expect, vi } from 'vitest';
import { AetherKernel } from '../aether-kernel.js';

test('connects to SSE endpoint', () => {
  const mockES = {
    onmessage: null,
    onopen: null,
    close: vi.fn()
  };
  global.EventSource = vi.fn(() => mockES);
  
  const container = document.createElement('div');
  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });
  
  expect(global.EventSource).toHaveBeenCalledWith(
    expect.stringContaining('/test?namespace=test')
  );
});
```

**File:** `src/kernel/tests/focus.spec.js`

```javascript
test('preserves and restores focus', () => {
  const container = document.createElement('div');
  container.innerHTML = '<input data-aether-slot="search" />';
  document.body.appendChild(container);
  
  const input = container.querySelector('input');
  input.focus();
  
  const kernel = new AetherKernel(container, {});
  kernel.preserveFocus();
  
  // Simulate DOM change
  container.innerHTML = '<input data-aether-slot="search" />';
  
  kernel.restoreFocus();
  expect(document.activeElement).toBe(container.querySelector('input'));
});
```

**Verification:**

```bash
npm test
# All tests pass
# Size check passes
```

**End of Day 2 deliverable:** Web Component registered, tests passing.

---

## Day 3: Adapter Foundation + Snap-In Example

### Morning: Adapter Core

**File:** `src/adapter/aether-adapter.js`

```javascript
/**
 * Aether Adapter: 3-mode integration API
 */

class AetherAdapter {
  constructor(options = {}) {
    this.observers = new Map();
    this.interceptors = new Map();
    this.config = options;
  }
  
  // Mode 1: Snap-In (coexistence)
  snapIn(targetSelector, aetherConfig) {
    const host = document.querySelector(targetSelector);
    if (!host) throw new Error(`Target not found: ${targetSelector}`);
    
    const aether = document.createElement('aether-runtime');
    Object.entries(aetherConfig).forEach(([key, val]) => {
      aether.setAttribute(key, val);
    });
    
    host.appendChild(aether);
    return aether;
  }
  
  // Mode 2: Jump-In (replacement)
  jumpIn(reactRootId, aetherConfig) {
    const reactRoot = document.getElementById(reactRootId);
    if (!reactRoot) throw new Error(`React root not found: ${reactRootId}`);
    
    // Extract React props before destruction
    const props = this.extractReactProps(reactRoot);
    const canonical = aetherConfig.transformer?.(props) || props;
    
    // Trap React unmount (prevent cleanup errors)
    if (window.ReactDOM) {
      const original = window.ReactDOM.unmountComponentAtNode;
      window.ReactDOM.unmountComponentAtNode = (node) => {
        if (node.id === 'aether-claimed') return false;
        return original.call(window.ReactDOM, node);
      };
    }
    
    // Destroy React, claim territory
    reactRoot.innerHTML = '';
    reactRoot.id = 'aether-claimed';
    
    // Mount Aether
    const aether = document.createElement('aether-runtime');
    aether.setAttribute('context', JSON.stringify(canonical));
    Object.entries(aetherConfig).forEach(([key, val]) => {
      if (key !== 'transformer') aether.setAttribute(key, val);
    });
    
    reactRoot.appendChild(aether);
    return aether;
  }
  
  // Mode 3: Net-New trigger
  netNew(routePattern, edgeEndpoint) {
    return fetch(`${edgeEndpoint}/check?route=${encodeURIComponent(routePattern)}`)
      .then(r => r.json())
      .then(({ eligible, config }) => {
        if (eligible) {
          window.__AETHER_NETNEW__ = true;
          window.__AETHER_CONFIG__ = config;
        }
        return eligible;
      });
  }
  
  // Data interception
  interceptFetch(originalUrl, transformer) {
    const original = window.fetch;
    window.fetch = (url, ...args) => {
      if (url === originalUrl || url.includes(originalUrl)) {
        return original.call(window, url, ...args)
          .then(r => r.clone().json())
          .then(data => {
            const canonical = transformer(data);
            this.broadcast('data', canonical);
            return new Response(JSON.stringify(canonical));
          });
      }
      return original.call(window, url, ...args);
    };
  }
  
  broadcast(event, data) {
    document.querySelectorAll('aether-runtime').forEach(el => {
      el.dispatchEvent(new CustomEvent(`aether:${event}`, { 
        detail: data,
        bubbles: false 
      }));
    });
  }
  
  extractReactProps(node) {
    // Heuristic: React stores props on internal fiber
    const fiber = node._reactRootContainer?._internalRoot?.current;
    return fiber?.memoizedProps || {};
  }
}

export { AetherAdapter };
```

### Afternoon: Snap-In Example (Weather)

**File:** `examples/weather/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Aether Weather - Snap-In Demo</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Aether Kernel (inline for demo, or CDN) -->
  <script src="../../dist/aether-kernel.min.js"></script>
  <script src="../../src/adapter/web-component.js"></script>
  
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .legacy-app { border: 2px solid #ccc; padding: 1rem; margin: 1rem 0; }
    .aether-panel { border: 2px solid #0ea5e9; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Snap-In Mode: React + Aether Coexistence</h1>
  
  <!-- Legacy React App -->
  <div id="react-root" class="legacy-app"></div>
  
  <!-- Aether snaps in beside it -->
  <div class="aether-panel">
    <h3>Live Alert (Aether)</h3>
    <aether-runtime 
      endpoint="http://localhost:8787/dai"
      namespace="weather-alert"
      mood="urgent">
    </aether-runtime>
  </div>

  <script type="text/babel">
    // Legacy React component (unchanged)
    function WeatherApp() {
      const [data, setData] = React.useState({ temp: 72, condition: 'Sunny' });
      
      return (
        <div>
          <h2>Legacy Weather (React)</h2>
          <p>Temperature: {data.temp}°F</p>
          <p>Condition: {data.condition}</p>
          <button onClick={() => setData({...data, temp: data.temp + 1})}>
            Increase Temp
          </button>
        </div>
      );
    }
    
    ReactDOM.render(<WeatherApp />, document.getElementById('react-root'));
  </script>
  
  <!-- Aether Adapter Demo -->
  <script type="module">
    import { AetherAdapter } from '../../src/adapter/aether-adapter.js';
    
    // Demonstrate programmatic snap-in
    const adapter = new AetherAdapter();
    
    setTimeout(() => {
      adapter.snapIn('.aether-panel', {
        endpoint: 'http://localhost:8787/dai',
        namespace: 'secondary-alert',
        mood: 'info'
      });
    }, 5000);
  </script>
</body>
</html>
```

**Verification:**

```bash
npm run dev
# Open http://localhost:5173/examples/weather/
# React works, Aether connects, secondary alert snaps in at 5s
```

**End of Day 3 deliverable:** Snap-in example working, React coexistence proven.

---

## Day 4: Jump-In + Net-New Examples

### Morning: Jump-In Example

**File:** `examples/jump-in/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Aether Jump-In: React Replacement</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script src="../../dist/aether-kernel.min.js"></script>
  <script src="../../src/adapter/web-component.js"></script>
  
  <style>
    .slow-react { opacity: 0.5; }
    .fast-aether { border: 3px solid #22c55e; }
  </style>
</head>
<body>
  <h1>Jump-In Mode: Aether Replaces React</h1>
  <button id="jump-btn">Jump to Aether (Measure Speed)</button>
  
  <div id="app-root">
    <!-- React mounts here initially -->
  </div>

  <script type="text/babel">
    function SlowDashboard() {
      const [items] = React.useState(Array(100).fill(0));
      return (
        <div className="slow-react">
          <h2>React Dashboard (100 items)</h2>
          {items.map((_, i) => (
            <div key={i}>Item {i}: {Math.random().toFixed(4)}</div>
          ))}
        </div>
      );
    }
    ReactDOM.render(<SlowDashboard />, document.getElementById('app-root'));
  </script>
  
  <script type="module">
    import { AetherAdapter } from '../../src/adapter/aether-adapter.js';
    
    document.getElementById('jump-btn').addEventListener('click', () => {
      const start = performance.now();
      
      const adapter = new AetherAdapter();
      adapter.jumpIn('app-root', {
        endpoint: 'http://localhost:8787/dai',
        namespace: 'fast-dashboard',
        transformer: (reactProps) => ({
          // Transform React chaos to Canonical Model
          itemCount: 100,
          source: 'jump-in-demo',
          timestamp: Date.now()
        })
      });
      
      const end = performance.now();
      console.log(`Jump-in took: ${(end - start).toFixed(2)}ms`);
    });
  </script>
</body>
</html>
```

### Afternoon: Net-New Example

**File:** `examples/net-new/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Aether Net-New: No React</title>
  <!-- Only Aether, zero React -->
  <script src="../../dist/aether-kernel.min.js"></script>
  <script src="../../src/adapter/web-component.js"></script>
  <script src="../../src/adapter/aether-adapter.js" type="module"></script>
  
  <style>
    body { margin: 0; font-family: system-ui; }
    header { background: #0f172a; color: white; padding: 1rem; }
    main { padding: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>Pure Aether App</h1>
    <p>No React. No Vue. No Angular. 2KB kernel.</p>
  </header>
  
  <main>
    <aether-runtime 
      id="main-app"
      endpoint="http://localhost:8787/dai"
      namespace="pure-aether"
      mood="neutral"
      style="display: block; min-height: 80vh;">
    </aether-runtime>
  </main>
  
  <script type="module">
    // Net-new: Aether checks edge eligibility on load
    import { AetherAdapter } from '../../src/adapter/aether-adapter.js';
    
    const adapter = new AetherAdapter();
    
    adapter.netNew(window.location.pathname, 'http://localhost:8787')
      .then(eligible => {
        console.log('Net-new eligible:', eligible);
        // If eligible, edge config applied
        // If not, falls back to origin SSE
      });
  </script>
</body>
</html>
```

**End of Day 4 deliverable:** All 3 modes demonstrated.

---

## Day 5-6: Dashboard + Chat Examples

### Day 5: Multi-Agent Dashboard

**File:** `examples/dashboard/index.html`

```html
<!-- 3 tabs, 3 agents, 1 SSE connection -->
<!-- Planner, Executor, Critic consensus visualization -->
```

Key features:
- Tab switching without SSE reconnect
- Conductor layer demo (agent states)
- Kinetic governance (tempo = confidence)

### Day 6: Streaming Chat

**File:** `examples/chat/index.html`

```html
<!-- No React, live typing, message slivers -->
<!-- Streaming text injection -->
<!-- Focus preservation across messages -->
```

**End of Day 6:** 5 working examples.

---

## Day 7-8: Edge Deployment

### Day 7: Cloudflare Worker

**File:** `edge/cloudflare-worker.js`

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/dai') {
      return handleSSE(request, env, ctx);
    }
    
    if (url.pathname === '/check') {
      return checkEligibility(url);
    }
    
    return env.ASSETS.fetch(request);
  }
};

async function handleSSE(request, env, ctx) {
  const agentId = new URL(request.url).searchParams.get('namespace');
  const lastId = request.headers.get('Last-Event-ID');
  
  // Intent resolution (10ms target)
  const intent = await env.KV.get(`intent:${agentId}`, { type: 'json' });
  
  // Sliver lookup
  const sliver = await env.KV.get(`sliver:${intent.sliverId}`);
  
  // State cache
  const state = lastId 
    ? await env.KV.get(`state:${agentId}`, { type: 'json' }) || {}
    : {};

  const stream = new ReadableStream({
    start(controller) {
      // Snapshot on reconnect
      if (lastId) {
        controller.enqueue(formatMessage({
          phase: 'snapshot',
          vars: state.vars,
          content: state.content
        }));
      }
      
      // Live pulses
      const interval = setInterval(() => {
        const pulse = generatePulse(intent, state);
        controller.enqueue(formatMessage(pulse));
      }, 50);
      
      ctx.waitUntil(closeOnAbort(request, interval, () => {
        env.KV.put(`state:${agentId}`, JSON.stringify(state));
      }));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

function formatMessage(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function closeOnAbort(request, interval, cleanup) {
  return new Promise(resolve => {
    request.signal.addEventListener('abort', () => {
      clearInterval(interval);
      cleanup();
      resolve();
    });
  });
}
```

### Day 8: Vercel Edge + Benchmarks

**File:** `edge/vercel-edge-function.js`

```javascript
export const config = { runtime: 'edge' };

export default async function handler(request) {
  // Vercel Edge equivalent of Cloudflare Worker
}
```

**File:** `benchmarks/tti-test.js`

```javascript
// Playwright automated TTI measurement
// React vs A2UI vs Aether comparison
```

**End of Day 8:** Edge deployed, benchmarks running.

---

## Day 9: Documentation

**Files:**

- `docs/ARCHITECTURE.md` (comprehensive)
- `docs/ADAPTER.md` (3-mode guide with GIFs)
- `docs/EDS.md` (design system mapping)
- `docs/EDGE.md` (deployment)
- `docs/BENCHMARKS.md` (numbers)
- `docs/API.md` (reference)

---

## Day 10: Paper + Launch

**File:** `paper/main.tex`

```latex
\documentclass{article}
\title{Semantic Projection: Zero-Hydration UI for Agentic Systems}
\author{Aether UI Project}
\begin{document}
\maketitle
\begin{abstract}
We demonstrate that pre-computed sliver graphs streamed via Server-Sent Events eliminate the hydration tax of generative UI frameworks...
\end{abstract}
\end{document}
```

**Launch sequence:**

```bash
# 00:00 PST
git push origin main  # Repo public
arxiv upload paper/main.tex  # arXiv submit

# 00:05 PST
# HN "Show HN: Aether UI – 2KB zero-hydration framework"
# Twitter thread
```

---

## Daily Verification Checklist

| Day | Check | Command |
|-----|-------|---------|
| 1 | Kernel <= 2KB | `npm run size` |
| 2 | Tests pass | `npm test` |
| 3 | Snap-in works | `npm run dev`, open /examples/weather |
| 4 | Jump-in works | Click button, measure timing |
| 5 | Dashboard loads | 3 tabs, SSE connected |
| 6 | Chat streams | Type, see projection |
| 7 | Edge deploys | `wrangler deploy` |
| 8 | Benchmarks run | `npm run benchmark` |
| 9 | Docs complete | All 6 files exist |
| 10 | Repo public | GitHub settings, arXiv submit |

---

**Ready. Start Day 1.**