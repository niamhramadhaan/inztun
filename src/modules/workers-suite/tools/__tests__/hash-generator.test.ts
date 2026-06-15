import { describe, it, expect } from 'vitest';
import { HashGenerator } from '../hash-generator';

describe('HashGenerator', () => {
  const tool = new HashGenerator();

  it('should have correct metadata', () => {
    expect(tool.id).toBe('hash-generator');
    expect(tool.name).toBe('Hash Generator');
  });

  it('should render HTML with hash output areas', () => {
    const html = tool.render();
    expect(html).toContain('hg-sha256');
    expect(html).toContain('hg-sha1');
    expect(html).toContain('hg-md5');
  });

  it('should convert buffer to hex correctly', () => {
    const buffer = new Uint8Array([0, 1, 10, 255]).buffer;
    const hex = tool.bufferToHex(buffer);
    expect(hex).toBe('00010aff');
  });

  it('should produce consistent md5 output', () => {
    const result1 = tool.simpleMd5('hello');
    const result2 = tool.simpleMd5('hello');
    expect(result1).toBe(result2);
  });

  it('should produce different md5 for different inputs', () => {
    const result1 = tool.simpleMd5('hello');
    const result2 = tool.simpleMd5('world');
    expect(result1).not.toBe(result2);
  });

  it('should produce 32-char hex for md5', () => {
    const result = tool.simpleMd5('test');
    expect(result).toMatch(/^[0-9a-f]{32}$/);
  });
});
