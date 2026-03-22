import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '../components/Layout';
import { useThreadPanelState } from '../hooks/useThreadPanelState';
import { useAuth } from '../context/AuthContext';
import { useUserThreads } from '../hooks/useQueries';
import { Globe, MessageCircle, ArrowRight } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Threads() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { saveForExpand } = useThreadPanelState();

  const { data: threads = [], isLoading, error } = useUserThreads(user?.id);

  const handleThreadClick = (thread) => {
    if (!thread?._id) return;
    saveForExpand({
      threadId: thread._id,
      replyTo: null,
      parentMessage: thread,
    });
    setLocation(`/thread/${thread._id}?from=threads`);
  };

  // Filter once so the header count and list stay in sync
  const activeThreads = threads.filter(
    (t) => (t.replyCount || 0) > 0 || t.isTopicCard
  );

  const threadsIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );

  return (
    <Layout
      headerProps={{
        icon: threadsIcon,
        title: 'Your Threads',
        rightElement: <span className="text-xs text-gray-400">{activeThreads.length} threads</span>,
      }}
    >
      <div className="flex-1 flex flex-col min-h-0 w-full relative mb-5">
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-white font-bold mb-2">Join the conversation</h3>
              <p className="text-gray-400 text-sm mb-6">Sign in to see your active threads.</p>
              <button
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-purple-600 to-green-500 text-white px-6 py-2.5 rounded-full font-medium"
              >
                Sign In
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center text-white/70 py-10">Loading your threads...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-10">Error loading threads.</div>
          ) : activeThreads.length === 0 ? (
            <div className="bg-[#1e3d3d]/40 rounded-xl p-4 border border-white/10 text-center text-white">
              <div className="text-2xl mb-2">🧵</div>
              <div className="font-semibold mb-1">No threads yet</div>
              <div className="text-sm text-gray-300">Reply to any message to start a thread.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeThreads.map((thread) => {
                const isMiniRoom = thread.isTopicCard;
                const replyCount = thread.replyCount || 0;
                const isOwnThread = thread.author?._id === user?.id || thread.author?.toString() === user?.id;
                const authorName = thread.author?.displayName || thread.author?.username || 'Unknown';

                let threadLabel;
                if (isMiniRoom) {
                  threadLabel = <span className="font-medium text-purple-400">Mini Room</span>;
                } else if (isOwnThread) {
                  threadLabel = <span className="font-medium text-green-400">Your thread</span>;
                } else {
                  threadLabel = (
                    <>
                      <span className="font-medium text-purple-400">Thread with</span>
                      <span className="text-white font-medium">{authorName}</span>
                    </>
                  );
                }

                return (
                  <button
                    key={thread._id}
                    onClick={() => handleThreadClick(thread)}
                    className="w-full bg-[#1e3d3d]/60 rounded-xl p-4 border border-white/5 hover:border-white/15 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {thread.isGlobal
                          ? <Globe className="w-4 h-4 text-white" />
                          : <MessageCircle className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5 flex-wrap">
                          {threadLabel}
                          {replyCount > 0 && (
                            <span>• {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                          )}
                          {thread.createdAt && (
                            <span>• {formatTime(thread.createdAt)}</span>
                          )}
                        </div>
                        <div className="text-white text-sm leading-relaxed line-clamp-2">
                          {thread.content || 'No thread content'}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}