import { describe, expect, it } from 'vitest';
import { JsonFormatter } from '../json-formatter';

describe('JsonFormatter', () => {
  const tool = new JsonFormatter();

  it('should have correct metadata', () => {
    expect(tool.id).toBe('json-formatter');
    expect(tool.name).toBe('JSON Formatter');
    expect(tool.badge).toBe('Popular');
  });

  it('should render HTML with input/output areas', () => {
    const html = tool.render();
    expect(html).toContain('jf-input');
    expect(html).toContain('jf-output');
    expect(html).toContain('jf-format');
  });

  it('should format JSON correctly', () => {
    const input = '{"a":1,"b":"hello"}';
    const formatted = JSON.stringify(JSON.parse(input), null, 2);
    expect(formatted).toContain('"a": 1');
    expect(formatted).toContain('"b": "hello"');
  });

  it('should minify JSON correctly', () => {
    const input = '{ "a": 1, "b": "hello" }';
    const minified = JSON.stringify(JSON.parse(input));
    expect(minified).toBe('{"a":1,"b":"hello"}');
  });

  it('should validate valid JSON', () => {
    expect(() => JSON.parse('{"valid": true}')).not.toThrow();
  });

  it('should reject invalid JSON', () => {
    expect(() => JSON.parse('{invalid}')).toThrow();
  });

  it('should handle nested objects', () => {
    const input = '{"user":{"name":"John","address":{"city":"NYC"}}}';
    const parsed = JSON.parse(input);
    expect(parsed.user.address.city).toBe('NYC');
  });

  it('should handle arrays', () => {
    const input = '[1,2,3]';
    const parsed = JSON.parse(input);
    expect(parsed).toEqual([1, 2, 3]);
  });
});
