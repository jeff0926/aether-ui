/**
 * Aether UI Edge Worker for Cloudflare
 * Handles SSE streaming, intent resolution, and state caching
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Last-Event-ID'
        }
      });
    }

    // SSE endpoint
    if (url.pathname === '/dai' || url.pathname === '/api/sse') {
      return handleSSE(request, env, ctx);
    }

    // Eligibility check for net-new mode
    if (url.pathname === '/check') {
      return handleEligibilityCheck(url, env);
    }

    // Sliver lookup
    if (url.pathname.startsWith('/sliver/')) {
      return handleSliverLookup(url, env);
    }

    // Static assets fallback
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
  }
};

/**
 * Handle Server-Sent Events stream
 */
async function handleSSE(request, env, ctx) {
  const url = new URL(request.url);
  const namespace = url.searchParams.get('namespace') || 'default';
  const agentId = url.searchParams.get('agent') || namespace;
  const lastEventId = request.headers.get('Last-Event-ID');

  // Intent resolution (target: <10ms)
  const intent = await resolveIntent(agentId, env);

  // Sliver lookup (cached in KV)
  const sliver = intent.sliverId
    ? await env.KV?.get(`sliver:${intent.sliverId}`)
    : null;

  // State cache for reconnections
  const stateCache = lastEventId
    ? await env.KV?.get(`state:${agentId}`, { type: 'json' }) || {}
    : {};

  let eventId = parseInt(lastEventId) || 0;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      const send = (data, event = 'message') => {
        eventId++;
        let message = `id: ${eventId}\n`;
        if (event !== 'message') message += `event: ${event}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Immediate snapshot on reconnection
      if (lastEventId && Object.keys(stateCache).length > 0) {
        send({
          phase: 'snapshot',
          vars: stateCache.vars || {},
          content: stateCache.content || {}
        }, 'snapshot');
      }

      // Initial pulse
      send(generatePulse(namespace, 'reflex', stateCache));

      // Live pulses at ~20fps max (50ms interval)
      const interval = setInterval(() => {
        const pulse = generatePulse(namespace, 'deliberation', stateCache);
        send(pulse);

        // Update state cache
        if (pulse.vars) stateCache.vars = { ...stateCache.vars, ...pulse.vars };
        if (pulse.content) stateCache.content = { ...stateCache.content, ...pulse.content };
      }, 1000); // 1s for demo, can be 50ms in production

      // Cleanup on disconnect
      ctx.waitUntil(
        closeOnAbort(request, interval, async () => {
          // Persist state cache
          if (env.KV) {
            await env.KV.put(`state:${agentId}`, JSON.stringify({
              ...stateCache,
              lastPulse: Date.now()
            }));
          }
        })
      );
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Disable proxy buffering
    }
  });
}

/**
 * Resolve intent from agent ID (would use vector lookup in production)
 */
async function resolveIntent(agentId, env) {
  // In production: HNSW vector index lookup
  // For demo: simple mapping
  const intents = {
    'weather-alert': { sliverId: 'weather-card', mood: 'urgent' },
    'fast-dashboard': { sliverId: 'metrics-dashboard', mood: 'neutral' },
    'multi-agent': { sliverId: 'agent-consensus', mood: 'collaborative' },
    'streaming-chat': { sliverId: 'chat-interface', mood: 'conversational' },
    'pure-aether': { sliverId: 'full-dashboard', mood: 'neutral' }
  };

  return intents[agentId] || { sliverId: 'default', mood: 'neutral' };
}

/**
 * Generate pulse data based on namespace
 */
function generatePulse(namespace, phase, stateCache) {
  const timestamp = new Date().toLocaleTimeString();

  switch (namespace) {
    case 'weather-alert':
    case 'secondary-alert':
      const alerts = [
        { title: 'Wind Advisory', body: 'Gusts up to 45 mph', color: '#f59e0b' },
        { title: 'Heat Warning', body: 'Temperature over 95°F', color: '#dc2626' },
        { title: 'Clear Skies', body: 'No active alerts', color: '#22c55e' }
      ];
      const alert = alerts[Math.floor(Math.random() * alerts.length)];
      return {
        phase,
        vars: {
          '--accent-color': alert.color,
          '--background-subtle': alert.color + '15',
          '--tempo': '0.3s'
        },
        content: {
          'alert-title': alert.title,
          'alert-body': alert.body,
          'alert-time': timestamp
        }
      };

    case 'fast-dashboard':
    case 'pure-aether':
      const cpu = 30 + Math.floor(Math.random() * 40);
      return {
        phase,
        vars: {
          '--accent-color': cpu > 60 ? '#f59e0b' : '#22c55e',
          '--tempo': '0.2s'
        },
        content: {
          'cpu': cpu + '%',
          'memory': (1.8 + Math.random() * 0.8).toFixed(1) + 'GB',
          'requests': (1000 + Math.floor(Math.random() * 500)).toLocaleString()
        }
      };

    case 'multi-agent':
      return {
        phase,
        vars: { '--tempo': '0.3s' },
        content: {
          'planner-thought': 'Analyzing task requirements...',
          'planner-confidence': (70 + Math.floor(Math.random() * 20)) + '%',
          'executor-thought': 'Preparing execution...',
          'executor-confidence': (55 + Math.floor(Math.random() * 25)) + '%',
          'critic-thought': 'Reviewing approach...',
          'critic-confidence': (75 + Math.floor(Math.random() * 20)) + '%',
          'consensus-decision': 'Proceed with Plan A',
          'consensus-detail': `Updated at ${timestamp}`
        }
      };

    case 'streaming-chat':
      return {
        phase,
        content: {
          'chat-status': 'Connected',
          'current-message': 'Hello! How can I help you today?'
        }
      };

    default:
      return {
        phase,
        vars: { '--tempo': '0.3s' },
        content: { 'status': 'Connected', 'timestamp': timestamp }
      };
  }
}

/**
 * Handle eligibility check for net-new mode
 */
async function handleEligibilityCheck(url, env) {
  const route = url.searchParams.get('route') || '/';

  // In production: check route against Aether-eligible patterns
  const eligiblePatterns = ['/dashboard', '/chat', '/weather', '/net-new'];
  const eligible = eligiblePatterns.some(p => route.includes(p));

  return new Response(JSON.stringify({
    eligible,
    config: eligible ? {
      endpoint: '/dai',
      namespace: 'pure-aether'
    } : null
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle sliver template lookup
 */
async function handleSliverLookup(url, env) {
  const sliverId = url.pathname.replace('/sliver/', '');

  if (env.KV) {
    const sliver = await env.KV.get(`sliver:${sliverId}`);
    if (sliver) {
      return new Response(sliver, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Sliver not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Helper to handle connection abort
 */
function closeOnAbort(request, interval, cleanup) {
  return new Promise(resolve => {
    request.signal.addEventListener('abort', async () => {
      clearInterval(interval);
      await cleanup();
      resolve();
    });
  });
}
