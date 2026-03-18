# Aether UI Architecture

## Overview

Aether UI is a zero-hydration interface framework that inverts the traditional UI paradigm: instead of shipping JavaScript to render UI in the browser, we project pre-computed HTML slivers via Server-Sent Events (SSE) to a minimal 2KB kernel.

## Core Concepts

### The Inversion

| Traditional | Aether |
|------------|--------|
| Ship JS bundle (40-200KB) | 2KB kernel |
| Hydrate virtual DOM | Zero hydration |
| Client-side rendering | Server-side projection |
| React reconciliation | Direct DOM injection |

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                  EDGE LAYER                          │
│  Intent Resolution → Sliver Lookup → SSE Stream     │
└─────────────────────┬───────────────────────────────┘
                      │ SSE
┌─────────────────────▼───────────────────────────────┐
│                 ADAPTER LAYER                        │
│  Snap-In | Jump-In | Net-New Integration Modes      │
└─────────────────────┬───────────────────────────────┘
                      │ Custom Events
┌─────────────────────▼───────────────────────────────┐
│                 KERNEL LAYER                         │
│  SSE Client | CSS Injector | Slot Hydrator | Focus  │
└─────────────────────────────────────────────────────┘
```

## The 4-Step Pipeline

### 1. Ingestion & Semantic Sifting
Heavy JSON responses (100KB) are transformed to Canonical Models (~1KB signal) via adapters.

### 2. Intent Vector Matching
O(1) lookup maps situation → sliver ID using pre-computed embedding index.

### 3. DNA Hydration
Template + Canonical Model → HTML via string replacement (no DOM build).

### 4. Delta Projection
SSE stream delivers CSS variables first, HTML only if structural changes needed.

## Kernel Responsibilities

The 2KB kernel handles four tasks:

1. **SSE Connection Manager**
   - EventSource to edge endpoint
   - `Last-Event-ID` for reconnection
   - State cache for snapshot replay
   - Auto-reconnect with backoff

2. **CSS Variable Injector**
   - Receives `vars` payload
   - Applies to `:root` or scoped container
   - Transitions via `var(--tempo)`

3. **Slot Content Sanitizer**
   - Targets `data-aether-slot` attributes
   - Injects via `textContent` (XSS-safe)
   - Never uses `innerHTML`

4. **Focus Preservation Engine**
   - Saves `document.activeElement` path
   - Restores after projection complete

## SSE Message Format

```json
{
  "phase": "reflex|deliberation|complete|ghost",
  "vars": {
    "--accent-color": "#dc2626",
    "--tempo": "0.15s"
  },
  "content": {
    "slot-name": "content value"
  }
}
```

## Phase Types

| Phase | Meaning | Tempo |
|-------|---------|-------|
| reflex | Initial quick response | Fast (0.1s) |
| deliberation | Thinking/processing | Medium (0.3s) |
| complete | Final answer | Normal |
| ghost | Degraded state | Slow (0.5s) |

## Design System Integration

Aether doesn't ship HTML. Host provides semantic components. Agents possess them via CSS variables.

```html
<!-- Host component -->
<div class="eds-card" data-aether-possessable="true">
  <h3 data-aether-slot="title"></h3>
  <p data-aether-slot="body"></p>
</div>
```

See [EDS.md](./EDS.md) for design system mapping details.

## Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Kernel size (gzip) | ≤2KB | 819 bytes |
| Time to Interactive | <50ms | ~20ms |
| First Contentful Paint | <30ms | ~15ms |
| Lighthouse Performance | 95-100 | 98+ |
