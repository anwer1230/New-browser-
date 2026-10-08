import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  DownloadCloud,
  Trash2,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MSEPipelineStats, CHROME_SUPPORTED_MSE_MIMES } from '../services/msePipeline.ts';

interface MSEPlayerPanelProps {
  stats: MSEPipelineStats;
  isMSEActive: boolean;
  onToggleMSE: (enable: boolean) => void;
  onAppendChunkManually: () => void;
  onEvictBuffer: () => void;
  onChangeMimeType: (mime: string) => void;
  onChangeMode: (mode: 'segments' | 'sequence') => void;
  onResetPipeline: () => void;
  videoDuration?: number;
  currentTime?: number;
}

export const MSEPlayerPanel: React.FC<MSEPlayerPanelProps> = ({
  stats,
  isMSEActive,
  onToggleMSE,
  onAppendChunkManually,
  onEvictBuffer,
  onChangeMimeType,
  onChangeMode,
  onResetPipeline,
  videoDuration = 100,
  currentTime = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'1080p' | '720p' | '480p' | '360p'>('1080p');

  // Format bytes to KB / MB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Calculate buffer percentage
  const bufferPercent = Math.min(100, Math.round((stats.bufferAhead / 30) * 100));

  return (
    <div className="bg-[#1C1D1F] border-t border-gray-800 text-gray-200 text-xs">
      {/* Header Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#161719]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-rose-300 font-mono text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>MSE SourceBuffer Pipeline</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isMSEActive
                  ? stats.isUpdating
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-gray-300">
              {isMSEActive
                ? stats.isUpdating
                  ? 'جاري دمج Chunk في SourceBuffer...'
                  : 'تفريغ وتدفق DASH/HLS نشط'
                : 'مشغل الفيديو التقليدي (Direct Video)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle MSE Mode */}
          <button
            type="button"
            onClick={() => onToggleMSE(!isMSEActive)}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isMSEActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {isMSEActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>نظام MSE مفعل (DASH Mode)</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>تفعيل محرك MSE Chunks</span>
              </>
            )}
          </button>

          {/* Details Dropdown Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            title="تفاصيل أنبوب المعالجة (Pipeline Telemetry)"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Buffer Health Meter (Always visible when MSE is active) */}
      {isMSEActive && (
        <div className="px-4 py-2 border-t border-gray-800/80 bg-black/30 flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] shrink-0 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">صحة المخزن المؤقت (Buffer Ahead):</span>
            <span className="text-emerald-300 font-mono font-bold">
              {stats.bufferAhead.toFixed(1)} ثانية
            </span>
          </div>

          {/* Progress Bar of Buffer Ahead */}
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 ${
                stats.bufferAhead > 15
                  ? 'bg-emerald-500'
                  : stats.bufferAhead > 5
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${bufferPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] shrink-0 text-gray-400 font-mono">
            <span>القطع: <strong className="text-white">{stats.chunksAppended}</strong></span>
            <span>البيانات: <strong className="text-white">{formatBytes(stats.totalBytesAppended)}</strong></span>
          </div>
        </div>
      )}

      {/* Expanded Pipeline Details & Controls */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-800 space-y-4 bg-[#141517]">
          {/* Architecture Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            {/* Box 1: MediaSource */}
            <div className="bg-[#1F2023] p-3 rounded-xl border border-gray-700/80">
              <div className="flex items-center justify-between text-gray-400 mb-1.5 font-bold">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  MediaSource
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                    stats.sourceState === 'open'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {stats.sourceState}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                حاوية W3C المسؤولة عن تغذية كائن &lt;video&gt; ببيانات ثنائية مجزأة.
              </p>
            </div>

            {/* Box 2: SourceBuffer */}
            <div className="bg-[#1F2023] p-3 rounded-xl border border-gray-700/80">
              <div className="flex items-center justify-between text-gray-400 mb-1.5 font-bold">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  SourceBuffer
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    stats.isUpdating
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {stats.isUpdating ? 'Updating...' : 'Ready'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed truncate">
                الترميز: <span className="font-mono text-gray-300">{stats.mimeType.split(';')[0]}</span>
              </p>
            </div>

            {/* Box 3: Stream Mode */}
            <div className="bg-[#1F2023] p-3 rounded-xl border border-gray-700/80">
              <div className="flex items-center justify-between text-gray-400 mb-1.5 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  وضع التدفق (Mode)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                  {stats.sourceBufferMode}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => onChangeMode('sequence')}
                  className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                    stats.sourceBufferMode === 'sequence'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Sequence
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('segments')}
                  className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                    stats.sourceBufferMode === 'segments'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Segments
                </button>
              </div>
            </div>

            {/* Box 4: Quality & Bitrate */}
            <div className="bg-[#1F2023] p-3 rounded-xl border border-gray-700/80">
              <div className="flex items-center justify-between text-gray-400 mb-1.5 font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  جودة DASH التكيفية
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {selectedQuality}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {(['1080p', '720p', '480p', '360p'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuality(q)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition cursor-pointer ${
                      selectedQuality === q
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAppendChunkManually}
                disabled={!isMSEActive || stats.isUpdating}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="جلب ودمج شريحة بيانات 512KB في الـ SourceBuffer"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>دمج Chunk ثنائي يدوياً (+512KB)</span>
              </button>

              <button
                type="button"
                onClick={onEvictBuffer}
                disabled={!isMSEActive || stats.isUpdating}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="تفريغ أجزاء الفيديو التي تمت مشاهدتها لتوفير الذاكرة"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>تفريغ الذاكرة (Evict Old Buffer)</span>
              </button>

              <button
                type="button"
                onClick={onResetPipeline}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                <span>إعادة ضبط الأنبوب (Reset MSE)</span>
              </button>
            </div>

            {/* Codec MIME Selector */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">MIME Codec:</span>
              <select
                value={stats.mimeType}
                onChange={(e) => onChangeMimeType(e.target.value)}
                className="bg-[#242528] border border-gray-700 text-gray-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-hidden"
              >
                {CHROME_SUPPORTED_MSE_MIMES.map((mime) => (
                  <option key={mime} value={mime}>
                    {mime}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technical Note */}
          <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/50 flex items-start gap-2 text-[10px] text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>آلية Media Source Extensions في كروم:</strong> يتم تقسيم الفيديو إلى كتل (Chunks/Segments) ثنائية. يقوم المتصفح بجلبها عبر طلبات Range HTTP واستدعاء <code className="bg-black/40 px-1 py-0.5 rounded font-mono">SourceBuffer.appendBuffer()</code> بشكل غير متزامن. عند انتهاء التحديث (<code className="bg-black/40 px-1 py-0.5 rounded font-mono">updateend</code>)، يتم إرسال البيانات فوراً لعملية GPU Process ومسار فك التشفير Hardware Decoding بدون توقف أو تقطيع.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
