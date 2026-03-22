import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

// Use the logo image from attached_assests (update path if needed)
import appLogo from '../asssets/AppLogo.png'; // Place the logo image as lets_talk_logo.png in attached_assests

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'session_expired') {
      setError('Your session has expired. Please log in again.');
      window.history.replaceState({}, '', '/auth');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password, form.displayName);
      }
      setLocation('/');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  // Left panel content and accent color based on mode
  const leftPanel = mode === 'login'
    ? {
        accent: 'from-[#ff9b1f] to-[#ff3257]',
        bg: 'bg-[#0f2d3c]',
        border: 'border-r',
        title: 'Welcome Back!',
        desc: 'Reconnect and continue your conversations in a focused, calm space. Your threads and live rooms await.',
        topic: "Today's topic",
        topicTitle: 'How do we keep public discussions thoughtful in fast-moving spaces?',
        topicDesc: 'Join global threads, explore active topics, and move between live discussion and personal updates in one calm workspace.',
        badge: 'live',
        badgeColor: 'bg-[#0f8b3a]',
      }
    : {
        accent: 'from-[#2cb8ff] to-[#b44cff]',
        bg: 'bg-[#1a2e3c]',
        border: 'border-r',
        title: 'Create Your Space',
        desc: 'Start fresh! Set up your profile and join a new kind of group chat, designed for thoughtful, focused conversations.',
        topic: 'Why join Let\'s Talk?',
        topicTitle: 'A new way to connect, share, and grow together.',
        topicDesc: 'Move seamlessly between live chat and threads, with tools that help you stay present and engaged.',
        badge: 'new',
        badgeColor: 'bg-[#2cb8ff]',
      };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0c2e35] via-[#123f50] to-[#223d5a] flex items-center flex-col justify-center px-3 py-5 text-white">
      <div className="flex flex-col items-center justify-center mb-6 -mt-40 ">
            <div className="w-48 h-48 mb-2 drop-shadow-[0_0_15px_rgba(64,208,255,0.3)]">
              <img src={appLogo} alt="Let's Talk Logo" className="w-full h-full object-contain" />
            </div>
          </div>

      <div className="flex-col flex inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_50%,rgba(64,208,255,0.08),transparent_40%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b2230]/80 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-2 gap-0">
          <div className={`relative p-8 ${leftPanel.bg} ${leftPanel.border} border-white/10`}>
            <div className="flex flex-col items-start gap-4 mb-6">
           
              <div>
                <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#aad8ff] mb-2">{mode === 'login' ? 'Returning User' : 'New Member'}</div>
                <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-lg">{leftPanel.title}</h1>
                <p className="text-sm text-[#b9d7f1] mt-2 max-w-xs">{leftPanel.desc}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#112d3f]/80 p-4 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-[#9bd4ff] mb-2">
                <span>{leftPanel.topic}</span>
                <span className={`px-2 py-0.5 rounded-full ${leftPanel.badgeColor} text-white`}>{leftPanel.badge}</span>
              </div>
              <div className="rounded-xl bg-[#0a2c3d] border border-white/5 p-3">
                <div className="text-[10px] text-[#8fb8d3] uppercase font-semibold mb-1">{leftPanel.topic}</div>
                <div className="text-xl font-bold text-white leading-snug mb-2">{leftPanel.topicTitle}</div>
                <div className="text-xs text-[#c7dff4] mb-3">{leftPanel.topicDesc}</div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#0f2634] flex flex-col justify-center gap-4">

            {error && <div className="mb-3 rounded-xl bg-red-500/20 border border-red-400/40 px-3 py-2 text-sm text-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs text-[#a5c9e1] mb-1">Full name</label>
                    <input
                      value={form.displayName}
                      onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
                      placeholder="Christ Doe"
                      className="w-full rounded-xl border border-white/15 bg-[#0a1b28] px-3 py-2.5 text-white placeholder:text-[#7d96ad] focus:border-[#3d97ff] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#a5c9e1] mb-1">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="christ_user"
                      className="w-full rounded-xl border border-white/15 bg-[#0a1b28] px-3 py-2.5 text-white placeholder:text-[#7d96ad] focus:border-[#3d97ff] outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-[#a5c9e1] mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  type="email"
                  className="w-full rounded-xl border border-white/15 bg-[#0a1b28] px-3 py-2.5 text-white placeholder:text-[#7d96ad] focus:border-[#3d97ff] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#a5c9e1] mb-1">Password</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                  type="password"
                  className="w-full rounded-xl border border-white/15 bg-[#0a1b28] px-3 py-2.5 text-white placeholder:text-[#7d96ad] focus:border-[#3d97ff] outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#2cb8ff] via-[#6d3dff] to-[#b44cff] text-white font-semibold py-2.5 shadow-lg transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Login in' : 'Create account'}
              </button>
            </form>

            <div className="pt-4 text-center text-sm text-[#95b8de]">
              {mode === 'login' ? (
                <>
                  New to Let's Talk?{' '}
                  <button onClick={() => { setMode('register'); setError(''); }} className="text-cyan-300 hover:text-cyan-100 font-semibold">Create an account</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(''); }} className="text-cyan-300 hover:text-cyan-100 font-semibold">Login</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 justify-center">
          <div className="rounded-3xl border border-white/10 bg-[#112f43]/90 p-4">
            {error && <div className="mb-3 rounded-xl bg-red-500/20 border border-red-400/40 px-3 py-2 text-sm text-red-200">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-2">
              {mode === 'register' && (
                <>
                  <input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Full name" className="w-full rounded-xl border border-white/15 bg-[#0f2433] px-3 py-2.5 text-white placeholder:text-[#7f9fb6] focus:border-[#3d97ff] outline-none" required />
                  <input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" className="w-full rounded-xl border border-white/15 bg-[#0f2433] px-3 py-2.5 text-white placeholder:text-[#7f9fb6] focus:border-[#3d97ff] outline-none" required />
                </>
              )}
              <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" type="email" className="w-full rounded-xl border border-white/15 bg-[#0f2433] px-3 py-2.5 text-white placeholder:text-[#7f9fb6] focus:border-[#3d97ff] outline-none" required />
              <input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'} className="w-full rounded-xl border border-white/15 bg-[#0f2433] px-3 py-2.5 text-white placeholder:text-[#7f9fb6] focus:border-[#3d97ff] outline-none" required />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#2cb8ff] via-[#6d3dff] to-[#b44cff] py-2.5 text-white font-semibold disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Enter workspace' : 'Create account'}</button>
            </form>
            <div className="text-center mt-3 text-sm text-[#a9c8e7]">
              {mode === 'login' ? (
                <>New to Let's Talk? <button onClick={() => { setMode('register'); setError(''); }} className="text-cyan-300 font-semibold">Create an account</button></>
              ) : (
                <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="text-cyan-300 font-semibold">Login</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
          