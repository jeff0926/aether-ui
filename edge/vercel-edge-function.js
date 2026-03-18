/**
 * Aether UI Edge Function for Vercel
 * Handles SSE streaming with Vercel Edge Runtime
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
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
  if (url.pathname === '/api/dai' || url.pathname === '/api/sse') {
    return handleSSE(request);
  }

  // Eligibility check
  if (url.pathname === '/api/check') {
    return handleEligibilityCheck(url);
  }

  return new Response('Not Found', { status: 404 });
}

/**
 * Handle Server-Sent Events stream
 */
async function handleSSE(request) {
  const url = new URL(request.url);
  const namespace = url.searchParams.get('namespace') || 'default';
  const lastEventId = request.headers.get('Last-Event-ID');

  let eventId = parseInt(lastEventId) || 0;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send SSE message helper
      const send = (data, event = 'message') => {
        eventId++;
        let message = `id: ${eventId}\n`;
        if (event !== 'message') message += `event: ${event}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Initial pulse
      send(generatePulse(namespace, 'reflex'));

      // Live pulses
      const interval = setInterval(() => {
        try {
          send(generatePulse(namespace, 'deliberation'));
        } catch (e) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Vercel edge functions have max duration, handle cleanup
      setTimeout(() => {
        clearInterval(interval);
        send({ phase: 'complete' });
        controller.close();
      }, 25000); // 25s max for Vercel hobby tier
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    }
  });
}

/**
 * Generate pulse data based on namespace
 */
function generatePulse(namespace, phase) {
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
          'current-message': 'Hello from Vercel Edge!'
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
function handleEligibilityCheck(url) {
  const route = url.searchParams.get('route') || '/';
  const eligiblePatterns = ['/dashboard', '/chat', '/weather', '/net-new'];
  const eligible = eligiblePatterns.some(p => route.includes(p));

  return new Response(JSON.stringify({
    eligible,
    config: eligible ? { endpoint: '/api/dai', namespace: 'pure-aether' } : null
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
