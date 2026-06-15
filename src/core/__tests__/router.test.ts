import { describe, it, expect } from 'vitest';
import type { Route } from '../../types/index';

function parseRouteHash(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, '');
  const parts = cleaned.split('/').filter(Boolean);
  return {
    module: parts[0] || null,
    tool: parts[1] || null,
  };
}

describe('Router hash parsing', () => {
  it('should parse empty hash', () => {
    expect(parseRouteHash('')).toEqual({ module: null, tool: null });
  });

  it('should parse module only', () => {
    expect(parseRouteHash('#/workers-suite')).toEqual({ module: 'workers-suite', tool: null });
  });

  it('should parse module and tool', () => {
    expect(parseRouteHash('#/workers-suite/json-formatter')).toEqual({ module: 'workers-suite', tool: 'json-formatter' });
  });

  it('should handle hash without leading #', () => {
    expect(parseRouteHash('/playground/typing-test')).toEqual({ module: 'playground', tool: 'typing-test' });
  });

  it('should handle hash with just #/', () => {
    expect(parseRouteHash('#/')).toEqual({ module: null, tool: null });
  });

  it('should handle trailing slashes', () => {
    expect(parseRouteHash('#/workers-suite/')).toEqual({ module: 'workers-suite', tool: null });
  });

  it('should handle multiple slashes', () => {
    expect(parseRouteHash('#///workers///json///')).toEqual({ module: 'workers', tool: 'json' });
  });
});
