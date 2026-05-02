import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from './AudioManager';

// Mock Web Audio API
class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  destination = {};
  createGain() {
    return {
      gain: {
        value: 1,
        setTargetAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createBuffer() {
    return { duration: 1 };
  }
  createBufferSource() {
    const source = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(() => {
        // Trigger onended asynchronously to simulate playback finish
        setTimeout(() => source.onended && source.onended(), 10);
      }),
      stop: vi.fn(),
      onended: null as any,
    };
    return source;
  }
  decodeAudioData() {
    return Promise.resolve({ duration: 1 });
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext as any;
global.window.AudioContext = MockAudioContext as any;
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
) as any;

// Mock MediaSession
(global.navigator as any).mediaSession = {
  metadata: null,
  playbackState: 'none',
};
global.MediaMetadata = class {
  constructor(public data: any) {}
} as any;

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.cleanup();
    vi.clearAllMocks();
  });

  it('should initialize with default volume', () => {
    expect(AudioManager.getVolume()).toBe(1.0);
  });

  it('should update volume and persist it', () => {
    AudioManager.setVolume(0.5);
    expect(AudioManager.getVolume()).toBe(0.5);
    expect(localStorage.getItem('couchTo4x4.volume')).toBe('0.5');
  });

  it('should preload buffers', async () => {
    const urls = ['/audio/test1.mp3', '/audio/test2.mp3'];
    await AudioManager.preload(urls);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should play a cue and update media session', async () => {
    await AudioManager.playCue('/audio/test.mp3', 'Test Cue');
    expect(navigator.mediaSession.metadata).toBeDefined();
    expect((navigator.mediaSession.metadata as any).data.title).toBe('Test Cue');
  });

  it('should queue coaching cues', async () => {
    const playCueSpy = vi.spyOn(AudioManager, 'playCue').mockImplementation(async () => {
        // Simulate some duration
        await new Promise(resolve => setTimeout(resolve, 50));
    });

    const p1 = AudioManager.playCoachingCue('/audio/c1.mp3');
    const p2 = AudioManager.playCoachingCue('/audio/c2.mp3');

    await Promise.all([p1, p2]);

    expect(playCueSpy).toHaveBeenCalledTimes(2);
    expect(playCueSpy).toHaveBeenNthCalledWith(1, '/audio/c1.mp3', undefined);
    expect(playCueSpy).toHaveBeenNthCalledWith(2, '/audio/c2.mp3', undefined);
  });
});
