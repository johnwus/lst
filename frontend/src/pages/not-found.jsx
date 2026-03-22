import { useLocation } from "wouter";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0c2e35] flex items-center justify-center px-6 py-12 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(64,208,255,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="mb-8 relative inline-block">
          <div className="text-[120px] font-black text-white/5 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl">
              <span className="text-4xl -rotate-12">🔍</span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Lost in Conversation?
        </h1>
        
        <p className="text-gray-400 mb-10 leading-relaxed">
          The page you’re looking for seems to have moved or doesn’t exist. Let’s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button
            onClick={() => setLocation("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-green-500 hover:shadow-lg hover:shadow-purple-500/25 transition-all font-bold"
          >
            <Home className="w-4 h-4" />
            Back Home
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Let's Talk . Error 404
          </p>
        </div>
      </div>
    </div>
  );
}
