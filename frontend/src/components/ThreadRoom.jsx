import { useEffect, useRef, useState } from 'react';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import { formatDistanceToNow } from 'date-fns';

export default function ThreadRoom({
  parentMessage,
  messages,
  isLoading,
  stats,
  user,
  onSend,
  onOpenProfile,
  onMessageUpdate,
  onMessageDelete,
}) {
  const [replyTo, setReplyTo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const containerRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const clearUnread = () => {
    setUnreadCount(0);
    setFirstUnreadId(null);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    clearUnread();
    setIsAtBottom(true);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    setIsAtBottom(atBottom);
    if (atBottom) clearUnread();
  };

  const scrollToFirstUnread = () => {
    if (!firstUnreadId) {
      scrollToBottom();
      return;
    }

    const el = document.getElementById(`message-${firstUnreadId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearUnread();
    } else {
      scrollToBottom();
    }
  };

  const handleSend = async (content) => {
    if (!user) return;
    await onSend(content, replyTo?._id || parentMessage._id);
    setReplyTo(null);
    scrollToBottom();
  };

  useEffect(() => {
    if (messages.length === 0 || isAtBottom) return;

    const last = messages[messages.length - 1];
    if (!last?._id) return;

    setUnreadCount((p) => p + 1);
    setFirstUnreadId((p) => p || last._id);
  }, [messages.length, isAtBottom]);

  return (
    <div className="flex flex-col h-full bg-[#111f22]">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-[0.1em]">
              Mini Room
            </div>
            <div className="text-white font-semibold text-md leading-none">
              {parentMessage.content}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {stats.participantCount} participants · {stats.messageCount} messages
            </div>
          </div>
          <div className="text-right text-xs text-gray-300">
            {formatDistanceToNow(new Date(parentMessage.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/10 bg-[#0f2929] flex items-center gap-2">
        <button
          onClick={scrollToBottom}
          className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-300/30"
        >
          Bottom
        </button>
        {unreadCount > 0 && (
          <button
            onClick={scrollToFirstUnread}
            className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full border border-purple-300/30"
          >
            {unreadCount} new
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
      >
        {isLoading ? (
          <div className="text-center text-gray-300 py-8">Loading thread...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-300 py-8">No replies yet.</div>
        ) : (
          messages.map((msg) => (
            <MessageCard
              key={msg._id}
              message={msg}
              showThread={false}
              showReply={true}
              showParentPreview={true}
              showReplyCount={false}
              isOwnMessage={user && msg.author?._id === user.id}
              onReply={setReplyTo}
              onOpenProfile={onOpenProfile}
              onMessageUpdate={onMessageUpdate}
              onMessageDelete={onMessageDelete}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-white/10 bg-[#0f2929]">
        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onClear={() => setReplyTo(null)}
          roomLabel="#thread-room"
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
}