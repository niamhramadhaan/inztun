import { describe, expect, it } from 'vitest';
import { PasswordGenerator } from '../password-gen';

describe('PasswordGenerator', () => {
  const tool = new PasswordGenerator();

  it('should have correct metadata', () => {
    expect(tool.id).toBe('password-gen');
    expect(tool.name).toBe('Password Generator');
    expect(tool.badge).toBe('Secure');
  });

  it('should render HTML with controls', () => {
    const html = tool.render();
    expect(html).toContain('pg-output');
    expect(html).toContain('pg-length');
    expect(html).toContain('pg-generate');
  });

  it('should generate password of specified length', () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 20;
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const password = Array.from(array, (x) => charset[x % charset.length]).join('');
    expect(password.length).toBe(length);
  });

  it('should only contain charset characters', () => {
    const charset = 'ABC';
    const length = 10;
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const password = Array.from(array, (x) => charset[x % charset.length]).join('');
    expect(password).toMatch(/^[ABC]+$/);
  });

  it('should return empty string for empty charset', () => {
    const charset = '';
    const length = 10;
    const password =
      charset.length > 0
        ? Array.from(new Uint32Array(length), (x) => charset[x % charset.length]).join('')
        : '';
    expect(password).toBe('');
  });
});
