import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../events';

describe('EventBus', () => {
  it('should call listener when event is emitted', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.emit('test', 'data');

    expect(callback).toHaveBeenCalledWith('data');
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);
    bus.emit('test');

    expect(callback1).toHaveBeenCalledOnce();
    expect(callback2).toHaveBeenCalledOnce();
  });

  it('should unsubscribe with returned function', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    const unsub = bus.on('test', callback);
    unsub();
    bus.emit('test');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should remove listener with off()', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.off('test', callback);
    bus.emit('test');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not throw on emit with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('should handle listener errors gracefully', () => {
    const bus = new EventBus();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.on('test', () => { throw new Error('fail'); });
    bus.emit('test');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should support once() for single-fire listeners', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.once('test', callback);
    bus.emit('test', 'first');
    bus.emit('test', 'second');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('should emit with no data', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.emit('test');

    expect(callback).toHaveBeenCalledWith(undefined);
  });
});
