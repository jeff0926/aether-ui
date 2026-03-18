# Aether Adapter: 3-Mode Integration Guide

The Aether Adapter provides three integration modes for different migration scenarios.

## Mode 1: Snap-In (Coexistence)

Host framework and Aether share the DOM. Aether claims a subtree.

**Use when:** Adding Aether to existing app without replacing current UI.

```javascript
import { AetherAdapter } from 'aether-ui/adapter';

const adapter = new AetherAdapter();

// Aether claims #alert-panel while React owns the rest
adapter.snapIn('#alert-panel', {
  endpoint: '/api/sse',
  namespace: 'weather-alert',
  mood: 'urgent'
});
```

**HTML Result:**
```html
<div id="react-root">
  <!-- React components -->
</div>
<div id="alert-panel">
  <aether-runtime endpoint="/api/sse" namespace="weather-alert">
    <!-- Aether projects here -->
  </aether-runtime>
</div>
```

## Mode 2: Jump-In (Replacement)

Aether intercepts data, unmounts React, claims territory.

**Use when:** Migrating a React component to Aether for better performance.

```javascript
import { AetherAdapter } from 'aether-ui/adapter';

const adapter = new AetherAdapter();

// Measure before: React renders 100 items (200ms)
// Measure after: Aether SSE projection (20ms)

adapter.jumpIn('react-root', {
  endpoint: '/api/sse',
  namespace: 'fast-dashboard',
  transformer: (reactProps) => ({
    // Convert React props to Canonical Model
    itemCount: reactProps.items.length,
    lastUpdate: Date.now()
  })
});
```

**What happens:**
1. Extract React props from fiber
2. Transform to Canonical Model
3. Unmount React tree
4. Mount `<aether-runtime>` in same container
5. Connect SSE stream

## Mode 3: Net-New (Edge-Native)

No host framework. Edge function pre-checks route, injects kernel, skips React bundle entirely.

**Use when:** Building new pages/apps with Aether from scratch.

```javascript
import { AetherAdapter } from 'aether-ui/adapter';

const adapter = new AetherAdapter();

// Check if route is Aether-eligible
adapter.netNew('/dashboard/*', '/api')
  .then(eligible => {
    if (eligible) {
      // Edge config applied, no React bundle loaded
      console.log('Running in pure Aether mode');
    }
  });
```

**Edge Worker Logic:**
```javascript
// Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (await isAetherRoute(url.pathname)) {
      // Return minimal HTML shell with 2KB kernel
      return new Response(generateAetherShell(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Fallback to full React bundle
    return env.ASSETS.fetch(request);
  }
};
```

## Data Interception

Intercept existing fetch calls and transform to Canonical Model:

```javascript
adapter.interceptFetch('/api/weather', (data) => ({
  // Heavy API response → Canonical Model
  location: data.location.city,
  temperature: data.current.temp_f,
  condition: data.current.condition.text
}));
```

## Broadcasting Events

Send data to all Aether runtimes:

```javascript
adapter.broadcast('update', {
  timestamp: Date.now(),
  source: 'manual-refresh'
});
```

Aether runtimes receive via custom event:
```javascript
runtime.addEventListener('aether:update', (e) => {
  console.log(e.detail); // { timestamp, source }
});
```

## Integration Matrix

| Mode | Existing Framework | Bundle Size | Migration Effort |
|------|-------------------|-------------|------------------|
| Snap-In | Keep 100% | +2KB | Low |
| Jump-In | Replace parts | -varies | Medium |
| Net-New | None | 2KB only | New build |

## Best Practices

1. **Start with Snap-In** - Add Aether alongside existing UI
2. **Measure Performance** - Compare React vs Aether TTI
3. **Jump-In High-Traffic** - Replace performance-critical components
4. **Net-New for New Features** - Build new pages in pure Aether
