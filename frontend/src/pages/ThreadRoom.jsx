import { useState, useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { getBackDestination } from '../lib/navigation';

import Layout from '../components/Layout';
import MessageCard from '../components/MessageCard';
import MessageInput from '../components/MessageInput';
import Avatar from '../components/Avatar';
import ParticipantItem from '../components/ParticipantItem';
import UserProfileModal from '../components/UserProfileModal';
import ThreadPanel from '../components/ThreadPanel';

import { useIsMobile } from '../hooks/use-mobile';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { useScrollUnread } from '../hooks/useScrollUnread';
import { useThreadPanelState } from '../hooks/useThreadPanelState';

import {
  useThreadMessages,
  useMiniRoomMessages,
  useMiniRoomStats,
  useMiniRoomParticipants,
  useThreadParticipants,
  useSendThreadMessage,
  useMessage,
} from '../hooks/useQueries';

const FILTERS = ['All', 'Host only', 'Your post'];

function formatCount(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v?.toLocaleString() || '0';
}

function sameId(a, b) {
  return String(a || '') === String(b || '');
}

function resolveParentId(message) {
  return (
    message?.threadId ||
    message?.originalMessageId ||
    message?._id ||
    null
  );
}

function normalizeMessageList(data) {
  if (data?.pages) {
    return [...data.pages]
      .reverse()
      .flatMap((page) => (Array.isArray(page) ? page : page.messages || []));
  }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

export default function ThreadRoom() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, params] = useRoute('/thread/:id');
  const [, setLocation] = useLocation();

  const [participantPanelWidth, setParticipantPanelWidth] = useState(256);
  const isDraggingRef = useRef(false);

  const threadId = params?.id || null;
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const scrollHeightRef = useRef(0);

  // Check URL for origin and highlight
  const paramsObj = new URLSearchParams(window.location.search);
  const fromThreads = paramsObj.get('from') === 'threads';
  const urlMessageId = paramsObj.get('messageId');

  // Desktop panel state handoff
  const { restoreFromContext, clearPanelState, collapseToPanel } = useThreadPanelState();
  const [restoredState] = useState(() => restoreFromContext(threadId));

  useEffect(() => {
    if (restoredState) {
      clearPanelState();
    }
  }, [restoredState, clearPanelState]);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState(restoredState?.replyTo || null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  // Determine if this is a mini-room (topic card thread)
  const [parentMessageState] = useState(restoredState?.parentMessage || null);
  const { data: fetchedParentMessage } = useMessage(threadId, { enabled: !parentMessageState && !!threadId });
  const rootMessage = parentMessageState || fetchedParentMessage;

  const isInMiniRoom = Boolean(rootMessage?.isTopicCard || rootMessage?.originalMessageId);
  const miniRoomId = rootMessage?.isTopicCard
    ? rootMessage?._id
    : rootMessage?.originalMessageId || null;

  // Data fetching
  const threadQuery = useThreadMessages(threadId, { enabled: !!threadId && !isInMiniRoom });
  const miniRoomQuery = useMiniRoomMessages(miniRoomId, { enabled: !!miniRoomId });
  
  const {
    data: messagesData,
    fetchNextPage: fetchNextMiniPage,
    hasNextPage: hasNextMiniPage,
    isFetchingNextPage: isFetchingNextMiniPage,
  } = miniRoomQuery;

  const loading = isInMiniRoom ? miniRoomQuery.isLoading : threadQuery.isLoading;
  const activeData = isInMiniRoom ? messagesData : threadQuery.data;

  const { data: statsData } = useMiniRoomStats(miniRoomId, { enabled: !!miniRoomId });
  const stats = isInMiniRoom ? statsData || { participantCount: 0, messageCount: 0 } : null;

  const { data: threadParticipants = [] } = useThreadParticipants(threadId, {
    enabled: !isInMiniRoom && !!threadId,
  });
  const { data: miniRoomParticipants = [] } = useMiniRoomParticipants(miniRoomId, {
    enabled: !!miniRoomId,
  });
  const participants = isInMiniRoom ? miniRoomParticipants : threadParticipants;
  const sendMutation = useSendThreadMessage();
 
  const serverMessages = useMemo(() => normalizeMessageList(activeData), [activeData]);

  // Robust topicId resolution
  const topicId = useMemo(() => {
    // 1. Check root message (restored or fetched)
    const fromRoot = rootMessage?.topicId?._id || rootMessage?.topicId;
    if (fromRoot) return String(fromRoot);
    
    // 2. Fallback to first message in list if root is missing
    if (serverMessages.length > 0) {
      const fromList = serverMessages[0]?.topicId?._id || serverMessages[0]?.topicId;
      if (fromList) return String(fromList);
    }
    
    return null;
  }, [rootMessage, serverMessages]);

  const markIncomingRef = useRef(null);

  // Message state hook
  const { localMessages, handleSend, updateMessage, deleteMessage } = useMessages({
    serverMessages,
    sendMutation,
    buildPayload: (content, rt) => ({
      content,
      topicId: parentMessageState?.topicId,
      isGlobal: parentMessageState?.isGlobal,
      parentMessageId: rt?._id || parentMessageState?._id || threadId,
    }),
    socketConfig: {
      roomId: threadId,
      roomEvent: { join: 'join_thread', leave: 'leave_thread' },
      messageEvent: 'thread_message',
    },
    filterIncoming: (msg) => {
      return (
        sameId(msg._id, threadId) ||
        sameId(msg.threadId, threadId) ||
        sameId(msg.originalMessageId, threadId) ||
        sameId(msg.parentMessageId, threadId) ||
        sameId(msg.parentMessageId?._id, threadId)
      );
    },
    invalidateKeys: [
      ['threadMessages', threadId],
      ['threadParticipants', threadId],
      ...(miniRoomId ? [['miniRoomMessages', miniRoomId], ['miniRoomParticipants', miniRoomId]] : []),
    ],
    initialMessages: restoredState ? [] : undefined, // TanStack cache handles restoration
    onIncomingMessage: (msg) => {
      if (markIncomingRef.current) {
        markIncomingRef.current(msg._id);
      }
    }
  });

  // Scroll + unread hook
  const scrollUnread = useScrollUnread({
    messages: localMessages,
    startAtBottom: true,
    initialScrollTop: restoredState?.scrollTop,
    onScrollTop: () => {
      if (isInMiniRoom && hasNextMiniPage && !isFetchingNextMiniPage) {
        fetchNextMiniPage();
      }
    },
  });

  useEffect(() => {
    markIncomingRef.current = scrollUnread.markIncoming;
  }, [scrollUnread.markIncoming]);

  const {
    containerRef,
    bottomRef,
    isAtBottom,
    unreadCount,
    highlightedMessageId,
    handleScroll,
    scrollToBottom,
    scrollToFirstUnread,
    scrollToMessage,
    getCurrentScrollTop,
  } = scrollUnread;

  // Scroll restoration logic when fetching older messages using useLayoutEffect
  useLayoutEffect(() => {
    if (isFetchingNextMiniPage) {
      setIsFetchingOlder(true);
      scrollHeightRef.current = containerRef.current?.scrollHeight || 0;
    }
  }, [isFetchingNextMiniPage]);

  useLayoutEffect(() => {
    if (isFetchingOlder && !isFetchingNextMiniPage) {
      const el = containerRef.current;
      if (el && scrollHeightRef.current > 0) {
        const newScrollHeight = el.scrollHeight;
        const heightDiff = newScrollHeight - scrollHeightRef.current;
        if (heightDiff > 0) {
          el.scrollTop = el.scrollTop + heightDiff;
          // Successfully restored, now we can clear the flags
          setIsFetchingOlder(false);
          scrollHeightRef.current = 0;
        }
      }
    }
  }, [localMessages, isFetchingNextMiniPage, isFetchingOlder]);

  // Handle URL deep-link highlighting
  useEffect(() => {
    if (urlMessageId && localMessages.length > 0) {
      const exists = localMessages.some(m => String(m._id) === String(urlMessageId));
      if (exists) {
        const timer = setTimeout(() => {
          scrollToMessage(urlMessageId);
          // Clean up URL without reload
          const newUrl = window.location.pathname + (fromThreads ? '?from=threads' : '');
          window.history.replaceState({}, '', newUrl);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [urlMessageId, localMessages.length, scrollToMessage, fromThreads]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    const filtered = localMessages.filter((m) => {
      if (filter === 'Host only') return m.author?.isAdmin;
      if (filter === 'Your post') return user && (m.author?._id === user.id || m.author?.id === user.id);
      return true;
    });
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((m) => m.content?.toLowerCase().includes(q));
  }, [localMessages, filter, search, user]);

  const handleSendWithReply = async (content) => {
    await handleSend(content, replyTo);
    setReplyTo(null);
  };

  const handleCollapseToPanel = () => {
    collapseToPanel({
      threadId,
      replyTo,
      parentMessage: rootMessage,
      scrollTop: getCurrentScrollTop(),
      topicId: rootMessage?.topicId,
    });
  };

  const threadTitle = isInMiniRoom ? 'Mini Room' : 'Thread';
  const roomLabel = isInMiniRoom ? '#mini-room' : '#thread';

  // headerProps
  const headerProps = {
    icon: <MessageCircle size={20} />,
    title: threadTitle,
    subtitle: (
      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        live
      </span>
    ),
    showBack: true,
    onBack: () => {
      console.log("[ThreadRoom] Back button clicked.");
      console.log("[ThreadRoom] window.history.length:", window.history.length);
      console.log("[ThreadRoom] fromThreads:", fromThreads);
      console.log("[ThreadRoom] isMobile:", isMobile);
      console.log("[ThreadRoom] restoredState:", restoredState);

      const isGlobal = rootMessage?.isGlobal;
      const defaultDest = isGlobal ? '/global' : (topicId ? `/topic/${topicId}` : '/');
      const dest = getBackDestination(fromThreads ? '/threads' : defaultDest);
      
      if (!isMobile && restoredState) {
        console.log("[ThreadRoom] Collapsing to panel");
        handleCollapseToPanel();
      } else {
        console.log("[ThreadRoom] Navigating back to:", dest);
        setLocation(dest);
      }
    },
    rightElement: !isMobile && restoredState ? (
      // Desktop collapse button
      <button
        onClick={handleCollapseToPanel}
        className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
        title="Collapse to panel"
      >
        Collapse
      </button>
    ) : null,
  };

  if (loading && localMessages.length === 0) {
    return (
      <Layout hideMobileNav headerProps={{ icon: <MessageCircle size={20} />, title: 'Thread' }}>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-base font-medium">Loading thread...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideMobileNav headerProps={headerProps}>
      <div className="flex h-full max-h-full overflow-hidden">
        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-[400px] relative">

          {/* Root message card (replaces topic card) */}
          {rootMessage && (
            <div className="bg-[hsl(var(--topic-open))]/95 px-4 py-4 border-b border-[hsla(0,0%,100%,0.08)] flex-shrink-0">
              <div className="flex gap-3">
                <Avatar user={rootMessage.author} size={32} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-1">
                    {rootMessage.author?.displayName || rootMessage.author?.username}
                    {isInMiniRoom && stats && (
                      <span className="ml-2 text-gray-500">
                        · 👥 {formatCount(stats.participantCount)} · 💬 {formatCount(stats.messageCount)}
                      </span>
                    )}
                  </p>
                  <p className="text-white text-sm leading-relaxed">{rootMessage.content}</p>
                </div>
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 flex-shrink-0 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
            <div className="ml-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="bg-white/10 text-white text-xs px-3 py-1 rounded-full outline-none placeholder:text-gray-300 focus:bg-white/15 transition w-32 focus:w-44"
              />
            </div>
          </div>

          {/* Message list */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 relative"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {isFetchingNextMiniPage && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isInMiniRoom && !hasNextMiniPage && localMessages.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-xs italic">
                Beginning of discussion
              </div>
            )}

            {unreadCount > 0 && (
              <button
                onClick={scrollToFirstUnread}
                className="sticky top-2 left-0 right-0 mx-auto w-fit bg-purple-500 hover:bg-purple-400 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10 transition-all hover:scale-105"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
              </button>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-10">Loading messages…</div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-10 text-sm">
                {search.trim() ? 'No messages match your search.' : 'Be the first to reply!'}
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <MessageCard
                  key={msg._id}
                  message={msg}
                  isOwnMessage={user && (msg.author?._id === user.id || msg.author?.id === user.id)}
                  isPending={msg.isPending}
                  showThread={false}
                  showReply={true}
                  showParentPreview={true}
                  showReplyCount={false}
                  threadRootId={threadId}
                  onReply={setReplyTo}
                  onOpenProfile={(author) => {
                    const id = author?._id || author?.id;
                    if (id) setSelectedProfileUserId(id);
                  }}
                  onMessageUpdate={updateMessage}
                  onMessageDelete={deleteMessage}
                  onScrollToMessage={scrollToMessage}
                  isHighlighted={String(msg._id) === String(highlightedMessageId)}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 bg-purple-500 hover:bg-purple-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ width: 36, height: 36 }}
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}

          {/* Composer */}
          <div className="flex-shrink-0 bg-[hsl(var(--sidebar))] border-t border-white/5">
            {user ? (
              <div className="px-4 py-3 bg-[hsl(var(--topic-open))]/95">
                <MessageInput
                  onSend={handleSendWithReply}
                  onFocus={isMobile ? scrollToBottom : undefined}
                  replyTo={replyTo}
                  onClear={() => setReplyTo(null)}
                  roomLabel={roomLabel}
                  placeholder="Reply in thread…"
                  autoFocus
                />
              </div>
            ) : (
              <div className="bg-[#0f2929]/95 border-t border-white/10 px-4 py-3 text-center text-sm text-gray-400">
                <a href="/auth" className="text-purple-400">Sign in</a> to reply.
              </div>
            )}
          </div>
        </div>

        {/* Right participant panel — desktop only */}
        <div
          className={`hidden lg:flex w-1 cursor-col-resize hover:bg-white/20 active:bg-purple-500 transition-colors z-10 flex-shrink-0`}
          onMouseDown={(e) => {
            e.preventDefault();
            isDraggingRef.current = true;
            const startX = e.pageX;
            const startWidth = participantPanelWidth;
            
            const onMouseMove = (moveEvent) => {
              if (!isDraggingRef.current) return;
              const deltaX = startX - moveEvent.pageX;
              const newWidth = Math.max(200, Math.min(startWidth + deltaX, window.innerWidth - 450));
              setParticipantPanelWidth(newWidth);
            };
            
            const onMouseUp = () => {
              isDraggingRef.current = false;
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        />
        <div 
          className="hidden lg:flex flex-col bg-[hsl(var(--sidebar))] border-l border-white/5 flex-shrink-0"
          style={{ width: `${participantPanelWidth}px` }}
        >
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Active Participants</h3>
            <p className="text-xs text-gray-400">{participants.length} people in this thread</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {participants.slice(0, 8).map((p) => (
              <ParticipantItem
                key={p._id || p.id}
                participant={p}
                onOpenProfile={(participant) => {
                  const id = participant?._id || participant?.id;
                  if (id) setSelectedProfileUserId(id);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </Layout>
  );
}
