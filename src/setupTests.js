import { expect } from 'vitest';

/**
 * Shared Vitest setup.
 * - Registers DOM matchers only when a DOM-like environment exists
 *   so backend/unit tests that run in the Node environment stay light.
 */
const hasDom =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined';

if (hasDom) {
  const matchers = (await import('@testing-library/jest-dom/matchers')).default;
  expect.extend(matchers);
}
