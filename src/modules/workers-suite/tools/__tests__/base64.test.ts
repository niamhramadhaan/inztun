import { describe, expect, it } from 'vitest';
import { Base64Tool } from '../base64';

describe('Base64Tool', () => {
  const tool = new Base64Tool();

  it('should have correct metadata', () => {
    expect(tool.id).toBe('base64');
    expect(tool.name).toBe('Base64 Encoder/Decoder');
  });

  it('should render HTML', () => {
    const html = tool.render();
    expect(html).toContain('b64-input');
    expect(html).toContain('b64-output');
  });

  it('should encode text to base64', () => {
    const encoded = btoa(unescape(encodeURIComponent('Hello, World!')));
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('should decode base64 to text', () => {
    const decoded = decodeURIComponent(escape(atob('SGVsbG8sIFdvcmxkIQ==')));
    expect(decoded).toBe('Hello, World!');
  });

  it('should roundtrip unicode text', () => {
    const input = 'Hello 世界 🌍';
    const encoded = btoa(unescape(encodeURIComponent(input)));
    const decoded = decodeURIComponent(escape(atob(encoded)));
    expect(decoded).toBe(input);
  });

  it('should handle empty string', () => {
    const encoded = btoa(unescape(encodeURIComponent('')));
    expect(encoded).toBe('');
  });
});
