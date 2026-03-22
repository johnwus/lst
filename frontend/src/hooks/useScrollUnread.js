import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useScrollUnread — owns scroll position and unread tracking.
 *
 * @param {Object} options
 * @param {Array} options.messages - localMessages from useMessages (drives auto-scroll)
 * @param {boolean} [options.startAtBottom=true] - whether to start at bottom
 * @param {number} [options.threshold=100] - px from bottom to consider "at bottom"
 * @param {number} [options.initialScrollTop] - restored scroll offset (from ThreadContext)
 */
export function useScrollUnread({
  messages,
  startAtBottom = true,
  threshold = 100,
  initialScrollTop,
  onScrollTop,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isAtBottomRef = useRef(startAtBottom);
  const isAutoScrolling = useRef(false);
  const restoredRef = useRef(false);

  const [isAtBottom, setIsAtBottom] = useState(startAtBottom);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // Restore scroll position from context once messages have rendered
  useEffect(() => {
    if (restoredRef.current) return;
    if (!initialScrollTop || !containerRef.current || messages.length === 0) return;

    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = initialScrollTop;
        restoredRef.current = true;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [messages.length, initialScrollTop]);

  // Auto-scroll to bottom when new messages arrive and user is already at bottom
  useEffect(() => {
    if (!isAtBottomRef.current || !messages.length) return;
    isAutoScrolling.current = true;
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => { isAutoScrolling.current = false; }, 500);
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (scrollTop < 50 && onScrollTop) {
      onScrollTop();
    }

    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    if (atBottom !== isAtBottomRef.current) {
      console.log('[useScrollUnread] isAtBottom changed from', isAtBottomRef.current, 'to', atBottom, '(diff:', scrollHeight - scrollTop - clientHeight, 'threshold:', threshold, ')');
    }
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom && !isAutoScrolling.current) {
      if (unreadCount > 0) console.log('[useScrollUnread] Clearing unreadCount at bottom');
      setUnreadCount(0);
      setFirstUnreadId(null);
    }
  }, [threshold, onScrollTop]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
    setFirstUnreadId(null);
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, []);

  const scrollToFirstUnread = useCallback(() => {
    console.log('[useScrollUnread] scrollToFirstUnread called. firstUnreadId:', firstUnreadId);
    if (firstUnreadId) {
      const el = document.getElementById(`message-${firstUnreadId}`);
      if (el) {
        console.log('[useScrollUnread] Element found. Scrolling to center...');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(firstUnreadId);
        setTimeout(() => setHighlightedMessageId(null), 1500); // 5s highlight
        setUnreadCount(0);
        setFirstUnreadId(null);
        isAtBottomRef.current = false;
        setIsAtBottom(false);
        return;
      } else {
        console.warn('[useScrollUnread] Element NOT found for firstUnreadId:', `message-${firstUnreadId}`);
      }
    }
    scrollToBottom();
  }, [firstUnreadId, scrollToBottom]);

  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 1800);
    }
  }, []);

  const markIncoming = useCallback((msgId) => {
    console.log('[useScrollUnread] markIncoming called with:', msgId, 'isAtBottomRef.current:', isAtBottomRef.current);
    if (!isAtBottomRef.current) {
      setUnreadCount((n) => {
        console.log('[useScrollUnread] Incrementing unreadCount from', n, 'to', n + 1);
        return n + 1;
      });
      if (msgId) {
        setFirstUnreadId((prev) => {
          if (!prev) console.log('[useScrollUnread] Setting firstUnreadId to:', msgId);
          return prev || msgId;
        });
      }
    }
  }, []);

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    unreadCount,
    firstUnreadId,
    setFirstUnreadId,
    highlightedMessageId,
    handleScroll,
    scrollToBottom,
    scrollToFirstUnread,
    scrollToMessage,
    markIncoming,
    getCurrentScrollTop: () => containerRef.current?.scrollTop ?? 0,
  };
}
