import React, { useState, useEffect } from 'react';
import { Database, Play, RefreshCw, Eye, Power, Archive, Trash2, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { WhatsAppSourceAdapter, SourceState } from '../types';
import { initialWhatsAppSource, parseWhatsAppMessage, WHATSAPP_FIXTURES } from '../utils/whatsappParser';

export default function DataTruthCenter() {
  const [sources, setSources] = useState<WhatsAppSourceAdapter[]>(() => {
    const saved = localStorage.getItem('avara_whatsapp_sources');
    return saved ? JSON.parse(saved) : [initialWhatsAppSource];
  });
  
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [testMessageIdx, setTestMessageIdx] = useState(0);

  useEffect(() => {
    localStorage.setItem('avara_whatsapp_sources', JSON.stringify(sources));
  }, [sources]);

  const handleTestParsing = (id: string) => {
    const message = WHATSAPP_FIXTURES[testMessageIdx];
    const parsed = parseWhatsAppMessage(message);
    
    setSources(prev => prev.map(s => {
      if (s.sourceId === id) {
        return {
          ...s,
          ...parsed,
          rawMessageText: message,
          fetchedAt: Date.now(),
          status: parsed.validationStatus === 'passed' ? 'testing' : 'rejected'
        } as WhatsAppSourceAdapter;
      }
      return s;
    }));
    
    // Rotate fixture
    setTestMessageIdx((prev) => (prev + 1) % WHATSAPP_FIXTURES.length);
  };

  const handleStatusChange = (id: string, newStatus: SourceState) => {
    setSources(prev => prev.map(s => s.sourceId === id ? { ...s, status: newStatus } : s));
  };

  const selectedSource = sources.find(s => s.sourceId === selectedSourceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-extrabold text-[var(--accent-gold)] flex items-center gap-2">
          <Database className="w-6 h-6" />
          مرکز حقیقت داده و منابع
        </h2>
        <span className="text-xs text-gray-500 font-mono bg-black/20 px-3 py-1 rounded-full">
          Candidate Source Registry
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">منابع کاندید و فعال</h3>
          
          <div className="space-y-3">
            {sources.map(source => (
              <div 
                key={source.sourceId}
                onClick={() => setSelectedSourceId(source.sourceId)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                  selectedSourceId === source.sourceId 
                    ? "bg-[var(--bg-panel-heavy)] border-[var(--accent-gold)]/50" 
                    : "bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate pr-2">{source.sourceName}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono ${
                    source.status === 'verified_live' ? 'bg-emerald-500/20 text-emerald-400' :
                    source.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    source.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono truncate mb-2">
                  {source.sourceUrl}
                </div>
                <div className="text-[10px] flex justify-between items-center text-gray-400">
                  <span>نوع: {source.sourceType}</span>
                  {source.fetchedAt > 0 && <span>آخرین بروزرسانی: {new Date(source.fetchedAt).toLocaleTimeString('fa-IR')}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl mt-4">
             <div className="flex items-start gap-2 mb-2">
               <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
               <span className="text-xs text-red-400 font-bold">منابع حذف‌شده یا نیازمند بررسی</span>
             </div>
             {sources.filter(s => s.status === 'rejected' || s.status === 'archived' || s.status === 'unavailable').map(s => (
               <div key={s.sourceId} className="text-[10px] text-gray-400 mt-2 p-2 bg-black/40 rounded border border-red-900/30">
                 {s.sourceName} - {s.status}
                 <div className="text-red-400/80 mt-1">
                   {s.status === 'unavailable' ? '«دریافت عمومی و قانونی محتوای کانال واتساپ برای اعتبارسنجی خودکار فراهم نشد.»' : 
                    s.status === 'rejected' ? '«محتوا قوانین اعتبارسنجی مقادیر را پاس نکرد.»' : ''}
                 </div>
               </div>
             ))}
             {sources.filter(s => s.status === 'rejected' || s.status === 'archived' || s.status === 'unavailable').length === 0 && (
               <span className="text-[10px] text-gray-500">موردی یافت نشد</span>
             )}
          </div>
        </div>

        {/* Source Details & Controls */}
        <div className="lg:col-span-2">
          {selectedSource ? (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)]/50 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedSource.sourceName}</h3>
                  <a href={selectedSource.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline font-mono">
                    {selectedSource.sourceUrl}
                  </a>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTestParsing(selectedSource.sourceId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-gold-soft)] text-[var(--accent-gold)] text-xs font-bold hover:bg-[var(--accent-gold)] hover:text-black transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Test WhatsApp source
                  </button>
                  <button 
                    onClick={() => handleTestParsing(selectedSource.sourceId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedSource.sourceId, 'unavailable')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Disable
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedSource.sourceId, selectedSource.status === 'archived' ? 'candidate' : 'archived')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 text-xs hover:bg-gray-500/20 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {selectedSource.status === 'archived' ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Inspect Raw Message
                    </h4>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-gray-300 font-sans leading-relaxed min-h-[60px] text-right direction-rtl">
                      {selectedSource.rawMessageText || <span className="text-gray-600">بدون پیام</span>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Inspect Parsed Result
                    </h4>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs space-y-2 font-mono">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">Asset Identity</span>
                        <span className="text-emerald-400 font-bold">{selectedSource.parsedAsset || 'None'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">Price Value</span>
                        <span className="text-white">{selectedSource.parsedPrice ? selectedSource.parsedPrice.toLocaleString() : 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Validation</span>
                        <span className={selectedSource.validationStatus === 'passed' ? 'text-emerald-400' : 'text-amber-400'}>
                          {selectedSource.validationStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Inspect Unit Conversion
                    </h4>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs space-y-2 font-mono">
                       <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">Explicit Unit</span>
                        <span className="text-blue-400">{selectedSource.explicitUnit || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Normalized IRR</span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {selectedSource.normalizedIrrValue ? selectedSource.normalizedIrrValue.toLocaleString() : '---'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Inspect Validation Logs
                  </h4>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] font-mono h-[300px] overflow-y-auto text-left direction-ltr">
                    {selectedSource.logs && selectedSource.logs.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedSource.logs.map((log, i) => (
                          <div key={i} className={`pb-1.5 border-b border-white/5 ${log.includes('Failed') || log.includes('Warning') ? 'text-amber-400' : 'text-gray-400'}`}>
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600 italic">No logs available. Run a test to generate validation logs.</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Database className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-sm text-gray-400">یک منبع را از لیست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
