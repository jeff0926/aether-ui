# Aether UI Examples

## Technical Reference Implementation Suite

This directory contains a comprehensive set of reference implementations demonstrating Aether UI's zero-hydration projection architecture. Each example is designed to validate specific architectural claims and provide measurable performance benchmarks against traditional approaches.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AETHER PROJECTION MODEL                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Agent/Edge          SSE Transport           Browser Surface           │
│   ┌─────────┐        ┌───────────┐           ┌─────────────┐           │
│   │ Intent  │───────▶│  Sliver   │──────────▶│   Kernel    │           │
│   │ Engine  │        │  Stream   │           │   (2KB)     │           │
│   └─────────┘        └───────────┘           └──────┬──────┘           │
│                                                      │                  │
│                                              ┌───────▼───────┐          │
│                                              │ CSS Variables │          │
│                                              │ Slot Content  │          │
│                                              └───────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Invariant:** The browser executes no application logic. All intelligence resides in the agent/edge layer. The kernel is a pure projection surface.

---

## Example Matrix

| Example | Integration Mode | Primary Validation | Complexity |
|---------|------------------|-------------------|------------|
| [weather](./weather/) | Snap-In | React coexistence | Low |
| [jump-in](./jump-in/) | Jump-In | React replacement | Medium |
| [net-new](./net-new/) | Net-New | Zero-framework greenfield | Low |
| [dashboard](./dashboard/) | Multi-Agent | Orchestrator consensus | High |
| [chat](./chat/) | Streaming | Character-level projection | Medium |
| [eds-leapfrog](./eds-leapfrog/) | Enterprise | Adobe EDS comparison | High |

---

## Integration Modes

### Mode 1: Snap-In
**Use Case:** Existing React/Vue application needs real-time components without framework overhead.

```
┌────────────────────────────────────────┐
│           Host Application             │
│  ┌──────────────┐  ┌────────────────┐  │
│  │    React     │  │ <aether-runtime>│ │
│  │  Component   │  │   2KB kernel    │ │
│  │   (40KB+)    │  │   SSE stream    │ │
│  └──────────────┘  └────────────────┘  │
└────────────────────────────────────────┘
```

**Example:** `weather/` - React manages static content, Aether handles real-time alerts.

### Mode 2: Jump-In
**Use Case:** Migrate specific React components to Aether without full rewrite.

```
Before:                          After:
┌──────────────────┐            ┌──────────────────┐
│  React Component │            │ <aether-runtime> │
│    (40KB JS)     │  ──────▶   │    (2KB JS)      │
│  Hydration: 200ms│            │  TTI: <50ms      │
└──────────────────┘            └──────────────────┘
```

**Example:** `jump-in/` - React dashboard replaced with Aether projection.

### Mode 3: Net-New
**Use Case:** Greenfield projects with no legacy framework requirements.

```
┌────────────────────────────────────────┐
│         Pure Aether Application        │
│  ┌──────────────────────────────────┐  │
│  │      Static HTML Shell           │  │
│  │  + data-aether-slot attributes   │  │
│  │  + 2KB kernel                    │  │
│  │  + SSE connection                │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Example:** `net-new/` - Zero framework dependencies.

---

## Performance Targets

All examples are designed to meet or exceed these benchmarks:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Kernel Size | ≤2KB gzipped | `gzip -c dist/aether-kernel.min.js \| wc -c` |
| Time to Interactive | <50ms | Lighthouse, Performance API |
| First Contentful Paint | <30ms | Performance API |
| Main Thread Blocking | 0ms | Chrome DevTools |
| Memory Footprint | <1MB | Chrome DevTools Memory |
| SSE Reconnection | <100ms | Network throttling tests |

---

## Running Examples

### Prerequisites
```bash
cd aether-ui
npm install
npm run build  # Builds kernel to dist/
```

### Development Server
```bash
npm run dev
# Server starts at http://localhost:5173 (or next available port)
```

### Example URLs
- http://localhost:5173/examples/weather/
- http://localhost:5173/examples/jump-in/
- http://localhost:5173/examples/net-new/
- http://localhost:5173/examples/dashboard/
- http://localhost:5173/examples/chat/
- http://localhost:5173/examples/eds-leapfrog/

---

## SSE Mock Endpoints

The development server provides mock SSE endpoints for testing:

| Endpoint | Namespace | Update Frequency | Use Case |
|----------|-----------|------------------|----------|
| `/api/sse` | `weather-alert` | 3s | Weather alerts |
| `/api/sse` | `secondary-alert` | 3s | Secondary alerts |
| `/api/sse` | `fast-dashboard` | 1s | Dashboard metrics |
| `/api/sse` | `multi-agent` | 2s | Agent consensus |
| `/api/sse` | `streaming-chat` | 50ms | Character streaming |
| `/api/sse` | `eds-demo` | 2.5s | EDS block updates |

---

## Validation Checklist

Each example should pass these validations:

- [ ] Kernel loads in <10ms
- [ ] SSE connection establishes in <100ms
- [ ] First content injection in <50ms
- [ ] No React/Vue/Angular dependencies (except snap-in mode)
- [ ] No console errors
- [ ] Graceful SSE reconnection on disconnect
- [ ] CSS variables animate with `--tempo` timing
- [ ] Focus preservation across updates

---

## For Scientists

These examples demonstrate a fundamental architectural shift in UI rendering:

**Traditional Model:** `Data → Framework → Virtual DOM → Reconciliation → DOM`

**Aether Model:** `Intent → Sliver → SSE → Kernel → DOM`

The key insight is that most UI frameworks solve a problem that shouldn't exist: reconciling client-side state with server-side truth. By treating the browser as a projection surface (analogous to a display terminal), we eliminate:

1. Client-side state management
2. Virtual DOM diffing
3. Hydration cycles
4. Framework parsing/execution

**Theoretical Basis:** See `paper/` directory for formal treatment.

---

## For React Developers

If you're familiar with React, Aether inverts several assumptions:

| React Assumption | Aether Approach |
|-----------------|-----------------|
| Components render on client | Slivers pre-computed on edge |
| State lives in component tree | State lives in agent/server |
| Events trigger re-renders | Events stream to server, projections stream back |
| Hydration required for interactivity | No hydration; kernel is always ready |

**Migration Path:** Start with `snap-in` mode (React + Aether coexistence), then `jump-in` to replace specific components, finally `net-new` for greenfield.

---

## For Adobe/Enterprise Developers

The `eds-leapfrog/` example specifically demonstrates how Aether can possess Adobe Experience Design System (EDS) blocks without the traditional AEM → React → EDS pipeline.

**Traditional Adobe Pipeline:**
```
Content → AEM → React Components → Server Render → EDS Blocks → Edge Cache
         ↓         ↓                    ↓              ↓
       200ms     40KB JS              300ms TTI      HTML output
```

**Aether Pipeline:**
```
Agent Intent → EDS Sliver (HTML) → SSE Stream → 2KB Kernel → DOM
      ↓              ↓                 ↓            ↓
    10ms          Static HTML       Real-time    <50ms TTI
```

Same visual output. 20x smaller payload. 12x faster TTI.

---

## Directory Structure

```
examples/
├── README.md                 # This file
├── weather/                  # Snap-in mode demo
│   ├── README.md
│   └── index.html
├── jump-in/                  # React replacement demo
│   ├── README.md
│   └── index.html
├── net-new/                  # Pure Aether demo
│   ├── README.md
│   └── index.html
├── dashboard/                # Multi-agent consensus
│   ├── README.md
│   └── index.html
├── chat/                     # Streaming text demo
│   ├── README.md
│   └── index.html
├── eds-leapfrog/             # Adobe EDS comparison
│   ├── README.md
│   ├── index.html
│   ├── adobe-way.html
│   ├── aether-way.html
│   ├── side-by-side.html
│   ├── blocks.html
│   └── blocks/
│       └── eds-blocks.css
├── diagrams/                 # Architecture SVGs
│   ├── README.md
│   ├── kernel-vs-react.svg
│   ├── orchestrator-mesh.svg
│   └── adapter-modes.svg
├── orchestrator-test.html    # Orchestrator demo
├── direct-test.html          # Kernel isolation test
├── kernel-test.html          # Constructor verification
└── debug-test.html           # Debug logging test
```

---

## Contributing

When adding new examples:

1. Create a new directory with descriptive name
2. Include `README.md` with technical specification
3. Demonstrate one specific architectural capability
4. Include performance measurements
5. Add SSE namespace to `vite.config.js` if needed
6. Update this index

---

*Aether UI Examples v0.2 | Zero-hydration projection runtime*
