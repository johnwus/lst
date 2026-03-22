import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useIsMobile } from '../hooks/use-mobile';
import { Smartphone, Download, X } from 'lucide-react';

/**
 * Premium invitation banner for PWA installation on mobile.
 */
export default function PWAInstallBanner() {
  // Combine touch capability + viewport width for reliable mobile detection.
  // viewport-width alone (useIsMobile) triggers on narrow desktop windows too.
  const isMobileViewport = useIsMobile();
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const isMobile = isMobileViewport && isTouchDevice;

  const { hasPrompt, isIOS, isStandalone, triggerInstall, dismissInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Priority 1: If native prompt fires, show it immediately on mobile
    if (isMobile && !isStandalone && hasPrompt) {
      setIsVisible(true);
      return;
    }

    // Priority 2: If iOS, show the guided instructions after a delay
    if (isMobile && !isStandalone && isIOS) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isStandalone, hasPrompt, isIOS]);

  if (!isMobile || isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-linear-to-r from-[hsl(var(--sidebar))] to-[hsl(var(--topic-open))] border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <Smartphone className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-bold">Install Let's Talk</h4>
          <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
            Add to home screen for real-time notifications and full-screen multitasking.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {hasPrompt ? (
            <button
              onClick={triggerInstall}
              className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 active:scale-95 transition-all shadow-sm"
            >
              <Download className="w-3 h-3" />
              Install
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowGuide(true)}
              className="bg-white/10 text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-white/15 active:scale-95 transition-all border border-white/5"
            >
              How to Install
            </button>
          ) : null}
          
          <button 
            onClick={() => {
              setIsVisible(false);
              dismissInstall();
              setShowGuide(false);
            }}
            className="flex items-center justify-center gap-1 text-[10px] text-gray-500 hover:text-gray-300"
          >
            <X className="w-2.5 h-2.5" />
            Not now
          </button>
        </div>
      </div>

      {showGuide && isIOS && (
        <div className="absolute bottom-full left-0 right-0 mb-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl p-4 shadow-2xl relative">
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[hsl(var(--sidebar))] border-r border-b border-white/10 rotate-45" />
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-white text-xs font-bold font-['Inter']">Follow these steps:</h5>
              <X className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setShowGuide(false)} />
            </div>
            
            <ol className="text-[11px] text-gray-300 space-y-2 list-decimal list-inside font-['Inter']">
              <li>Tap the <span className="inline-block px-1.5 py-0.5 bg-white/5 rounded mx-0.5 font-bold">Share</span> icon in Safari footer.</li>
              <li>Scroll down and tap <span className="text-white font-medium italic">"Add to Home Screen"</span>.</li>
              <li>Tap <span className="text-white font-bold">Add</span> in the top right corner.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
