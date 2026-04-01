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

        // ============================================
        // WS3: ALERT SYSTEM NAMESPACES
        // ============================================
        if (namespace === 'alert-system') {
          const phases = ['reflex', 'deliberation', 'deliberation', 'complete'];
          const statuses = [
            { title: 'System Online', message: 'All services operational', phase: 'complete' },
            { title: 'Processing Request', message: 'Handling incoming traffic...', phase: 'deliberation' },
            { title: 'Health Check', message: 'Running diagnostics...', phase: 'deliberation' },
            { title: 'System Stable', message: 'No issues detected', phase: 'complete' }
          ];
          let idx = 0;
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { title: 'Connecting...', message: 'Establishing connection', time: new Date().toLocaleTimeString() } })}\n\n`);
          const interval = setInterval(() => {
            const s = statuses[idx % statuses.length];
            res.write(`data: ${JSON.stringify({ phase: s.phase, content: { title: s.title, message: s.message, time: new Date().toLocaleTimeString() } })}\n\n`);
            idx++;
          }, 3000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'alert-deploy') {
          const deploys = [
            { title: 'Deployment Started', message: 'Building containers...', phase: 'reflex' },
            { title: 'Rolling Update', message: 'Updating pods 3/5...', phase: 'deliberation' },
            { title: 'Running Tests', message: 'Integration tests passing...', phase: 'deliberation' },
            { title: 'Deployment Complete', message: 'Version 2.4.3 live', phase: 'complete' }
          ];
          let idx = 0;
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { title: 'Initializing', message: 'Preparing deployment pipeline', time: new Date().toLocaleTimeString() } })}\n\n`);
          const interval = setInterval(() => {
            const d = deploys[idx % deploys.length];
            res.write(`data: ${JSON.stringify({ phase: d.phase, content: { title: d.title, message: d.message, time: new Date().toLocaleTimeString() } })}\n\n`);
            idx++;
          }, 4000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'alert-security') {
          const events = [
            { title: 'Scanning Traffic', message: 'Analyzing request patterns...', phase: 'deliberation' },
            { title: 'Login Attempt', message: 'New authentication from 192.168.1.x', phase: 'reflex' },
            { title: 'Firewall Active', message: 'No threats detected', phase: 'complete' },
            { title: 'SSL Renewed', message: 'Certificate valid for 90 days', phase: 'complete' }
          ];
          let idx = 0;
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { title: 'Security Monitor', message: 'Initializing scan...', time: new Date().toLocaleTimeString() } })}\n\n`);
          const interval = setInterval(() => {
            const e = events[idx % events.length];
            res.write(`data: ${JSON.stringify({ phase: e.phase, content: { title: e.title, message: e.message, time: new Date().toLocaleTimeString() } })}\n\n`);
            idx++;
          }, 3500);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'alert-error') {
          const errors = [
            { title: 'No Errors', message: '0 errors in last 24 hours', phase: 'complete' },
            { title: 'Warning Detected', message: 'Slow query on users table', phase: 'deliberation' },
            { title: 'Monitoring', message: 'Watching error rates...', phase: 'deliberation' },
            { title: 'All Clear', message: 'Error rate below threshold', phase: 'complete' }
          ];
          let idx = 0;
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { title: 'Error Monitor', message: 'Starting up...', time: new Date().toLocaleTimeString() } })}\n\n`);
          const interval = setInterval(() => {
            const e = errors[idx % errors.length];
            res.write(`data: ${JSON.stringify({ phase: e.phase, content: { title: e.title, message: e.message, time: new Date().toLocaleTimeString() } })}\n\n`);
            idx++;
          }, 3200);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // ============================================
        // WS3: METRICS NAMESPACES
        // ============================================
        if (namespace === 'metric-cpu') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '0', delta: 'initializing...' } })}\n\n`);
          let prev = 45;
          const interval = setInterval(() => {
            const val = Math.max(5, Math.min(95, prev + (Math.random() - 0.5) * 20));
            const delta = val - prev > 0 ? `+${(val - prev).toFixed(1)}%` : `${(val - prev).toFixed(1)}%`;
            const phase = Math.random() > 0.8 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(0), delta } })}\n\n`);
            prev = val;
          }, 2000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'metric-memory') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '0', delta: 'initializing...' } })}\n\n`);
          let prev = 3.2;
          const interval = setInterval(() => {
            const val = Math.max(1, Math.min(7.5, prev + (Math.random() - 0.5) * 0.5));
            const delta = val - prev > 0 ? `+${((val - prev) * 1000).toFixed(0)}MB` : `${((val - prev) * 1000).toFixed(0)}MB`;
            const phase = Math.random() > 0.8 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(1), delta } })}\n\n`);
            prev = val;
          }, 2500);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'metric-requests') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '0', delta: 'initializing...' } })}\n\n`);
          let prev = 12.5;
          const interval = setInterval(() => {
            const val = Math.max(1, prev + (Math.random() - 0.5) * 5);
            const delta = val - prev > 0 ? `+${(val - prev).toFixed(1)}k` : `${(val - prev).toFixed(1)}k`;
            const phase = Math.random() > 0.85 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(1), delta } })}\n\n`);
            prev = val;
          }, 1500);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'metric-latency') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '0', delta: 'initializing...' } })}\n\n`);
          let prev = 45;
          const interval = setInterval(() => {
            const val = Math.max(10, Math.min(200, prev + (Math.random() - 0.5) * 30));
            const delta = val - prev > 0 ? `+${(val - prev).toFixed(0)}ms` : `${(val - prev).toFixed(0)}ms`;
            const phase = val > 100 ? 'deliberation' : 'complete';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(0), delta } })}\n\n`);
            prev = val;
          }, 2200);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'metric-errors') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '0', delta: 'initializing...' } })}\n\n`);
          let prev = 0.1;
          const interval = setInterval(() => {
            const val = Math.max(0, Math.min(5, prev + (Math.random() - 0.6) * 0.3));
            const delta = val < 0.5 ? 'healthy' : val < 2 ? 'elevated' : 'critical';
            const phase = val < 0.5 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(2), delta } })}\n\n`);
            prev = val;
          }, 3000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'metric-uptime') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { value: '99.9', delta: 'calculating...' } })}\n\n`);
          const interval = setInterval(() => {
            const val = 99.9 + Math.random() * 0.09;
            const phase = 'complete';
            res.write(`data: ${JSON.stringify({ phase, content: { value: val.toFixed(2), delta: 'last 30 days' } })}\n\n`);
          }, 5000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // ============================================
        // WS3: DASHBOARD NAMESPACES
        // ============================================
        if (namespace === 'sidebar-stats') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { users: '0', sessions: '0', revenue: '$0' } })}\n\n`);
          const interval = setInterval(() => {
            const users = 1200 + Math.floor(Math.random() * 300);
            const sessions = 3400 + Math.floor(Math.random() * 500);
            const revenue = 45000 + Math.floor(Math.random() * 5000);
            res.write(`data: ${JSON.stringify({ phase: 'deliberation', content: { users: users.toLocaleString(), sessions: sessions.toLocaleString(), revenue: '$' + revenue.toLocaleString() } })}\n\n`);
          }, 4000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'dashboard-overview') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { status: 'Connecting...', cpu: '--', memory: '--', requests: '--', latency: '--' } })}\n\n`);
          let tick = 0;
          const interval = setInterval(() => {
            const cpu = (30 + Math.random() * 40).toFixed(0) + '%';
            const memory = (2 + Math.random() * 2).toFixed(1) + 'GB';
            const requests = (8 + Math.random() * 6).toFixed(1) + 'k';
            const latency = (30 + Math.random() * 50).toFixed(0) + 'ms';
            const phase = tick % 5 === 0 ? 'complete' : 'deliberation';
            const status = phase === 'complete' ? 'Healthy' : 'Updating...';
            res.write(`data: ${JSON.stringify({ phase, content: { status, cpu, memory, requests, latency } })}\n\n`);
            tick++;
          }, 2000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'dashboard-health') {
          const statuses = ['OK', 'OK', 'OK', 'WARN', 'OK'];
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { 'health-status': 'Checking...', 'api-status': '--', 'db-status': '--', 'cache-status': '--', 'queue-status': '--' } })}\n\n`);
          let tick = 0;
          const interval = setInterval(() => {
            const pick = () => statuses[Math.floor(Math.random() * statuses.length)];
            const phase = tick % 4 === 0 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { 'health-status': phase === 'complete' ? 'All Systems Go' : 'Checking...', 'api-status': pick(), 'db-status': pick(), 'cache-status': pick(), 'queue-status': pick() } })}\n\n`);
            tick++;
          }, 3000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        if (namespace === 'dashboard-activity') {
          const activities = [
            'User john@example.com logged in',
            'New order #12847 placed',
            'Payment processed: $299.00',
            'Report generated: Q1 Sales',
            'Cache cleared successfully',
            'Backup completed'
          ];
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { 'activity-1': 'Loading...', 'activity-1-time': '--:--', 'activity-2': 'Loading...', 'activity-2-time': '--:--', 'activity-3': 'Loading...', 'activity-3-time': '--:--' } })}\n\n`);
          let idx = 0;
          const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString();
            const a1 = activities[(idx) % activities.length];
            const a2 = activities[(idx + 1) % activities.length];
            const a3 = activities[(idx + 2) % activities.length];
            const phase = idx % 3 === 0 ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { 'activity-1': a1, 'activity-1-time': time, 'activity-2': a2, 'activity-2-time': time, 'activity-3': a3, 'activity-3-time': time } })}\n\n`);
            idx++;
          }, 3500);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // ============================================
        // WS2: REACT REPLACEMENT - SERVICE MONITOR
        // ============================================
        if (namespace === 'monitor-status') {
          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { lastUpdate: new Date().toLocaleTimeString(), serviceCount: '6' } })}\n\n`);
          const interval = setInterval(() => {
            res.write(`data: ${JSON.stringify({ phase: 'complete', content: { lastUpdate: new Date().toLocaleTimeString(), serviceCount: '6' } })}\n\n`);
          }, 3000);
          req.on('close', () => clearInterval(interval));
          return;
        }

        // Service endpoints for Aether version
        const serviceConfigs = {
          'service-api': { name: 'API Gateway', baseLatency: 42, baseUptime: 99.9, baseRequests: 1247 },
          'service-auth': { name: 'Auth Service', baseLatency: 38, baseUptime: 99.8, baseRequests: 892 },
          'service-db': { name: 'Database', baseLatency: 125, baseUptime: 98.5, baseRequests: 3421 },
          'service-cache': { name: 'Cache Layer', baseLatency: 8, baseUptime: 99.99, baseRequests: 8742 },
          'service-queue': { name: 'Message Queue', baseLatency: 15, baseUptime: 99.95, baseRequests: 2156 },
          'service-cdn': { name: 'CDN', baseLatency: 22, baseUptime: 99.99, baseRequests: 15234 }
        };

        if (serviceConfigs[namespace]) {
          const cfg = serviceConfigs[namespace];
          const getStatus = (latency, uptime) => {
            if (uptime < 99 || latency > 100) return 'degraded';
            if (uptime < 95 || latency > 200) return 'down';
            return 'healthy';
          };

          res.write(`data: ${JSON.stringify({ phase: 'reflex', content: { name: cfg.name, status: 'healthy', latency: cfg.baseLatency.toString(), uptime: cfg.baseUptime.toFixed(1), requests: cfg.baseRequests.toString(), lastCheck: new Date().toLocaleTimeString() } })}\n\n`);

          const interval = setInterval(() => {
            const latency = Math.max(5, cfg.baseLatency + Math.floor((Math.random() - 0.5) * 30));
            const uptime = Math.max(95, Math.min(99.99, cfg.baseUptime + (Math.random() - 0.5) * 2));
            const requests = Math.max(100, cfg.baseRequests + Math.floor((Math.random() - 0.5) * 200));
            const status = getStatus(latency, uptime);
            const phase = status === 'healthy' ? 'complete' : 'deliberation';
            res.write(`data: ${JSON.stringify({ phase, content: { name: cfg.name, status, latency: latency.toString(), uptime: uptime.toFixed(1), requests: requests.toString(), lastCheck: new Date().toLocaleTimeString() } })}\n\n`);
          }, 2000 + Math.random() * 1000);

          req.on('close', () => clearInterval(interval));
          return;
        }

        // EDS Demo namespace - for leapfrog demo
        if (namespace === 'eds-demo') {
          const updates = [
            { title: 'System Healthy', body: 'All services operational', color: '#2d9d78', bg: '#e6f4ef' },
            { title: 'New Deployment', body: 'Version 2.4.2 rolling out', color: '#1473e6', bg: '#e5f0ff' },
            { title: 'Traffic Spike', body: 'Load balancer scaling up', color: '#e68619', bg: '#fef3e5' },
            { title: 'Cache Cleared', body: 'CDN edge nodes refreshed', color: '#8b5cf6', bg: '#f3e8ff' }
          ];

          res.write(`data: ${JSON.stringify({
            phase: 'reflex',
            vars: { '--accent-color': '#1473e6', '--background-subtle': '#e5f0ff', '--tempo': '0.3s' },
            content: { 'alert-title': 'EDS Demo Active', 'alert-body': 'Streaming updates...', 'alert-time': new Date().toLocaleTimeString() }
          })}\n\n`);

          let idx = 0;
          const interval = setInterval(() => {
            const update = updates[idx % updates.length];
            res.write(`data: ${JSON.stringify({
              phase: 'deliberation',
              vars: { '--accent-color': update.color, '--background-subtle': update.bg },
              content: { 'alert-title': update.title, 'alert-body': update.body, 'alert-time': new Date().toLocaleTimeString() }
            })}\n\n`);
            idx++;
          }, 2500);

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

      // ============================================
      // WS2: REST API for React version polling
      // ============================================
      server.middlewares.use('/api/services', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const services = [
          { id: 1, name: 'API Gateway', status: Math.random() > 0.1 ? 'healthy' : 'degraded', latency: Math.floor(30 + Math.random() * 30), uptime: (99.5 + Math.random() * 0.4).toFixed(1), requests: Math.floor(1000 + Math.random() * 500), lastCheck: new Date().toLocaleTimeString() },
          { id: 2, name: 'Auth Service', status: Math.random() > 0.1 ? 'healthy' : 'degraded', latency: Math.floor(25 + Math.random() * 25), uptime: (99.3 + Math.random() * 0.6).toFixed(1), requests: Math.floor(700 + Math.random() * 400), lastCheck: new Date().toLocaleTimeString() },
          { id: 3, name: 'Database', status: Math.random() > 0.3 ? 'healthy' : 'degraded', latency: Math.floor(100 + Math.random() * 80), uptime: (97.5 + Math.random() * 2).toFixed(1), requests: Math.floor(3000 + Math.random() * 800), lastCheck: new Date().toLocaleTimeString() },
          { id: 4, name: 'Cache Layer', status: 'healthy', latency: Math.floor(5 + Math.random() * 10), uptime: (99.9 + Math.random() * 0.09).toFixed(2), requests: Math.floor(8000 + Math.random() * 2000), lastCheck: new Date().toLocaleTimeString() },
          { id: 5, name: 'Message Queue', status: Math.random() > 0.05 ? 'healthy' : 'degraded', latency: Math.floor(10 + Math.random() * 15), uptime: (99.8 + Math.random() * 0.15).toFixed(2), requests: Math.floor(2000 + Math.random() * 500), lastCheck: new Date().toLocaleTimeString() },
          { id: 6, name: 'CDN', status: 'healthy', latency: Math.floor(15 + Math.random() * 20), uptime: (99.95 + Math.random() * 0.04).toFixed(2), requests: Math.floor(14000 + Math.random() * 3000), lastCheck: new Date().toLocaleTimeString() }
        ];
        res.end(JSON.stringify({ services }));
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
