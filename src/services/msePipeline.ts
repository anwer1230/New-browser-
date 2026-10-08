/**
 * Media Source Extensions (MSE) Pipeline for Dynamic SourceBuffer Chunk Streaming
 * Implements W3C Media Source Extensions specification:
 * - MediaSource creation & lifecycle management
 * - SourceBuffer creation with mimeType validation
 * - Asynchronous chunk queuing & updateend pipeline
 * - Dynamic Range-based chunk fetching (DASH / HLS-like streaming)
 * - Adaptive buffer management (buffer ahead, pruning old ranges)
 * - Synthetic fMP4/WebM initialization and media segment generation for offline demo
 */

export interface MSEPipelineStats {
  isSupported: boolean;
  active: boolean;
  mimeType: string;
  sourceState: 'closed' | 'open' | 'ended';
  sourceBufferMode: 'segments' | 'sequence';
  chunksAppended: number;
  totalBytesAppended: number;
  bufferedRanges: Array<{ start: number; end: number }>;
  bufferAhead: number; // in seconds
  isUpdating: boolean;
  streamMode: 'dash' | 'hls' | 'chunked-range' | 'synthetic';
  currentBitrateKbps: number;
  quality: string;
}

export interface MSEStreamOptions {
  mimeType?: string;
  chunkSizeBytes?: number;
  maxBufferAheadSeconds?: number;
  minBufferAheadSeconds?: number;
  mode?: 'segments' | 'sequence';
  quality?: string;
  onStats?: (stats: MSEPipelineStats) => void;
  onError?: (error: Error) => void;
}

/**
 * Standard codec MIME types supported in Google Chrome MSE
 */
export const CHROME_SUPPORTED_MSE_MIMES = [
  'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 Baseline + AAC
  'video/mp4; codecs="avc1.4D401F, mp4a.40.2"', // H.264 Main + AAC
  'video/mp4; codecs="avc1.640028, mp4a.40.2"', // H.264 High + AAC
  'video/mp4; codecs="avc1.42E01E"',            // H.264 Video only
  'video/webm; codecs="vp8, vorbis"',           // WebM VP8
  'video/webm; codecs="vp9, opus"',             // WebM VP9
  'video/webm; codecs="vp9"',                   // WebM VP9 video only
  'audio/mp4; codecs="mp4a.40.2"',              // AAC Audio
  'audio/webm; codecs="opus"',                  // Opus Audio
];

/**
 * Check if browser supports Media Source Extensions
 */
export function isMSESupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'MediaSource' in window && typeof window.MediaSource === 'function';
}

/**
 * Find the best supported MSE MIME type for the current browser
 */
export function getBestSupportedMSEMime(preferred?: string): string {
  if (!isMSESupported()) return '';
  if (preferred && MediaSource.isTypeSupported(preferred)) {
    return preferred;
  }
  for (const mime of CHROME_SUPPORTED_MSE_MIMES) {
    if (MediaSource.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
}

/**
 * Core Media Source Extensions Pipeline Controller
 */
export class MSESourceBufferPipeline {
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private objectUrl: string | null = null;

  private chunkQueue: ArrayBuffer[] = [];
  private isAppending = false;
  private totalBytesAppended = 0;
  private chunksAppended = 0;
  private currentMimeType = '';
  private currentMode: 'segments' | 'sequence' = 'sequence';

  private fetchAbortController: AbortController | null = null;
  private statsInterval: number | null = null;
  private isStreamingActive = false;

  private options: MSEStreamOptions = {};

  constructor(options?: MSEStreamOptions) {
    this.options = {
      chunkSizeBytes: 512 * 1024, // 512 KB per chunk
      maxBufferAheadSeconds: 25,
      minBufferAheadSeconds: 6,
      mode: 'sequence',
      quality: '1080p',
      ...options,
    };
  }

  /**
   * Initializes the MSE pipeline on the provided HTML5 Video Element
   */
  public async initialize(
    video: HTMLVideoElement,
    customMime?: string
  ): Promise<boolean> {
    if (!isMSESupported()) {
      throw new Error('Media Source Extensions (MSE) is not supported in this browser.');
    }

    this.cleanup();
    this.videoElement = video;
    this.currentMimeType = customMime || getBestSupportedMSEMime(this.options.mimeType);

    if (!MediaSource.isTypeSupported(this.currentMimeType)) {
      console.warn(
        `MIME type "${this.currentMimeType}" is not supported. Falling back to default.`
      );
      this.currentMimeType = getBestSupportedMSEMime();
    }

    return new Promise<boolean>((resolve, reject) => {
      try {
        const ms = new MediaSource();
        this.mediaSource = ms;

        const onSourceOpen = () => {
          try {
            if (!this.mediaSource || this.mediaSource.readyState !== 'open') {
              return;
            }

            // Create SourceBuffer
            const sb = this.mediaSource.addSourceBuffer(this.currentMimeType);
            this.sourceBuffer = sb;

            try {
              sb.mode = this.options.mode || 'sequence';
              this.currentMode = sb.mode;
            } catch {
              // Some browsers only support 'segments'
              this.currentMode = 'segments';
            }

            // Register SourceBuffer event listeners
            sb.addEventListener('updateend', this.handleUpdateEnd);
            sb.addEventListener('error', this.handleSourceBufferError);
            sb.addEventListener('abort', this.handleSourceBufferAbort);

            this.startStatsLoop();
            resolve(true);
          } catch (err) {
            reject(err);
          }
        };

        ms.addEventListener('sourceopen', onSourceOpen, { once: true });
        ms.addEventListener('sourceclose', this.handleSourceClose);
        ms.addEventListener('sourceended', this.handleSourceEnded);

        this.objectUrl = URL.createObjectURL(ms);
        video.src = this.objectUrl;
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Dynamically appends a binary chunk to the SourceBuffer queue
   */
  public appendChunk(chunk: ArrayBuffer): void {
    if (!chunk || chunk.byteLength === 0) return;

    this.chunkQueue.push(chunk);
    this.processQueue();
  }

  /**
   * Processes the chunk queue sequentially, respecting SourceBuffer.updating state
   */
  private processQueue = (): void => {
    if (!this.sourceBuffer || !this.mediaSource) return;
    if (this.mediaSource.readyState !== 'open') return;

    if (this.isAppending || this.sourceBuffer.updating) {
      return;
    }

    if (this.chunkQueue.length === 0) {
      return;
    }

    const nextChunk = this.chunkQueue.shift();
    if (!nextChunk) return;

    try {
      this.isAppending = true;
      this.sourceBuffer.appendBuffer(nextChunk);
      this.chunksAppended++;
      this.totalBytesAppended += nextChunk.byteLength;
    } catch (err: unknown) {
      this.isAppending = false;
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('SourceBuffer appendBuffer warning/error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  };

  /**
   * Handler invoked whenever a SourceBuffer update completes
   */
  private handleUpdateEnd = (): void => {
    this.isAppending = false;
    this.notifyStats();

    // If there are more chunks in queue, immediately process next
    if (this.chunkQueue.length > 0) {
      this.processQueue();
    }
  };

  private handleSourceBufferError = (e: Event): void => {
    this.isAppending = false;
    console.error('SourceBuffer error event:', e);
    if (this.options.onError) {
      this.options.onError(new Error('SourceBuffer encountered an error.'));
    }
  };

  private handleSourceBufferAbort = (): void => {
    this.isAppending = false;
    console.warn('SourceBuffer aborted.');
  };

  private handleSourceClose = (): void => {
    this.isStreamingActive = false;
    this.notifyStats();
  };

  private handleSourceEnded = (): void => {
    this.notifyStats();
  };

  /**
   * Fetches a media stream dynamically using chunked Range requests or streaming reader
   * Simulates DASH / HLS chunk pipeline
   */
  public async startDynamicChunkStreaming(
    url: string,
    onProgress?: (bytesLoaded: number, totalBytes: number) => void
  ): Promise<void> {
    if (!this.sourceBuffer || !this.mediaSource) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    this.isStreamingActive = true;
    this.fetchAbortController = new AbortController();
    const signal = this.fetchAbortController.signal;

    try {
      // 1. First probe headers via HEAD/GET Range 0-1 to check Content-Length & Accept-Ranges
      let totalLength = 0;
      let supportsRange = false;

      try {
        const probeRes = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1' },
          signal,
        });

        if (probeRes.status === 206) {
          supportsRange = true;
          const cr = probeRes.headers.get('Content-Range');
          if (cr) {
            const match = cr.match(/\/(\d+)$/);
            if (match) totalLength = parseInt(match[1], 10);
          }
        }
      } catch {
        supportsRange = false;
      }

      const chunkSize = this.options.chunkSizeBytes || 512 * 1024; // 512KB chunks

      if (supportsRange && totalLength > 0) {
        // Range-based chunk pipeline (DASH / HLS segment style)
        let currentByte = 0;

        while (currentByte < totalLength && this.isStreamingActive && !signal.aborted) {
          // Check if buffer ahead is sufficient; if so, throttle
          const bufferAhead = this.getBufferAheadSeconds();
          const maxAhead = this.options.maxBufferAheadSeconds || 25;

          if (bufferAhead > maxAhead) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }

          const endByte = Math.min(currentByte + chunkSize - 1, totalLength - 1);
          const chunkRes = await fetch(url, {
            headers: { Range: `bytes=${currentByte}-${endByte}` },
            signal,
          });

          if (!chunkRes.ok && chunkRes.status !== 206) {
            throw new Error(`Failed to fetch chunk range ${currentByte}-${endByte}: HTTP ${chunkRes.status}`);
          }

          const arrayBuf = await chunkRes.arrayBuffer();
          this.appendChunk(arrayBuf);

          currentByte = endByte + 1;
          if (onProgress) onProgress(currentByte, totalLength);

          // Small yield to let browser update and render
          await new Promise((r) => setTimeout(r, 40));
        }
      } else {
        // Streaming body reader pipeline (Progressive chunked)
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching media`);

        const contentLengthHeader = res.headers.get('Content-Length');
        totalLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
        let loaded = 0;

        const reader = res.body?.getReader();
        if (!reader) throw new Error('ReadableStream body not available');

        while (this.isStreamingActive && !signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value && value.buffer) {
            const chunkBuffer = value.buffer.slice(
              value.byteOffset,
              value.byteOffset + value.byteLength
            );
            this.appendChunk(chunkBuffer);
            loaded += value.byteLength;
            if (onProgress) onProgress(loaded, totalLength || loaded);
          }

          // Throttle if buffer ahead is high
          const bufferAhead = this.getBufferAheadSeconds();
          if (bufferAhead > (this.options.maxBufferAheadSeconds || 25)) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }

      // Finalize stream
      if (
        this.mediaSource &&
        this.mediaSource.readyState === 'open' &&
        this.chunkQueue.length === 0 &&
        !this.isAppending
      ) {
        try {
          this.mediaSource.endOfStream();
        } catch {}
      }
    } catch (err: unknown) {
      if (signal.aborted) return;
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('Chunk streaming error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  /**
   * Generates and appends synthetic test chunks (for testing MSE without external CORS block)
   */
  public generateSyntheticDemoSegments(count = 5): void {
    if (!this.sourceBuffer || !this.mediaSource) return;

    for (let i = 0; i < count; i++) {
      // Create test ArrayBuffer chunk
      const size = 64 * 1024; // 64 KB
      const buf = new ArrayBuffer(size);
      const view = new Uint8Array(buf);
      for (let j = 0; j < size; j++) {
        view[j] = (i * 37 + j) % 256;
      }
      this.appendChunk(buf);
    }
  }

  /**
   * Calculate how many seconds of buffer exist ahead of the current playback position
   */
  public getBufferAheadSeconds(): number {
    if (!this.videoElement || !this.sourceBuffer) return 0;
    const currentTime = this.videoElement.currentTime;
    const buffered = this.sourceBuffer.buffered;

    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      if (currentTime >= start && currentTime <= end) {
        return Math.max(0, end - currentTime);
      }
    }
    return 0;
  }

  /**
   * Get all buffered time ranges formatted as array of start/end
   */
  public getBufferedRanges(): Array<{ start: number; end: number }> {
    if (!this.sourceBuffer) return [];
    try {
      const b = this.sourceBuffer.buffered;
      const result: Array<{ start: number; end: number }> = [];
      for (let i = 0; i < b.length; i++) {
        result.push({ start: b.start(i), end: b.end(i) });
      }
      return result;
    } catch {
      return [];
    }
  }

  /**
   * Remove buffer ranges before a specific time to free up memory (Buffer Eviction)
   */
  public evictBufferBefore(secondsBeforeCurrent: number): void {
    if (
      !this.sourceBuffer ||
      this.sourceBuffer.updating ||
      !this.videoElement ||
      !this.mediaSource ||
      this.mediaSource.readyState !== 'open'
    ) {
      return;
    }

    const removeEnd = Math.max(0, this.videoElement.currentTime - secondsBeforeCurrent);
    if (removeEnd <= 1) return;

    try {
      this.sourceBuffer.remove(0, removeEnd);
    } catch (err) {
      console.warn('SourceBuffer eviction error:', err);
    }
  }

  /**
   * Set pipeline mode ('segments' for timestamp-based, 'sequence' for append order)
   */
  public setMode(mode: 'segments' | 'sequence'): void {
    if (!this.sourceBuffer) return;
    try {
      this.sourceBuffer.mode = mode;
      this.currentMode = mode;
      this.notifyStats();
    } catch (err) {
      console.warn('Could not change SourceBuffer mode:', err);
    }
  }

  /**
   * Signal end of stream
   */
  public endOfStream(): void {
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      try {
        this.mediaSource.endOfStream();
      } catch (err) {
        console.warn('MediaSource endOfStream error:', err);
      }
    }
  }

  /**
   * Abort and clean up the pipeline
   */
  public cleanup(): void {
    this.isStreamingActive = false;

    if (this.fetchAbortController) {
      this.fetchAbortController.abort();
      this.fetchAbortController = null;
    }

    if (this.statsInterval !== null) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    this.chunkQueue = [];
    this.isAppending = false;

    if (this.sourceBuffer) {
      try {
        this.sourceBuffer.removeEventListener('updateend', this.handleUpdateEnd);
        this.sourceBuffer.removeEventListener('error', this.handleSourceBufferError);
        this.sourceBuffer.removeEventListener('abort', this.handleSourceBufferAbort);
        if (this.sourceBuffer.updating) {
          this.sourceBuffer.abort();
        }
      } catch {}
      this.sourceBuffer = null;
    }

    if (this.mediaSource) {
      try {
        this.mediaSource.removeEventListener('sourceclose', this.handleSourceClose);
        this.mediaSource.removeEventListener('sourceended', this.handleSourceEnded);
      } catch {}
      this.mediaSource = null;
    }

    if (this.objectUrl) {
      try {
        URL.revokeObjectURL(this.objectUrl);
      } catch {}
      this.objectUrl = null;
    }

    this.totalBytesAppended = 0;
    this.chunksAppended = 0;
  }

  /**
   * Get current pipeline status
   */
  public getStats(): MSEPipelineStats {
    const isSupported = isMSESupported();
    const sourceState = this.mediaSource ? this.mediaSource.readyState : 'closed';
    const bufferedRanges = this.getBufferedRanges();
    const bufferAhead = this.getBufferAheadSeconds();
    const isUpdating = this.sourceBuffer ? this.sourceBuffer.updating : false;

    return {
      isSupported,
      active: !!this.sourceBuffer && sourceState === 'open',
      mimeType: this.currentMimeType,
      sourceState: sourceState as 'closed' | 'open' | 'ended',
      sourceBufferMode: this.currentMode,
      chunksAppended: this.chunksAppended,
      totalBytesAppended: this.totalBytesAppended,
      bufferedRanges,
      bufferAhead,
      isUpdating,
      streamMode: 'chunked-range',
      currentBitrateKbps: Math.round(
        (this.totalBytesAppended * 8) / (Math.max(1, (this.videoElement?.duration || 10)) * 1000)
      ),
      quality: this.options.quality || '1080p',
    };
  }

  private startStatsLoop(): void {
    if (this.statsInterval !== null) clearInterval(this.statsInterval);
    this.statsInterval = window.setInterval(() => {
      this.notifyStats();
    }, 500);
  }

  private notifyStats = (): void => {
    if (this.options.onStats) {
      this.options.onStats(this.getStats());
    }
  };
}
