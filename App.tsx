
import React, { useState, useEffect } from 'react';
import { QrCode, Upload, Shield, Info, History as HistoryIcon, Sun, Moon, Zap, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
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
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('qr_shield_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const handleScan = async (url: string) => {
    setIsScanning(false);
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeURL(url);
      const newResult: ScanResult = { url, ...analysis, timestamp: Date.now() };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
    } catch (err) {
      setError("Analysis engine failed. Checking network...");
    } finally {
      setLoading(false);
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
        setError("No readable QR code found in image.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to process image file.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40">
      
      {/* Dynamic Background Blurs */}
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
              >
                {darkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-slate-700" />}
              </button>
              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all hover:scale-105">
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
                <h3 className="text-2xl font-extrabold mb-2 dark:text-white">Neural Analysis</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Deconstructing URL structure and scanning global threat intelligence...</p>
             </div>
          </div>
        )}

        {isScanning && <Scanner onScan={handleScan} onClose={() => setIsScanning(false)} />}

        {!result ? (
          <div className="flex flex-col items-center">
            
            {/* Hero Section */}
            <div className="w-full text-center max-w-3xl mb-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                 <Lock size={12} /> Privacy Focused Phishing Prevention
              </div>
              <h2 className="text-5xl sm:text-7xl font-[800] tracking-tight mb-8 leading-[0.95] dark:text-white">
                Visit any QR code <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">Without the Risk.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                Quishing is on the rise. Shield your digital life with enterprise-grade AI link analysis built into your browser.
              </p>
            </div>

            {/* Actions Grid (Bento Box Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl">
              
              {/* Primary Action */}
              <button 
                onClick={() => setIsScanning(true)}
                className="md:col-span-8 group relative overflow-hidden p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-500 text-left shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <QrCode size={200} />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-extrabold mb-3 dark:text-white">Live Lens</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                    Open your camera and scan instantly. Our AI monitors the frame for potential threats in real-time.
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    Initialize Scanner <ArrowRight size={16} />
                  </div>
                </div>
              </button>

              {/* Secondary Action */}
              <label className="md:col-span-4 cursor-pointer group p-10 bg-slate-900 dark:bg-white rounded-[3rem] transition-all duration-500 text-left shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="h-full flex flex-col justify-between">
                  <div className="w-14 h-14 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center mb-8">
                    <Upload className="w-6 h-6 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold mb-2 text-white dark:text-slate-900">Upload</h3>
                    <p className="text-white/50 dark:text-slate-900/50 text-xs font-medium leading-relaxed">
                      Analyze saved photos or screenshots from your device.
                    </p>
                  </div>
                </div>
              </label>

              {/* Mini Features */}
              <div className="md:col-span-4 p-8 glass rounded-[2.5rem] border border-white/20 flex items-center gap-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                   <ShieldCheck size={24} className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">Malware Check</h4>
                  <p className="text-[11px] text-slate-500">Global blacklists verified</p>
                </div>
              </div>

              <div className="md:col-span-4 p-8 glass rounded-[2.5rem] border border-white/20 flex items-center gap-6">
                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                   <Zap size={24} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">Instant Results</h4>
                  <p className="text-[11px] text-slate-500">Under 2.5s analysis time</p>
                </div>
              </div>

              <div className="md:col-span-4 p-8 glass rounded-[2.5rem] border border-white/20 flex items-center gap-6">
                <div className="p-4 bg-amber-500/10 rounded-2xl">
                   <Info size={24} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">Pattern Recognition</h4>
                  <p className="text-[11px] text-slate-500">Detects typosquatting</p>
                </div>
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

            {/* History Section */}
            {history.length > 0 && (
              <div className="mt-32 w-full max-w-4xl">
                <div className="flex items-center justify-between mb-10 px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                       <HistoryIcon className="w-5 h-5 opacity-50 dark:text-white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold dark:text-white">Audit Log</h3>
                       <p className="text-xs text-slate-400 font-medium">Your recent safety checks</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setHistory([])}
                    className="text-xs font-extrabold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                  >
                    Wipe History
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map((h, i) => (
                    <button 
                      key={i} 
                      onClick={() => setResult(h)}
                      className="group p-5 glass border border-white/20 dark:border-white/5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-all text-left"
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
                            {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Footer */}
      <footer className="mt-20 py-16 px-6 border-t border-slate-200/10 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
           <div className="flex items-center gap-3 opacity-30 grayscale contrast-150">
              <ShieldCheck size={24} className="dark:text-white" />
              <h1 className="text-xl font-black tracking-tighter dark:text-white">QR SHIELD</h1>
           </div>
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
             <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Safety Guide</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Github Source</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Security Research</a>
           </div>
           <p className="text-xs text-slate-400 font-medium opacity-50">
            © {new Date().getFullYear()} QR Shield Intelligence. All models run in isolated environments.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
