import { test, expect, vi, beforeEach } from 'vitest';
import { AetherKernel } from '../aether-kernel.js';

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onopen = null;
    this.onerror = null;
    MockEventSource.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}
MockEventSource.instances = [];

beforeEach(() => {
  MockEventSource.instances = [];
  global.EventSource = MockEventSource;
});

test('connects to SSE endpoint with correct URL params', () => {
  const container = document.createElement('div');
  const kernel = new AetherKernel(container, {
    endpoint: 'http://localhost:8787/dai',
    namespace: 'test-namespace'
  });

  expect(MockEventSource.instances.length).toBe(1);
  const url = MockEventSource.instances[0].url;
  expect(url).toContain('http://localhost:8787/dai');
  expect(url).toContain('namespace=test-namespace');
  expect(url).toContain('init=true');
});

test('sets data-aether-connected attribute on open', () => {
  const container = document.createElement('div');
  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  const es = MockEventSource.instances[0];
  es.onopen();

  expect(container.getAttribute('data-aether-connected')).toBe('true');
});

test('sets data-aether-error attribute on error', () => {
  const container = document.createElement('div');
  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  const es = MockEventSource.instances[0];
  es.onerror();

  expect(container.getAttribute('data-aether-error')).toBe('true');
});

test('closes EventSource on destroy', () => {
  const container = document.createElement('div');
  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  kernel.destroy();

  expect(MockEventSource.instances[0].closed).toBe(true);
});
