
import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

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
  const [showHelp, setShowHelp] = useState(false);
  const requestRef = useRef<number | null>(null);
  
  // Optimization Refs
  const hasTriggered = useRef(false);
  const isProcessing = useRef(false);
  const lastScanTime = useRef(0);
  const SCAN_INTERVAL = 150; // Throttled to ~6.6 FPS to save CPU
  const PROCESSING_WIDTH = 480; // Optimized width for QR decoding

  const startCamera = async () => {
    try {
      // Optimized camera constraints for scanning
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 }, // Sufficient resolution for QR, low processing overhead
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
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
      setError("Unable to start camera. Please ensure permissions are granted.");
    }
  };

  const tick = async () => {
    if (hasTriggered.current) return;

    const now = Date.now();
    // Throttle: Skip frame if interval hasn't passed or if previous decode is still running
    if (now - lastScanTime.current < SCAN_INTERVAL || isProcessing.current) {
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      isProcessing.current = true;
      lastScanTime.current = now;

      const video = videoRef.current;
      
      // 1. Try Native BarcodeDetector (High performance, hardware accelerated)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0 && !hasTriggered.current) {
            handleSuccess(barcodes[0].rawValue);
            isProcessing.current = false;
            return;
          }
        } catch (e) {
          // Fallback to jsQR
        }
      }

      // 2. jsQR Fallback with Image Optimization
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d', { willReadFrequently: true });
      
      if (canvas && context) {
        // Optimization: Resize captured frame to fixed width for consistent speed
        const scale = PROCESSING_WIDTH / video.videoWidth;
        canvas.width = PROCESSING_WIDTH;
        canvas.height = video.videoHeight * scale;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Optimization: Manual Grayscale + Binary Thresholding
        // This dramatically improves contrast for the decoder in low light
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Apply threshold: 120 is usually a good balance for QR contrast
          const thresholdValue = avg > 120 ? 255 : 0;
          data[i] = thresholdValue;     // R
          data[i + 1] = thresholdValue; // G
          data[i + 2] = thresholdValue; // B
          // Alpha (data[i+3]) remains unchanged
        }
        
        // Put processed data back (Optional for jsQR as it uses the buffer, 
        // but helps if we wanted to visualize the debug feed)
        // context.putImageData(imageData, 0, 0);

        const code = jsQR(data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data && !hasTriggered.current) {
          handleSuccess(code.data);
          isProcessing.current = false;
          return;
        }
      }
      isProcessing.current = false;
    }
    
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleSuccess = (data: string) => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    setIsDetected(true);
    
    if ('vibrate' in navigator) navigator.vibrate(100);

    // Stop animation loop immediately
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    setTimeout(() => {
      onScan(data);
    }, 400);
  };

  useEffect(() => {
    startCamera();
    
    // 4-second timeout message if no QR found
    const timer = setTimeout(() => {
      if (!hasTriggered.current) setShowHelp(true);
    }, 4000);

    return () => {
      clearTimeout(timer);
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
            <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
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
            
            {isDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm animate-in zoom-in duration-300">
                <div className="bg-white rounded-full p-4 shadow-2xl">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                </div>
              </div>
            )}

            {!isDetected && (
              <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72">
                    <div className="absolute inset-0 bg-transparent ring-[100vmax] ring-slate-950/60"></div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scanLine_2.5s_infinite_ease-in-out]"></div>
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-6 max-w-sm text-center">
        {showHelp && !isDetected && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-xl animate-in slide-in-from-top-2">
            <Info size={16} /> Troubles scanning? Try moving further away or adding light.
          </div>
        )}

        <div className={`px-5 py-2 rounded-full backdrop-blur-md border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${isDetected ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/10 border-white/10 text-white/80'}`}>
          <div className={`w-2 h-2 rounded-full ${isDetected ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`}></div>
          {isDetected ? 'Success!' : 'Detecting QR Code...'}
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
