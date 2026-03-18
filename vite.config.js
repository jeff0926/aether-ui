import { defineConfig } from 'vite';

// Mock SSE plugin for development
function mockSSEPlugin() {
  return {
    name: 'mock-sse',
    configureServer(server) {
      server.middlewares.use('/api/sse', (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        const namespace = new URL(req.url, 'http://localhost').searchParams.get('namespace');

        // Multi-agent dashboard
        if (namespace === 'multi-agent') {
          const thoughts = [
            { planner: 'Analyzing task requirements...', executor: 'Preparing execution plan...', critic: 'Reviewing approach...' },
            { planner: 'Identified 3 subtasks', executor: 'Allocated resources', critic: 'Approach looks sound' },
            { planner: 'Optimizing sequence', executor: 'Running subtask 1/3', critic: 'Progress nominal' },
            { planner: 'Adjusting based on feedback', executor: 'Running subtask 2/3', critic: 'Minor efficiency concern' },
            { planner: 'Final optimization', executor: 'Running subtask 3/3', critic: 'Quality verified' }
          ];
          const decisions = ['Proceed with Plan A', 'Optimize resources', 'Scale horizontally', 'Maintain current state'];
          let tick = 0;

          res.write(`data: ${JSON.stringify({
            phase: 'reflex',
            vars: { '--tempo': '0.3s' },
            content: {
              'planner-thought': 'Initializing strategic analysis...',
              'planner-confidence': '75%',
              'planner-status': 'Active',
              'executor-thought': 'Standing by for instructions...',
              'executor-confidence': '60%',
              'executor-status': 'Ready',
              'critic-thought': 'Monitoring system state...',
              'critic-confidence': '82%',
              'critic-status': 'Observing',
              'consensus-decision': 'Gathering agent inputs...',
              'consensus-detail': 'Agents are synchronizing...'
            }
          })}\n\n`);

          const interval = setInterval(() => {
            const thought = thoughts[tick % thoughts.length];
            const decision = decisions[tick % decisions.length];
            res.write(`data: ${JSON.stringify({
              phase: 'deliberation',
              content: {
                'planner-thought': thought.planner,
                'planner-confidence': (70 + Math.floor(Math.random() * 20)) + '%',
                'executor-thought': thought.executor,
                'executor-confidence': (55 + Math.floor(Math.random() * 25)) + '%',
                'critic-thought': thought.critic,
                'critic-confidence': (75 + Math.floor(Math.random() * 20)) + '%',
                'consensus-decision': decision,
                'consensus-detail': `Agreement reached at ${new Date().toLocaleTimeString()}`,
                'planner-vote': tick % 2 === 0 ? 'Approve' : 'Suggest revision',
                'executor-vote': 'Ready to execute',
                'critic-vote': tick % 3 === 0 ? 'Approved' : 'Needs review',
                'timeline-0': thought.planner,
                'timeline-1': thought.executor,
                'timeline-2': thought.critic
              }
            })}\n\n`);
            tick++;
          }, 2000);

          req.on('close', () => clearInterval(interval));
          return;
        }

        // Chat streaming
        if (namespace === 'streaming-chat') {
          const messages = [
            'Hello! I\'m your AI assistant.',
            'I can help you with various tasks.',
            'Just type your question below.',
            'I\'ll respond in real-time via SSE.',
            'No React hydration required!'
          ];
          let msgIndex = 0;
          let charIndex = 0;

          res.write(`data: ${JSON.stringify({
            phase: 'reflex',
            content: { 'chat-status': 'Connected', 'current-message': '' }
          })}\n\n`);

          const interval = setInterval(() => {
            const currentMsg = messages[msgIndex % messages.length];
            if (charIndex <= currentMsg.length) {
              res.write(`data: ${JSON.stringify({
                phase: 'deliberation',
                content: {
                  'current-message': currentMsg.substring(0, charIndex),
                  'chat-status': charIndex < currentMsg.length ? 'Typing...' : 'Ready'
                }
              })}\n\n`);
              charIndex++;
            } else {
              charIndex = 0;
              msgIndex++;
            }
          }, 50);

          req.on('close', () => clearInterval(interval));
          return;
        }

        // Dashboard namespace - for jump-in and net-new examples
        if (namespace === 'fast-dashboard' || namespace === 'pure-aether') {
          res.write(`data: ${JSON.stringify({
            phase: 'reflex',
            vars: {
              '--accent-color': '#22c55e',
              '--tempo': '0.2s'
            },
            content: {
              'cpu': '42%',
              'memory': '2.1GB',
              'requests': '1,247'
            }
          })}\n\n`);

          let tick = 0;
          const interval = setInterval(() => {
            const cpu = 30 + Math.floor(Math.random() * 40);
            const memory = (1.8 + Math.random() * 0.8).toFixed(1);
            const requests = 1000 + Math.floor(Math.random() * 500);
            const color = cpu > 60 ? '#f59e0b' : cpu > 80 ? '#dc2626' : '#22c55e';

            res.write(`data: ${JSON.stringify({
              phase: tick % 10 === 0 ? 'complete' : 'deliberation',
              vars: {
                '--accent-color': color
              },
              content: {
                'cpu': cpu + '%',
                'memory': memory + 'GB',
                'requests': requests.toLocaleString()
              }
            })}\n\n`);
            tick++;
          }, 1000);

          req.on('close', () => clearInterval(interval));
          return;
        }

        // Weather namespace - for snap-in example
        res.write(`data: ${JSON.stringify({
          phase: 'reflex',
          vars: {
            '--accent-color': '#0ea5e9',
            '--background-subtle': '#f0f9ff',
            '--tempo': '0.3s'
          },
          content: {
            'alert-title': 'Weather Alert Active',
            'alert-body': 'Monitoring conditions...',
            'alert-time': new Date().toLocaleTimeString()
          }
        })}\n\n`);

        // Send periodic updates
        const alerts = [
          { title: 'Wind Advisory', body: 'Gusts up to 45 mph expected', color: '#f59e0b' },
          { title: 'Heat Warning', body: 'Temperature exceeding 95°F', color: '#dc2626' },
          { title: 'Air Quality Alert', body: 'Moderate air quality index', color: '#8b5cf6' },
          { title: 'Clear Conditions', body: 'No active weather alerts', color: '#22c55e' }
        ];

        let index = 0;
        const interval = setInterval(() => {
          const alert = alerts[index % alerts.length];
          res.write(`data: ${JSON.stringify({
            phase: 'deliberation',
            vars: {
              '--accent-color': alert.color,
              '--background-subtle': alert.color + '15'
            },
            content: {
              'alert-title': alert.title,
              'alert-body': alert.body,
              'alert-time': new Date().toLocaleTimeString()
            }
          })}\n\n`);
          index++;
        }, 3000);

        req.on('close', () => {
          clearInterval(interval);
        });
      });

      server.middlewares.use('/check', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ eligible: true, config: {} }));
      });

      // /api/check endpoint for net-new mode
      server.middlewares.use('/api/check', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ eligible: true, config: { endpoint: '/api/sse', namespace: 'pure-aether' } }));
      });

      // /dai as alias for /api/sse
      server.middlewares.use('/dai', (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        const namespace = new URL(req.url, 'http://localhost').searchParams.get('namespace') || 'default';

        // Default dashboard data
        res.write(`data: ${JSON.stringify({
          phase: 'reflex',
          vars: { '--accent-color': '#22c55e', '--tempo': '0.2s' },
          content: { 'cpu': '42%', 'memory': '2.1GB', 'requests': '1,247', 'status': 'Connected' }
        })}\n\n`);

        let tick = 0;
        const interval = setInterval(() => {
          const cpu = 30 + Math.floor(Math.random() * 40);
          res.write(`data: ${JSON.stringify({
            phase: 'deliberation',
            vars: { '--accent-color': cpu > 60 ? '#f59e0b' : '#22c55e' },
            content: {
              'cpu': cpu + '%',
              'memory': (1.8 + Math.random() * 0.8).toFixed(1) + 'GB',
              'requests': (1000 + Math.floor(Math.random() * 500)).toLocaleString()
            }
          })}\n\n`);
          tick++;
        }, 1000);

        req.on('close', () => clearInterval(interval));
      });
    }
  };
}

export default defineConfig({
  plugins: [mockSSEPlugin()],
  server: {
    port: 5173
  }
});
