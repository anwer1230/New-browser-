import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Settings,
  Upload,
  Trash2,
  Send,
  Copy,
  Volume2,
  ArrowRight,
  Sparkles,
  CloudUpload,
  Link2,
  KeyRound,
  Save,
  Sun,
  Moon,
} from 'lucide-react';

export interface MobileMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  experts?: string[];
  elapsed?: number;
}

interface FlutterMobileSimulatorProps {
  messages: MobileMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  onUploadDocument: (fileName: string, content: string) => Promise<number>;
  onPlayTts: (text: string) => void;
  healthData: {
    models?: string[];
    rag?: { points: number; status: string };
    error?: string;
  } | null;
  onRefreshHealth: () => Promise<void>;
}

export const FlutterMobileSimulator: React.FC<FlutterMobileSimulatorProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearHistory,
  onUploadDocument,
  onPlayTts,
  healthData,
  onRefreshHealth,
}) => {
  const [screen, setScreen] = useState<'home' | 'chat' | 'settings' | 'upload'>('home');
  const [isDark, setIsDark] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [inputText, setInputText] = useState('');
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Settings screen state
  const [serverUrl, setServerUrl] = useState('http://10.0.2.2:8000');
  const [apiKey, setApiKey] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Upload screen state
  const [uploading, setUploading] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null);
  const [addedChunks, setAddedChunks] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, screen]);

  const showSnackBar = (text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleRefreshHealth = async () => {
    setCheckingHealth(true);
    await onRefreshHealth();
    setCheckingHealth(false);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText('');
    await onSendMessage(trimmed);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await onRefreshHealth();
      showSnackBar('✅ تم الحفظ والاتصال ناجح', 'success');
    } catch (e) {
      showSnackBar(`⚠️ تم الحفظ لكن الاتصال فشل: ${e}`, 'warning');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLastUploadedFile(file.name);
    setAddedChunks(null);

    try {
      const text = await file.text();
      const chunks = await onUploadDocument(file.name, text);
      setAddedChunks(chunks);
      showSnackBar(`✅ رُفع بنجاح: ${chunks} مقطع`, 'success');
    } catch (err) {
      showSnackBar(`❌ فشل: ${err}`, 'warning');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isHealthy = healthData && !healthData.error;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
      {/* Left Column: Interactive Mobile Viewport matching Flutter AppTheme & Screens */}
      <div className="w-full lg:w-[410px] shrink-0 mx-auto">
        <div
          className={`rounded-[32px] border-4 ${
            isDark ? 'border-slate-700 bg-[#0F172A] text-white' : 'border-slate-300 bg-[#F8FAFC] text-slate-900'
          } shadow-2xl overflow-hidden flex flex-col h-[740px] relative transition-colors duration-200`}
        >
          {/* Mobile Status Bar + Theme Switcher */}
          <div
            className={`px-6 py-2.5 flex items-center justify-between text-xs border-b ${
              isDark ? 'border-slate-800/80 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <span className="font-mono tabular-nums">9:41</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Flutter 3.x · Locale(ar, SA)</span>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-1 rounded-md transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="تبديل المظهر الفاتح/الداكن"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Screen 1: HomeScreen (lib/screens/home_screen.dart) */}
          {screen === 'home' && (
            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="mt-5 flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#6366F1]/15 flex items-center justify-center">
                    <Brain className="w-14 h-14 text-[#6366F1]" />
                  </div>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-center">AnwerBrowser</h2>
                <p
                  className={`mt-2 text-sm text-center ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  نظام ذكاء اصطناعي هجين — محلي وآمن
                </p>

                {/* _StatusCard */}
                <div
                  className={`mt-8 rounded-xl p-4 border ${
                    isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {checkingHealth ? (
                      <RefreshCw className="w-6 h-6 text-[#6366F1] animate-spin shrink-0" />
                    ) : isHealthy ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">
                        {checkingHealth
                          ? 'جاري الفحص...'
                          : isHealthy
                          ? 'الخادم متصل'
                          : 'الخادم غير متاح'}
                      </div>
                      {isHealthy && healthData?.models && (
                        <div
                          className={`text-xs mt-0.5 tabular-nums ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {healthData.models.length} نموذج متاح · {healthData.rag?.points ?? 0} مقطع RAG
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleRefreshHealth}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      title="تحديث حالة الخادم"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* _StatCard */}
                <div
                  className={`mt-4 rounded-xl p-4 border flex items-center justify-between ${
                    isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#6366F1]" />
                    <span className="text-sm">المحادثات</span>
                  </div>
                  <span className="font-bold text-sm tabular-nums">{messages.length} رسالة</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={() => setScreen('chat')}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>ابدأ محادثة جديدة</span>
                </button>
                <button
                  onClick={() => setScreen('settings')}
                  className={`w-full py-3.5 px-4 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>الإعدادات</span>
                </button>
              </div>
            </div>
          )}

          {/* Screen 2: ChatScreen (lib/screens/chat_screen.dart) */}
          {screen === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* AppBar */}
              <div
                className={`px-4 py-3 flex items-center justify-between border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setScreen('home')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                  title="رجوع"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <span className="font-bold text-base">المحادثة</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScreen('upload')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                    title="رفع ملف"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setConfirmClearModal(true)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                    title="مسح المحادثة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <Sparkles className="w-14 h-14 text-[#6366F1]/40 mb-4" />
                    <div className={`text-lg font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ابدأ بسؤال...
                    </div>
                    <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      جرّب: &quot;اشرح لي...&quot; أو &quot;اكتب كود...&quot; أو &quot;ابحث في ملفاتي عن...&quot;
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const isSystem = msg.role === 'system';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl ${
                            isUser
                              ? 'bg-[#6366F1] text-white rounded-br-sm'
                              : isSystem
                              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                              : isDark
                              ? 'bg-[#1E293B] text-white rounded-bl-sm border border-slate-800'
                              : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                          }`}
                        >
                          {!isUser && !isSystem && msg.experts && msg.experts.length > 0 && (
                            <div className="text-[11px] font-mono text-[#8B5CF6] mb-1.5">
                              {msg.experts.join(' · ')}
                            </div>
                          )}
                          <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                            {isUser ? (
                              <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] opacity-70">
                            {msg.elapsed !== undefined && (
                              <span className="font-mono tabular-nums">{msg.elapsed.toFixed(1)}s</span>
                            )}
                            {!isUser && !isSystem && (
                              <>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                    showSnackBar('تم النسخ', 'info');
                                  }}
                                  className="p-1 hover:opacity-100"
                                  title="نسخ"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onPlayTts(msg.content)}
                                  className="p-1 hover:opacity-100"
                                  title="قراءة صوتية بالعربية"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* TypingIndicator (lib/widgets/typing_indicator.dart) */}
                {isLoading && (
                  <div className="flex justify-end">
                    <div
                      className={`px-4 py-3 rounded-2xl flex items-center gap-1.5 ${
                        isDark ? 'bg-[#1E293B]' : 'bg-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce [animation-delay:200ms]" />
                      <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce [animation-delay:400ms]" />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-2 bg-red-500/10 text-red-400 text-xs text-center">{error}</div>
              )}

              {/* ChatInput (lib/widgets/chat_input.dart) */}
              <div
                className={`p-3 border-t flex items-center gap-2 ${
                  isDark ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-[#F8FAFC]'
                }`}
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="اكتب رسالتك..."
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none ${
                    isDark
                      ? 'bg-[#1E293B] text-white placeholder-slate-400'
                      : 'bg-slate-200/80 text-slate-900 placeholder-slate-500'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !inputText.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors shrink-0 ${
                    isLoading || !inputText.trim()
                      ? 'bg-slate-600 cursor-not-allowed'
                      : 'bg-[#6366F1] hover:bg-[#5558E6] cursor-pointer'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Screen 3: SettingsScreen (lib/screens/settings_screen.dart) */}
          {screen === 'settings' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div
                className={`px-4 py-3 flex items-center justify-between border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setScreen('home')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <span className="font-bold text-base">الإعدادات</span>
                <div className="w-8" />
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div
                  className={`rounded-xl p-4 border space-y-4 ${
                    isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <h3 className="font-bold text-base">اتصال الخادم</h3>
                  <div>
                    <label className="block text-xs mb-1 opacity-75">عنوان الخادم</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        dir="ltr"
                        className={`w-full px-3 py-2.5 pr-9 rounded-lg border text-sm font-mono ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <Link2 className="w-4 h-4 absolute right-3 top-3 opacity-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1 opacity-75">API Key (اختياري)</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="X-API-Key"
                        dir="ltr"
                        className={`w-full px-3 py-2.5 pr-9 rounded-lg border text-sm font-mono ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <KeyRound className="w-4 h-4 absolute right-3 top-3 opacity-50" />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ واختبار'}</span>
                  </button>
                </div>

                <div
                  className={`rounded-xl p-4 border ${
                    isDark ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-2">💡 مساعدة</h4>
                  <ul className="text-xs space-y-1.5 leading-relaxed opacity-80">
                    <li>• للجهاز نفسه: <code className="font-mono">http://localhost:8000</code></li>
                    <li>• لمحاكي Android: <code className="font-mono">http://10.0.2.2:8000</code></li>
                    <li>• لجهاز آخر في الشبكة: <code className="font-mono">http://&lt;IP&gt;:8000</code></li>
                    <li>• عبر الإنترنت: <code className="font-mono">https://your-domain.com</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Screen 4: UploadScreen (lib/screens/upload_screen.dart) */}
          {screen === 'upload' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div
                className={`px-4 py-3 flex items-center justify-between border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setScreen('chat')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <span className="font-bold text-base">رفع ملف للمستندات</span>
                <div className="w-8" />
              </div>

              <div className="flex-1 p-6 flex flex-col items-center justify-between text-center">
                <div className="mt-8 flex flex-col items-center">
                  <CloudUpload className="w-20 h-20 text-[#6366F1]" />
                  <h3 className="mt-5 font-semibold text-base">
                    ارفع ملفاتك ليتمكن النظام من البحث فيها
                  </h3>
                  <p className="mt-2 text-xs opacity-60 font-mono">PDF • DOCX • TXT • MD</p>

                  {lastUploadedFile && addedChunks !== null && (
                    <div className="mt-8 w-full rounded-xl p-3.5 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-right">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold">{lastUploadedFile}</div>
                        <div className="text-xs text-emerald-400">أُضيف {addedChunks} مقطع</div>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span>{uploading ? 'جاري الرفع...' : 'اختر ملفًا'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirm Clear Dialog (Matches showDialog<bool> in ChatScreen) */}
          {confirmClearModal && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-20">
              <div
                className={`w-full rounded-2xl p-5 border ${
                  isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <h4 className="font-bold text-base">مسح المحادثة</h4>
                <p className="text-sm opacity-75 mt-1">هل أنت متأكد؟</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmClearModal(false)}
                    className="px-4 py-2 text-xs rounded-lg opacity-75 hover:opacity-100"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setConfirmClearModal(false);
                    }}
                    className="px-4 py-2 text-xs rounded-lg bg-[#6366F1] text-white font-semibold"
                  >
                    مسح
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Snackbar Toast */}
          {toastMessage && (
            <div
              className={`absolute bottom-16 inset-x-4 py-2.5 px-4 rounded-xl text-xs font-medium text-white shadow-lg text-center z-30 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-600'
                  : toastMessage.type === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-slate-800'
              }`}
            >
              {toastMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Flutter Architecture & Build Instructions */}
      <div className="flex-1 space-y-6 w-full">
        <div className="rounded-xl border border-slate-800 bg-[#1E293B]/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              تطبيق الموبايل Flutter (Android & iOS) — جاهز ومتصل بالخادم
            </h3>
            <span className="text-xs font-mono text-slate-400">hybrid_ai_app/lib/</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            المحاكي التفاعلي على اليمين يعمل بنفس شاشات وكود تطبيق Flutter الموجود في مجلد{' '}
            <code className="text-indigo-400">hybrid_ai_app/</code> ومتصل مباشرة بواجهة{' '}
            <code className="text-indigo-400">/chat</code> و <code className="text-indigo-400">/upload</code> و{' '}
            <code className="text-indigo-400">/health</code>. يمكنك التنقل بين الشاشات الأربع مباشرة:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'home', label: 'HomeScreen', desc: 'حالة الخادم والإحصاءات' },
              { id: 'chat', label: 'ChatScreen', desc: 'المحادثة والخبراء والصوت' },
              { id: 'upload', label: 'UploadScreen', desc: 'رفع ملفات RAG' },
              { id: 'settings', label: 'SettingsScreen', desc: 'عنوان الخادم و API Key' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setScreen(item.id as typeof screen)}
                className={`p-3 rounded-lg border text-right transition-colors cursor-pointer ${
                  screen === item.id
                    ? 'border-[#6366F1] bg-[#6366F1]/15 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-xs font-semibold">{item.label}</div>
                <div className="text-[11px] opacity-75 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Connection Matrix from Section 2.8 */}
        <div className="rounded-xl border border-slate-800 bg-[#1E293B]/60 p-6">
          <h4 className="text-base font-bold text-white mb-3">
            جدول ربط تطبيق Flutter بالحاوية (القسم 2.8)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="py-2.5 px-3 font-medium">الحالة</th>
                  <th className="py-2.5 px-3 font-medium">عنوان الخادم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                <tr>
                  <td className="py-2.5 px-3">جهاز Android نفسه</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-300" dir="ltr">
                    http://localhost:8000
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">محاكي Android (Emulator Default)</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-300" dir="ltr">
                    http://10.0.2.2:8000
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">محاكي iOS</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-300" dir="ltr">
                    http://localhost:8000
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">جهاز آخر في نفس الشبكة</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-300" dir="ltr">
                    http://192.168.x.x:8000
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">عبر الإنترنت (مع Nginx HTTPS)</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-300" dir="ltr">
                    https://ai.yourdomain.com
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Build APK & iOS Commands from Section 2.7 */}
        <div className="rounded-xl border border-slate-800 bg-[#1E293B]/60 p-6">
          <h4 className="text-base font-bold text-white mb-3">
            أوامر بناء وتشغيل تطبيق الموبايل (القسم 2.7)
          </h4>
          <pre
            dir="ltr"
            className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed"
          >{`cd hybrid_ai_app
flutter pub get

# تشغيل للتطوير
flutter run

# بناء APK للأندرويد (Release)
flutter build apk --release --split-per-abi

# بناء iOS (على macOS)
flutter build ios --release`}</pre>
        </div>
      </div>
    </div>
  );
};
