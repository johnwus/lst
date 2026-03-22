import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Check } from "lucide-react";

export function ShareModalContent({
  url,
  topicTitle = "Let's Talk",
  topicDescription = "Join the conversation",
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: topicTitle,
        text: topicDescription,
        url: url,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Native share failed:", err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-[hsl(var(--sidebar))]/80 backdrop-blur-xl border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg mx-auto relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Share Topic</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
            {topicTitle}
          </h3>
          {topicDescription && (
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
              {topicDescription}
            </p>
          )}
        </div>

        {/* Copy Link Section */}
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Share2 className="w-4 h-4 text-white/40" />
            </div>
            <input
              value={url}
              readOnly
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-10 pr-24 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={handleCopy}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-white text-black font-bold text-xs rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-[#4fd165] to-[#7be495] hover:opacity-90 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Open System Share
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            Let's Talk Premium Sharing
          </p>
        </div>
      </div>
    </motion.div>
  );
}