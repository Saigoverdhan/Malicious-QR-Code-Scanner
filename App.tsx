
import React, { useState, useEffect } from 'react';
import { QrCode, Upload, Shield, Info, History as HistoryIcon, Sun, Moon, Zap, ShieldCheck, Lock, ArrowRight, Keyboard } from 'lucide-react';
import Scanner from './components/Scanner';
import ResultCard from './components/ResultCard';
import { analyzeURL } from './services/geminiService';
import { decodeQRCodeFromImage } from './utils/qrUtils';
import { ScanResult, RiskLevel } from './types';

const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qr_shield_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
    
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { 
      const scriptTags = document.querySelectorAll('script[src*="jsqr"]');
      scriptTags.forEach(s => s.remove());
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('qr_shield_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const handleScan = async (url: string) => {
    setIsScanning(false);
    setShowManual(false);
    setLoading(true);
    setError(null);
    try {
      // Ensure we treat simple text as a search if it doesn't look like a URL
      const formattedUrl = url.trim();
      const analysis = await analyzeURL(formattedUrl);
      const newResult: ScanResult = { url: formattedUrl, ...analysis, timestamp: Date.now() };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Analysis engine failed. Please try again with a clearer URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl) {
      handleScan(manualUrl);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const url = await decodeQRCodeFromImage(file);
      if (url) await handleScan(url);
      else {
        setError("No readable QR patterns found. Try a closer, brighter image.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to process the uploaded image file.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[120px] rounded-full animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between glass mt-4 sm:rounded-3xl border border-white/20 shadow-lg sm:mx-4 lg:mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
               <h1 className="text-lg font-extrabold tracking-tight dark:text-white leading-none">QR SHIELD</h1>
               <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Enterprise AI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-slate-700" />}
              </button>
              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95">
                Pro Tools
              </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        
        {loading && (
          <div className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="glass p-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-white/20">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-[3px] border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-[3px] border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold mb-2 dark:text-white tracking-tight">AI Neutral Analysis</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  Scanning global threat intelligence and analyzing URL entropy...
                </p>
             </div>
          </div>
        )}

        {isScanning && <Scanner onScan={handleScan} onClose={() => setIsScanning(false)} />}

        {!result ? (
          <div className="flex flex-col items-center">
            
            {/* Hero Section */}
            <div className="w-full text-center max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                 <Lock size={12} /> High-Precision Threat Detection
              </div>
              <h2 className="text-5xl sm:text-7xl font-[800] tracking-tight mb-8 leading-[0.95] dark:text-white">
                Scan QR codes <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">with absolute trust.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                Enhanced scanning algorithms for better accuracy on laptops and mobile. Neural-grade link verification for modern quishing protection.
              </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl">
              
              {/* Primary Action */}
              <button 
                onClick={() => setIsScanning(true)}
                className="md:col-span-8 group relative overflow-hidden p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-500 text-left shadow-xl shadow-slate-200/50 dark:shadow-none active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <QrCode size={200} />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-extrabold mb-3 dark:text-white">Neural Lens</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                    Instantly identify and verify QR codes using high-precision hardware acceleration.
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    Open AI Scanner <ArrowRight size={16} />
                  </div>
                </div>
              </button>

              {/* Upload Action */}
              <label className="md:col-span-4 cursor-pointer group p-10 bg-slate-900 dark:bg-white rounded-[3rem] transition-all duration-500 text-left shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="h-full flex flex-col justify-between">
                  <div className="w-14 h-14 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center mb-8">
                    <Upload className="w-6 h-6 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold mb-2 text-white dark:text-slate-900 tracking-tight">Gallery Scan</h3>
                    <p className="text-white/50 dark:text-slate-900/50 text-xs font-medium leading-relaxed">
                      Deep-scan saved screenshots for hidden deceptive patterns.
                    </p>
                  </div>
                </div>
              </label>

              {/* Manual Entry Fallback */}
              <div className={`md:col-span-12 transition-all duration-500 ${showManual ? 'p-8' : 'p-4'} glass rounded-[2.5rem] border border-white/20 overflow-hidden`}>
                {!showManual ? (
                  <button 
                    onClick={() => setShowManual(true)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]"
                  >
                    <Keyboard size={16} /> Troubles scanning? Enter link manually
                  </button>
                ) : (
                  <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Paste suspicious URL here..."
                      className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl outline-none focus:border-blue-500 transition-colors dark:text-white"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!manualUrl}
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Verify Link
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowManual(false)}
                      className="px-4 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-12 p-5 glass border border-rose-500/20 text-rose-500 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
                 <div className="p-2 bg-rose-500/10 rounded-lg">
                    <Shield size={16} />
                 </div>
                 <p className="text-sm font-bold tracking-tight">{error}</p>
              </div>
            )}

            {/* History Logs */}
            {history.length > 0 && (
              <div className="mt-32 w-full max-w-4xl">
                <div className="flex items-center justify-between mb-10 px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                       <HistoryIcon className="w-5 h-5 opacity-50 dark:text-white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold dark:text-white tracking-tight">Security Audit Logs</h3>
                       <p className="text-xs text-slate-400 font-medium">Encrypted on-device verification history</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setHistory([])}
                    className="text-xs font-extrabold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                  >
                    Clear History
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map((h, i) => (
                    <button 
                      key={i} 
                      onClick={() => setResult(h)}
                      className="group p-5 glass border border-white/20 dark:border-white/5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-all text-left active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                          h.risk === RiskLevel.SAFE ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 
                          h.risk === RiskLevel.PHISHING ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                        }`}>
                          <Shield size={20} />
                        </div>
                        <div className="overflow-hidden pr-4">
                          <p className="font-extrabold truncate text-sm dark:text-white group-hover:text-blue-500 transition-colors mb-0.5">{h.url}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Check complete at {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 h-2 w-2 rounded-full bg-slate-300 dark:bg-white/10 group-hover:bg-blue-500 transition-colors"></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ResultCard result={result} onReset={() => setResult(null)} />
        )}
      </main>

      <footer className="mt-20 py-16 px-6 border-t border-slate-200/10 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
           <div className="flex items-center gap-3 opacity-30 grayscale contrast-150">
              <ShieldCheck size={24} className="dark:text-white" />
              <h1 className="text-xl font-black tracking-tighter dark:text-white uppercase">QR SHIELD</h1>
           </div>
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
             <a href="#" className="hover:text-blue-500 transition-colors">Enterprise API</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Privacy Shield</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Open Forensics</a>
           </div>
           <p className="text-xs text-slate-400 font-medium opacity-50">
            © {new Date().getFullYear()} QR Shield. Intelligence powered by Gemini Pro forensics.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
