import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Maximize2, Send, MessageCircle, ArrowDown } from 'lucide-react';
import Avatar from './Avatar';

import { useAuth } from '../context/AuthContext';
import { useOverlay } from './Layout';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';

import { useMessages } from '../hooks/useMessages';
import { useScrollUnread } from '../hooks/useScrollUnread';
import { useThreadPanelState } from '../hooks/useThreadPanelState';
import { useLocation } from 'wouter';

import {
  useThreadMessages,
  useMiniRoomMessages,
  useMiniRoomStats,
  useSendThreadMessage,
} from '../hooks/useQueries';

/**
 * ThreadPanel — desktop-only compact overlay rendered inside TopicRoom content area.
 * Mobile never renders this; mobile navigates directly to ThreadRoom.
 *
 * Props:
 *   parentMessage  — the root message whose thread to show
 *   onClose        — called when X is clicked
 *   roomLabel      — e.g. '#topic-room'
 *   onOpenProfile  — fn(author)
 */
export default function ThreadPanel({ parentMessage, onClose, roomLabel, onOpenProfile, highlightedMessageId }) {
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

  const { user } = useAuth();
  const { isOverlayEnabled } = useOverlay();
  const [, setLocation] = useLocation();

  const { panelState, clearPanelState, saveForExpand } = useThreadPanelState();

  const isInMiniRoom = Boolean(parentMessage?.isTopicCard || parentMessage?.originalMessageId);
  const miniRoomId = parentMessage?.isTopicCard
    ? parentMessage?._id
    : parentMessage?.originalMessageId || null;

  const threadId =
    parentMessage?.threadId ||
    parentMessage?.originalMessageId ||
    parentMessage?._id ||
    null;

  const isMatchingContext = useMemo(() => 
    panelState.threadId === threadId, 
    [panelState.threadId, threadId]
  );

  const [replyTo, setReplyTo] = useState(isMatchingContext ? panelState.replyTo : null);

  useEffect(() => {
    if (isMatchingContext) {
      if (panelState.scrollTop > 0 && containerRef.current) {
        containerRef.current.scrollTop = panelState.scrollTop;
      }
      clearPanelState();
    }
  }, [isMatchingContext, clearPanelState]); // Runs once on mount if matching

  // Data
  const threadQuery = useThreadMessages(threadId, { enabled: !!threadId && !isInMiniRoom });
  const miniRoomQuery = useMiniRoomMessages(miniRoomId, { enabled: !!miniRoomId });

  const {
    data: miniRoomData,
    fetchNextPage: fetchNextMiniPage,
    hasNextPage: hasNextMiniPage,
    isFetchingNextPage: isFetchingNextMiniPage,
  } = miniRoomQuery;

  const data = isInMiniRoom ? miniRoomData : threadQuery.data;
  const loading = isInMiniRoom ? miniRoomQuery.isLoading : threadQuery.isLoading;

  const { data: statsData } = useMiniRoomStats(miniRoomId, { enabled: !!miniRoomId });
  const stats = statsData || { participantCount: 0, messageCount: 0 };

  const sendMutation = useSendThreadMessage();

  const serverMessages = useMemo(() => normalizeMessageList(data), [data]);

  function sameId(a, b) { return String(a || '') === String(b || ''); }

  const markIncomingRef = useRef(null);

  const onIncomingMessage = useCallback((msg) => {
    if (markIncomingRef.current) {
      markIncomingRef.current(msg._id);
    }
  }, []);

  const { localMessages, handleSend, updateMessage, deleteMessage } = useMessages({
    serverMessages,
    sendMutation,
    buildPayload: (content, rt) => ({
      content,
      topicId: parentMessage?.topicId,
      isGlobal: parentMessage?.isGlobal,
      parentMessageId: rt?._id || parentMessage?._id || threadId,
    }),
    socketConfig: {
      roomId: threadId,
      roomEvent: { join: 'join_thread', leave: 'leave_thread' },
      messageEvent: 'thread_message',
    },
    filterIncoming: (msg) => (
      sameId(msg._id, threadId) ||
      sameId(msg.threadId, threadId) ||
      sameId(msg.originalMessageId, threadId) ||
      sameId(msg.parentMessageId, threadId) ||
      sameId(msg.parentMessageId?._id, threadId)
    ),
    invalidateKeys: [
      ['threadMessages', threadId],
      ...(miniRoomId ? [['miniRoomMessages', miniRoomId]] : []),
    ],
    onIncomingMessage
  });

  const scrollUnread = useScrollUnread({
    messages: localMessages,
    startAtBottom: true,
    threshold: 30, // Smaller threshold for dense panel
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
    highlightedMessageId: activeHighlightedId,
    handleScroll,
    scrollToBottom,
    scrollToFirstUnread,
    scrollToMessage,
    getCurrentScrollTop,
  } = scrollUnread;

  const handleSendWithReply = async (content) => {
    await handleSend(content, replyTo);
    setReplyTo(null);
  };

  // Handle URL deep-link highlighting
  useEffect(() => {
    if (highlightedMessageId && localMessages.length > 0) {
      const exists = localMessages.some(m => String(m._id) === String(highlightedMessageId));
      if (exists) {
        // Shorter delay for panel since it's already visible
        const timer = setTimeout(() => {
          scrollToMessage(highlightedMessageId);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedMessageId, localMessages.length, scrollToMessage]);

  const handleExpand = () => {
    console.log("[ThreadPanel] handleExpand clicked.");
    console.log("[ThreadPanel] window.history.length:", window.history.length);
    console.log("[ThreadPanel] Saving state and navigating to -> /thread/", threadId);
    
    // Save minimal state to context then navigate to full ThreadRoom
    saveForExpand({
      threadId,
      replyTo,
      parentMessage,
      scrollTop: getCurrentScrollTop(),
    });
    setLocation(`/thread/${threadId}`);
  };

  const authorName =
    parentMessage?.author?.displayName ||
    parentMessage?.author?.username ||
    'Unknown';

  const threadTitle = isInMiniRoom ? 'Mini Room' : `Thread with ${authorName}`;

  return (
    <div
      className={`relative flex flex-col h-full ${isOverlayEnabled ? 'bg-[#111f22]' : 'bg-[#254E5B]'}`}
    >
      {/* Internal header — self-contained, never interacts with shell header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsla(0,0%,100%,0.08)] bg-[hsl(var(--sidebar))] flex-shrink-0">
        <div>
          <h3 className="font-bold text-white text-sm">{threadTitle}</h3>
          {isInMiniRoom && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span>👥 {stats.participantCount}</span>
              <span>💬 {stats.messageCount}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors"
            aria-label="Expand to full page"
            title="Open full thread page"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg"
            aria-label="Close thread panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Parent message preview */}
      <div className="bg-[hsl(var(--sidebar))]/40 mx-3 mt-3 rounded-xl p-3 border border-dashed border-white/15 flex-shrink-0 flex items-center gap-3">
        <Avatar user={parentMessage?.author} size={24} className="flex-shrink-0" />
        <p className="text-white text-sm leading-relaxed line-clamp-1 flex-1 min-w-0">
          {parentMessage?.content}
        </p>
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
          <div className="text-center text-gray-400 py-10">Loading…</div>
        ) : localMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm">
            Be the first to reply!
          </div>
        ) : (
          localMessages.map((msg) => (
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
              onOpenProfile={onOpenProfile}
              onMessageUpdate={updateMessage}
              onMessageDelete={deleteMessage}
              onScrollToMessage={scrollToMessage}
              isHighlighted={String(msg._id) === String(activeHighlightedId)}
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
              replyTo={replyTo}
              onClear={() => setReplyTo(null)}
              roomLabel={roomLabel || '#thread'}
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
  );
}
