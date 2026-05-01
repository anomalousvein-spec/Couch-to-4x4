import { AUDIO_SETTINGS_KEY } from '../constants';

type WindowWithAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const CUE_ATTACK_SECONDS = 0.02;
const CUE_RELEASE_SECONDS = 0.08;

class AudioManagerImpl {
  private context: AudioContext | null = null;
  private cueGain: GainNode | null = null;
  private mainGain: GainNode | null = null; // Gain for the silent "Stay Alive" loop
  private silentLoopSource: AudioBufferSourceNode | null = null;
  private bufferCache = new Map<string, Promise<AudioBuffer>>();
  private activeCueCount = 0;
  private visibilityListenerAttached = false;
  private visibilityHandler: (() => void) | null = null;
  private volume: number = 1.0;

  constructor() {
    this.loadVolume();
  }

  private loadVolume(): void {
    const stored = localStorage.getItem(AUDIO_SETTINGS_KEY);
    this.volume = stored ? parseFloat(stored) : 1.0;
  }

  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem(AUDIO_SETTINGS_KEY, String(this.volume));
    if (this.cueGain) {
      this.cueGain.gain.setTargetAtTime(this.volume, this.getContext().currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public async unlock(): Promise<void> {
    const context = this.getContext();
    this.attachVisibilityListener();
    this.configureMediaSession();
    this.startSilentLoop();

    if (context.state === "suspended") {
      await context.resume().catch(() => undefined);
    }
  }

  private startSilentLoop(): void {
    if (this.silentLoopSource) return;

    const context = this.getContext();
    const buffer = context.createBuffer(1, 44100, 44100); // 1 second of silence
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.mainGain = context.createGain();
    this.mainGain.gain.value = 1.0;

    source.connect(this.mainGain);
    this.mainGain.connect(context.destination);

    source.start();
    this.silentLoopSource = source;
  }

  public async playCue(url: string): Promise<void> {
    const context = this.getContext();
    const gain = this.getCueGain();

    await this.unlock();

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }

    try {
      const buffer = await this.loadBuffer(url);
      const source = context.createBufferSource();
      const sourceGain = context.createGain();
      const now = context.currentTime;
      const cueDuration = buffer.duration;

      source.buffer = buffer;
      source.connect(sourceGain);
      sourceGain.connect(gain);

      sourceGain.gain.cancelScheduledValues(now);
      sourceGain.gain.setValueAtTime(0, now);
      sourceGain.gain.linearRampToValueAtTime(1, now + CUE_ATTACK_SECONDS);
      sourceGain.gain.setValueAtTime(
        1,
        Math.max(now + CUE_ATTACK_SECONDS, now + cueDuration - CUE_RELEASE_SECONDS)
      );
      sourceGain.gain.linearRampToValueAtTime(0, now + cueDuration);

      this.beginCue();

      source.onended = () => {
        source.disconnect();
        sourceGain.disconnect();
        this.endCue();
      };

      source.start(now);
    } catch (error) {
      console.error("Failed to play audio cue:", error);
    }
  }

  public async resumeIfSuspended(): Promise<void> {
    if (!this.context || this.context.state !== "suspended") {
      return;
    }

    await this.context.resume().catch(() => undefined);
  }

  public cleanup(): void {
    if (this.visibilityListenerAttached && this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityListenerAttached = false;
      this.visibilityHandler = null;
    }
    
    if (this.cueGain) {
      this.cueGain.disconnect();
      this.cueGain = null;
    }

    if (this.silentLoopSource) {
      this.silentLoopSource.stop();
      this.silentLoopSource.disconnect();
      this.silentLoopSource = null;
    }

    if (this.mainGain) {
      this.mainGain.disconnect();
      this.mainGain = null;
    }
    
    if (this.context) {
      this.context.close().catch(() => undefined);
      this.context = null;
    }
    
    this.bufferCache.clear();
  }

  private getContext(): AudioContext {
    if (this.context) {
      return this.context;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as WindowWithAudioContext).webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }

    this.context = new AudioContextConstructor();
    return this.context;
  }

  private getCueGain(): GainNode {
    if (this.cueGain) {
      return this.cueGain;
    }

    const context = this.getContext();
    this.cueGain = context.createGain();
    this.cueGain.gain.value = this.volume;
    this.cueGain.connect(context.destination);
    return this.cueGain;
  }

  private loadBuffer(url: string): Promise<AudioBuffer> {
    const cachedBuffer = this.bufferCache.get(url);

    if (cachedBuffer) {
      return cachedBuffer;
    }

    const bufferPromise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load audio cue: ${url}`);
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => this.getContext().decodeAudioData(arrayBuffer.slice(0)))
      .catch((error) => {
        this.bufferCache.delete(url);
        throw error;
      });

    this.bufferCache.set(url, bufferPromise);
    return bufferPromise;
  }

  private beginCue(): void {
    this.activeCueCount += 1;
    this.configureMediaSession();

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }

    // Duck the main silent loop volume to 10%
    if (this.mainGain) {
      this.mainGain.gain.setTargetAtTime(0.1, this.getContext().currentTime, 0.1);
    }
  }

  private endCue(): void {
    this.activeCueCount = Math.max(0, this.activeCueCount - 1);

    if (this.activeCueCount > 0) {
      return;
    }

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }

    // Restore the main silent loop volume to 100%
    if (this.mainGain) {
      this.mainGain.gain.setTargetAtTime(1.0, this.getContext().currentTime, 0.1);
    }
  }

  private configureMediaSession(): void {
    if (!("mediaSession" in navigator)) {
      return;
    }

    if ("MediaMetadata" in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Workout cue",
        artist: "Couch to 4x4",
        album: "Norwegian 4x4 HIIT",
      });
    }
  }

  private attachVisibilityListener(): void {
    if (this.visibilityListenerAttached) {
      return;
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        void this.resumeIfSuspended();
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.visibilityListenerAttached = true;
  }
}

export const AudioManager = new AudioManagerImpl();
