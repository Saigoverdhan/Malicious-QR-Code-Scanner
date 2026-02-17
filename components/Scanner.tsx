
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

declare const jsQR: any;
declare const BarcodeDetector: any;

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const requestRef = useRef<number | null>(null);
  
  // Use a ref to prevent multiple triggers during transition
  const hasTriggered = useRef(false);

  const startCamera = async () => {
    try {
      // Request higher resolution for better QR recognition
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // Try to enable focus on mobile if supported
          advanced: [{ focusMode: 'continuous' }] as any
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setError("Camera access denied or unavailable. Please check permissions.");
    }
  };

  const tick = async () => {
    if (hasTriggered.current) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      
      // Try Native BarcodeDetector first (Chromium/Android/iOS 17+)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0 && !hasTriggered.current) {
            handleSuccess(barcodes[0].rawValue);
            return;
          }
        } catch (e) {
          // Fallback to jsQR if detector fails
        }
      }

      // Fallback to jsQR
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d', { willReadFrequently: true });
      
      if (canvas && context) {
        // Optimize: we don't need full resolution for jsQR, but high enough to see details
        const scale = 0.8; 
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && !hasTriggered.current) {
          handleSuccess(code.data);
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleSuccess = (data: string) => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    setIsDetected(true);
    
    // Slight delay for visual confirmation before switching
    setTimeout(() => {
      onScan(data);
    }, 600);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 border-2 ${isDetected ? 'border-emerald-500 scale-95 shadow-emerald-500/20' : 'border-white/10 shadow-blue-500/10'}`}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900">
            <ShieldAlert className="w-16 h-16 text-rose-500 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Access Error</h3>
            <p className="text-slate-400 mb-8">{error}</p>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-bold hover:scale-105 transition-transform"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-500 ${isDetected ? 'opacity-40' : 'opacity-100'}`} />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Detection Success State */}
            {isDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm animate-in zoom-in duration-300">
                <div className="bg-white rounded-full p-4 shadow-2xl">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                </div>
              </div>
            )}

            {/* High-Tech Overlay */}
            {!isDetected && (
              <div className="absolute inset-0 pointer-events-none">
                  {/* Dark Mask */}
                  <div className="absolute inset-0 bg-black/40"></div>
                  
                  {/* Clear Square */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72">
                    <div className="absolute inset-0 bg-transparent ring-[100vmax] ring-slate-950/60"></div>
                    
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scanLine_2.5s_infinite_ease-in-out]"></div>
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-6">
        <div className={`px-5 py-2 rounded-full backdrop-blur-md border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${isDetected ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/10 border-white/10 text-white/80'}`}>
          <div className={`w-2 h-2 rounded-full ${isDetected ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`}></div>
          {isDetected ? 'QR Code Extracted!' : 'Align QR code within the box'}
        </div>
        
        <button 
          onClick={onClose}
          className="group p-4 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all duration-300"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(0); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(18rem); }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
