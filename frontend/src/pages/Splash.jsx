import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        setLocation(user ? '/' : '/auth');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, user, setLocation]);

  return (
    <div className="min-h-screen bg-[#1a3a3a] flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative flex flex-col items-center animate-pulse">
        <div className="relative">
          <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="text-white font-black text-sm leading-none">LET'S</div>
              <div className="text-white font-black text-sm leading-none">TALK!</div>
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-7 h-5 bg-amber-100 rounded-lg flex items-center justify-center shadow">
            <span className="text-xs">···</span>
          </div>
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => (
            <div
              key={pos}
              className="absolute w-2 h-2 border border-amber-400/40 rounded-full"
              style={{
                top: i < 2 ? '-12px' : 'auto',
                bottom: i >= 2 ? '-12px' : 'auto',
                left: i % 2 === 0 ? '-12px' : 'auto',
                right: i % 2 !== 0 ? '-12px' : 'auto',
              }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 text-center">
        <div className="text-gray-400 text-xs tracking-widest uppercase">POWERED</div>
        <div className="text-gray-400 text-xs">Group 2</div>
      </div>
    </div>
  );
}
