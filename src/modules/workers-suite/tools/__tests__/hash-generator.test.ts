import { describe, expect, it } from 'vitest';
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
  });

  it('should convert buffer to hex correctly', () => {
    const buffer = new Uint8Array([0, 1, 10, 255]).buffer;
    const hex = tool.bufferToHex(buffer);
    expect(hex).toBe('00010aff');
  });
});
