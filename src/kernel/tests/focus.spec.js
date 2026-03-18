import { test, expect, beforeEach, vi } from 'vitest';
import { AetherKernel } from '../aether-kernel.js';

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onopen = null;
    this.onerror = null;
  }
  close() {}
}

beforeEach(() => {
  global.EventSource = MockEventSource;
  document.body.innerHTML = '';
});

test('preserves focus path for element with id', () => {
  const container = document.createElement('div');
  container.innerHTML = '<input id="search-input" />';
  document.body.appendChild(container);

  const input = container.querySelector('#search-input');
  input.focus();

  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  expect(kernel.focusPath).toBe('#search-input');
});

test('preserves focus path for element with data-aether-slot', () => {
  const container = document.createElement('div');
  container.innerHTML = '<input data-aether-slot="query" />';
  document.body.appendChild(container);

  const input = container.querySelector('[data-aether-slot="query"]');
  input.focus();

  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  expect(kernel.focusPath).toBe('[data-aether-slot="query"]');
});

test('restores focus after projection complete', () => {
  const container = document.createElement('div');
  container.innerHTML = '<input data-aether-slot="search" />';
  document.body.appendChild(container);

  const input = container.querySelector('input');
  input.focus();

  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  // Simulate DOM replacement (as would happen with sliver injection)
  container.innerHTML = '<input data-aether-slot="search" />';

  // Mock scrollIntoView
  const newInput = container.querySelector('input');
  newInput.scrollIntoView = vi.fn();

  kernel.restoreFocus();

  expect(document.activeElement).toBe(newInput);
});

test('injects content into slots', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h2 data-aether-slot="title"></h2>
    <p data-aether-slot="body"></p>
  `;
  document.body.appendChild(container);

  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  kernel.injectContent({
    title: 'Hello World',
    body: 'This is the body content'
  });

  expect(container.querySelector('[data-aether-slot="title"]').textContent).toBe('Hello World');
  expect(container.querySelector('[data-aether-slot="body"]').textContent).toBe('This is the body content');
});

test('applies CSS variables to container', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const kernel = new AetherKernel(container, {
    endpoint: '/test',
    namespace: 'test'
  });

  kernel.applyVariables({
    '--accent-color': '#dc2626',
    '--tempo': '0.15s'
  });

  expect(container.style.getPropertyValue('--accent-color')).toBe('#dc2626');
  expect(container.style.getPropertyValue('--tempo')).toBe('0.15s');
});
