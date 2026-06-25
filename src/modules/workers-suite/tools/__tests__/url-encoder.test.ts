import { describe, expect, it } from 'vitest';
import { UrlEncoder } from '../url-encoder';

describe('UrlEncoder', () => {
  const tool = new UrlEncoder();

  it('should have correct metadata', () => {
    expect(tool.id).toBe('url-encoder');
    expect(tool.name).toBe('URL Encoder/Decoder');
  });

  it('should render HTML', () => {
    const html = tool.render();
    expect(html).toContain('ue-input');
    expect(html).toContain('ue-output');
  });

  it('should encode special characters', () => {
    const input = 'hello world';
    const encoded = encodeURIComponent(input);
    expect(encoded).toBe('hello%20world');
  });

  it('should encode unicode', () => {
    const input = '你好';
    const encoded = encodeURIComponent(input);
    expect(encoded).toBe('%E4%BD%A0%E5%A5%BD');
  });

  it('should decode encoded string', () => {
    const encoded = 'hello%20world%21';
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe('hello world!');
  });

  it('should roundtrip encode/decode', () => {
    const input = 'https://example.com/path?q=hello world&lang=en';
    const encoded = encodeURIComponent(input);
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(input);
  });

  it('should handle empty string', () => {
    expect(encodeURIComponent('')).toBe('');
  });

  it('should parse valid URL', () => {
    const url = new URL('https://example.com:8080/path?name=test#section');
    expect(url.protocol).toBe('https:');
    expect(url.host).toBe('example.com:8080');
    expect(url.pathname).toBe('/path');
    expect(url.searchParams.get('name')).toBe('test');
    expect(url.hash).toBe('#section');
  });
});
