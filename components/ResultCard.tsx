
import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ExternalLink, ArrowLeft, Info, ArrowRight } from 'lucide-react';
import { RiskLevel, ScanResult } from '../types';

interface ResultCardProps {
  result: ScanResult;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const isSafe = result.risk === RiskLevel.SAFE;
  const isPhishing = result.risk === RiskLevel.PHISHING;
  const isSuspicious = result.risk === RiskLevel.SUSPICIOUS;

  const themes = {
    [RiskLevel.SAFE]: {
      accent: 'blue', // Theme change: Blue for safe/trusted
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      text: 'text-blue-600',
      iconBg: 'bg-blue-500',
      indicator: 'bg-blue-500'
    },
    [RiskLevel.SUSPICIOUS]: {
      accent: 'amber',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      text: 'text-amber-600',
      iconBg: 'bg-amber-500',
      indicator: 'bg-amber-500'
    },
    [RiskLevel.PHISHING]: {
      accent: 'rose',
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      text: 'text-rose-600',
      iconBg: 'bg-rose-500',
      indicator: 'bg-rose-500'
    },
  };

  const currentTheme = themes[result.risk];
  const Icon = isSafe ? ShieldCheck : (isPhishing ? ShieldX : ShieldAlert);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 ${currentTheme.border} shadow-2xl transition-colors duration-300`}>
        
        {/* Header Visual */}
        <div className={`h-32 w-full ${currentTheme.bg} flex items-center justify-center relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 p-8 opacity-10`}>
             <Icon size={120} />
          </div>
          <div className={`${currentTheme.iconBg} p-5 rounded-[2rem] shadow-xl shadow-${currentTheme.accent}-500/20 z-10 scale-110`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight">
              {result.risk} <span className="opacity-50 font-normal italic">Detection</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-[0.2em]">
              Security Confidence Score: <span className={`${currentTheme.text} font-bold`}>{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            
            {/* Progress Gauge */}
            <div className="mt-4 h-2 w-48 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full ${currentTheme.indicator} transition-all duration-1000 ease-out`}
                 style={{ width: `${result.confidence * 100}%` }}
               />
            </div>
          </div>

          <div className="space-y-8">
            {/* URL Section */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} /> Analyzed Resource
              </h3>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 group transition-all">
                <p className="text-slate-900 dark:text-slate-100 font-mono text-sm break-all leading-relaxed line-clamp-2 italic">
                  {result.url}
                </p>
              </div>
            </section>

            {/* Analysis Points */}
            {result.reasons.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Factors Identified</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${currentTheme.indicator} shrink-0`} />
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isSafe ? (
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  Visit Secure Site <ExternalLink size={18} />
                </a>
              ) : (
                <button 
                  onClick={onReset}
                  className="flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  Stay Secure <ArrowRight size={18} />
                </button>
              )}
              
              <button 
                onClick={onReset}
                className="flex items-center justify-center gap-3 py-4 bg-transparent border-2 border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
              >
                Scan Another <ArrowLeft size={18} />
              </button>
            </div>
            
            {!isSafe && (
              <div className="text-center">
                <a 
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-slate-300 hover:text-rose-400 uppercase tracking-widest transition-colors"
                >
                  Ignore warnings and proceed at own risk
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
