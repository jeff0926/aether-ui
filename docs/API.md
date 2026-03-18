# Aether UI API Reference

## AetherKernel

The core runtime class that manages SSE connections and DOM projection.

### Constructor

```javascript
new AetherKernel(container, config)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | HTMLElement | DOM element to project into |
| `config.endpoint` | string | SSE endpoint URL |
| `config.namespace` | string | Agent namespace identifier |

### Methods

#### `applyVariables(vars)`
Apply CSS custom properties to the container.

```javascript
kernel.applyVariables({
  '--accent-color': '#dc2626',
  '--tempo': '0.15s'
});
```

#### `injectContent(contentMap)`
Inject text content into slots (XSS-safe via `textContent`).

```javascript
kernel.injectContent({
  'title': 'Hello World',
  'body': 'Content here'
});
```

#### `preserveFocus()`
Save current focus position for restoration after projection.

#### `restoreFocus()`
Restore focus to previously focused element.

#### `destroy()`
Close SSE connection and clean up resources.

---

## AetherRuntime (Web Component)

Custom element for declarative Aether integration.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `endpoint` | string | SSE endpoint URL |
| `namespace` | string | Agent namespace |
| `mood` | string | Visual mood (affects `--mood` variable) |

### Usage

```html
<aether-runtime
  endpoint="/api/sse"
  namespace="weather-alert"
  mood="urgent">
  <div data-aether-slot="title"></div>
  <div data-aether-slot="body"></div>
</aether-runtime>
```

### Data Attributes (Set by Kernel)

| Attribute | Meaning |
|-----------|---------|
| `data-aether-connected` | SSE connection established |
| `data-aether-error` | Connection error occurred |

### CSS Styling

```css
/* Connected state */
aether-runtime[data-aether-connected] {
  opacity: 1;
}

/* Error state */
aether-runtime[data-aether-error] {
  border-color: var(--error, #dc2626);
}
```

---

## AetherAdapter

Integration adapter for existing frameworks.

### Constructor

```javascript
new AetherAdapter(options)
```

### Methods

#### `snapIn(selector, config)`
Mount Aether runtime alongside existing UI.

```javascript
adapter.snapIn('#sidebar', {
  endpoint: '/api/sse',
  namespace: 'notifications'
});
```

Returns: `HTMLElement` (the created aether-runtime)

#### `jumpIn(rootId, config)`
Replace existing framework with Aether.

```javascript
adapter.jumpIn('react-root', {
  endpoint: '/api/sse',
  namespace: 'dashboard',
  transformer: (props) => canonicalModel
});
```

| Config | Type | Description |
|--------|------|-------------|
| `endpoint` | string | SSE endpoint |
| `namespace` | string | Agent namespace |
| `transformer` | function | Convert React props to Canonical Model |

#### `netNew(routePattern, edgeEndpoint)`
Check edge eligibility for pure Aether mode.

```javascript
const eligible = await adapter.netNew('/dashboard/*', '/api');
```

Returns: `Promise<boolean>`

#### `interceptFetch(url, transformer)`
Intercept fetch calls and transform responses.

```javascript
adapter.interceptFetch('/api/data', (data) => ({
  simplified: data.nested.value
}));
```

#### `broadcast(event, data)`
Send custom event to all Aether runtimes.

```javascript
adapter.broadcast('refresh', { timestamp: Date.now() });
```

---

## SSE Message Format

### Pulse Object

```typescript
interface Pulse {
  phase: 'reflex' | 'deliberation' | 'complete' | 'ghost';
  vars?: Record<string, string>;
  content?: Record<string, string>;
}
```

### Example Messages

```json
// Initial connection
{
  "phase": "reflex",
  "vars": {
    "--accent-color": "#0ea5e9",
    "--tempo": "0.3s"
  },
  "content": {
    "status": "Connected"
  }
}

// Update
{
  "phase": "deliberation",
  "content": {
    "title": "Weather Alert",
    "body": "High winds expected"
  }
}

// Complete
{
  "phase": "complete",
  "vars": {
    "--accent-color": "#22c55e"
  }
}
```

---

## Slot Attributes

### `data-aether-slot`
Mark an element as a content slot.

```html
<h2 data-aether-slot="title"></h2>
<p data-aether-slot="body"></p>
```

### `data-aether-possessable`
Mark a host component as possessable by Aether.

```html
<div class="eds-card" data-aether-possessable="true">
  <!-- Aether can inject CSS variables here -->
</div>
```

---

## CSS Custom Properties

Standard tokens all themes should support:

| Token | Purpose | Default |
|-------|---------|---------|
| `--tempo` | Animation duration | 0.3s |
| `--accent-color` | Primary action color | #0ea5e9 |
| `--background-subtle` | Secondary surfaces | #f8fafc |
| `--error` | Error state color | #dc2626 |
| `--success` | Success state color | #22c55e |
