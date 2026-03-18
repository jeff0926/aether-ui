# Edge Deployment Guide

## Supported Platforms

| Platform | Runtime | Storage | SSE Support |
|----------|---------|---------|-------------|
| Cloudflare Workers | V8 isolates | KV, R2 | Native Web Streams |
| Vercel Edge Functions | Node.js compat | Edge Config | Native |
| Deno Deploy | Deno | KV | Native |
| Fastly Compute@Edge | WASM | Config store | Native |

## Cloudflare Workers

### Setup

1. Install Wrangler:
```bash
npm install -g wrangler
wrangler login
```

2. Configure `wrangler.toml`:
```toml
name = "aether-ui"
main = "edge/cloudflare-worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

3. Deploy:
```bash
npm run build
wrangler deploy
```

### KV Storage (Optional)

For state caching:

```bash
wrangler kv:namespace create "AETHER_STATE"
```

Add to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV"
id = "your-namespace-id"
```

### Worker Code

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/dai') {
      return handleSSE(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleSSE(request, env, ctx) {
  const namespace = new URL(request.url).searchParams.get('namespace');

  const stream = new ReadableStream({
    start(controller) {
      // Send pulses
      const interval = setInterval(() => {
        const pulse = generatePulse(namespace);
        controller.enqueue(`data: ${JSON.stringify(pulse)}\n\n`);
      }, 1000);

      ctx.waitUntil(closeOnAbort(request, interval));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

## Vercel Edge Functions

### Setup

1. Create `api/sse.js`:
```javascript
export const config = { runtime: 'edge' };

export default async function handler(request) {
  // Same SSE logic
}
```

2. Deploy:
```bash
vercel deploy
```

### Limitations
- 25s max duration (hobby tier)
- 30s max duration (pro tier)

## SSE Best Practices

### Connection Management

```javascript
// Client-side reconnection
const connect = () => {
  const es = new EventSource('/dai?namespace=alerts');

  es.onopen = () => console.log('Connected');

  es.onerror = () => {
    es.close();
    setTimeout(connect, 1000); // Exponential backoff
  };
};
```

### State Caching

Store last-known state for instant reconnection:

```javascript
// Edge: Save state
await env.KV.put(`state:${agentId}`, JSON.stringify({
  vars: currentVars,
  content: currentContent,
  timestamp: Date.now()
}));

// Edge: Restore on reconnect
const lastEventId = request.headers.get('Last-Event-ID');
if (lastEventId) {
  const state = await env.KV.get(`state:${agentId}`, { type: 'json' });
  // Send snapshot immediately
}
```

### CORS Configuration

```javascript
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'X-Accel-Buffering': 'no' // Disable proxy buffering
};
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Cold start | <50ms |
| Intent resolution | <10ms |
| First pulse | <20ms |
| Pulse interval | 50ms (20fps max) |

## Monitoring

Add timing headers:

```javascript
const start = Date.now();
const intent = await resolveIntent(agentId, env);

return new Response(stream, {
  headers: {
    'X-Aether-Intent-Time': `${Date.now() - start}ms`
  }
});
```
