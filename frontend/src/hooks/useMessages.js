import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { initNotificationSound } from '../lib/sounds';

/**
 * Merges fresh server messages with any still-pending optimistic entries.
 */
function mergeWithPending(prev, serverMessages) {
  if (!Array.isArray(serverMessages)) return prev;
  if (prev.length === 0) return serverMessages;

  const pending = prev.filter((m) => m?.isPending);
  const serverById = new Map(serverMessages.map((m) => [m._id, m]));

  const merged = serverMessages.map((sm) => {
    const local = prev.find((m) => m._id === sm._id);
    return local ? { ...sm, isPending: Boolean(local.isPending) } : sm;
  });

  const unresolvedPending = pending.filter((pm) => !serverById.has(pm._id));
  return [...merged, ...unresolvedPending];
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

/**
 * useMessages — message transport and local state.
 *
 * @param {Object} options
 * @param {Array} options.serverMessages - raw data from TanStack query
 * @param {Function} options.sendMutation - TanStack mutation for sending
 * @param {Function} options.buildPayload - fn(content, replyTo) → API payload object
 * @param {Object} options.socketConfig - { roomEvent, messageEvent, roomId }
 * @param {Function} [options.filterIncoming] - fn(msg) → bool, guards socket messages
 * @param {Array} [options.invalidateKeys] - query keys to invalidate after send/socket events
 * @param {Array} [options.initialMessages] - optional seed (from ThreadContext restore)
 */
export function useMessages({
  serverMessages,
  sendMutation,
  buildPayload,
  socketConfig,
  filterIncoming,
  invalidateKeys = [],
  initialMessages,
  onIncomingMessage,
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Pre-initialize audio for this hook
    initNotificationSound();
  }, []);

  const [localMessages, setLocalMessages] = useState(() =>
    initialMessages?.length ? initialMessages : normalizeList(serverMessages)
  );

  // Sync server data into local state (preserves pending optimistic entries)
  useLayoutEffect(() => {
    const fresh = normalizeList(serverMessages);
    if (fresh.length === 0) return;
    setLocalMessages((prev) => mergeWithPending(prev, fresh));
  }, [serverMessages]);

  // Keep refs of dynamic callbacks to avoid socket re-subscriptions
  const onIncomingRef = useRef(onIncomingMessage);
  const filterIncomingRef = useRef(filterIncoming);
  const invalidateKeysRef = useRef(invalidateKeys);

  useEffect(() => { onIncomingRef.current = onIncomingMessage; }, [onIncomingMessage]);
  useEffect(() => { filterIncomingRef.current = filterIncoming; }, [filterIncoming]);
  useEffect(() => { invalidateKeysRef.current = invalidateKeys; }, [invalidateKeys]);

  // Track IDs seen via socket to handle race conditions with query invalidation
  const socketSeenIdsRef = useRef(new Set());

  // Socket listeners
  useEffect(() => {
    if (!socketConfig?.roomId) return;
    const socket = getSocket();
    if (!socket) return;

    let mounted = true;

    const handleIncoming = (msg) => {
      if (!mounted || !msg?._id) return;
      
      const isOwn = msg.author?._id === user?.id || msg.author?.id === user?.id;
      if (isOwn) return;
      
      if (filterIncomingRef.current && !filterIncomingRef.current(msg)) {
        console.log('[useMessages] Message filtered out:', msg._id, 'threadId:', msg.threadId);
        return;
      }

      // De-duplicate socket events within a short window
      if (socketSeenIdsRef.current.has(msg._id)) return;
      socketSeenIdsRef.current.add(msg._id);
      setTimeout(() => socketSeenIdsRef.current.delete(msg._id), 10000); // 10s cleanup

      // Trigger unread logic even if message exists in state (race condition with Query)
      if (onIncomingRef.current) {
        onIncomingRef.current(msg);
      }

      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      invalidateKeysRef.current.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    };

    const handleReactionUpdate = (data) => {
      if (!data?.messageId) return;
      setLocalMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, reactions: data.reactions || [] } : m
        )
      );
    };

    const handleEdited = ({ message }) => {
      if (!message?._id) return;
      setLocalMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
      invalidateKeysRef.current.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    };

    const handleDeleted = ({ messageId }) => {
      if (!messageId) return;
      setLocalMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: '[deleted]' } : m
        )
      );
      invalidateKeysRef.current.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    };

    const handleReplyCount = ({ messageId, replyCount }) => {
      if (!messageId) return;
      console.log(`[useMessages] reply_count_update: ${messageId} -> ${replyCount}`);
      setLocalMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, replyCount } : m))
      );
    };

    const { roomEvent, messageEvent, roomId } = socketConfig;

    const joinRoom = () => {
      if (mounted && socket.connected && roomId) {
        console.log('[useMessages] Emitting join event:', roomEvent?.join || 'join_topic', 'room:', roomId);
        socket.emit(roomEvent?.join || 'join_topic', roomId);
      }
    };

    if (socket.connected) joinRoom();
    else socket.on('connect', joinRoom);

    socket.on(messageEvent, handleIncoming);
    socket.on('message', handleIncoming); // fallback
    socket.on('new_message', handleIncoming); // fallback
    socket.on('thread_message', handleIncoming); // fallback
    socket.on('reaction_update', handleReactionUpdate);
    socket.on('message_reaction', handleReactionUpdate);
    socket.on('message_edited', handleEdited);
    socket.on('message_deleted', handleDeleted);
    socket.on('reply_count_update', handleReplyCount);

    return () => {
      mounted = false;
      socket.off('connect', joinRoom);
      socket.off(messageEvent, handleIncoming);
      socket.off('message', handleIncoming);
      socket.off('new_message', handleIncoming);
      socket.off('thread_message', handleIncoming);
      socket.off('reaction_update', handleReactionUpdate);
      socket.off('message_reaction', handleReactionUpdate);
      socket.off('message_edited', handleEdited);
      socket.off('message_deleted', handleDeleted);
      socket.off('reply_count_update', handleReplyCount);
      if (socket.connected && roomId) socket.emit(roomEvent.leave, roomId);
    };
  }, [socketConfig?.roomId, socketConfig?.roomEvent?.join, socketConfig?.roomEvent?.leave,
      socketConfig?.messageEvent, user?.id, queryClient]); // Removed callbacks from deps

  const handleSend = useCallback(
    async (content, replyTo = null) => {
      if (!user || !sendMutation) return;

      const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const payload = buildPayload(content, replyTo);

      const optimistic = {
        _id: tempId,
        content,
        author: {
          _id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarInitials: user.avatarInitials,
          avatarColor: user.avatarColor,
        },
        createdAt: new Date().toISOString(),
        isPending: true,
        ...payload,
      };

      setLocalMessages((prev) => [...prev, optimistic]);

      try {
        const confirmed = await sendMutation.mutateAsync(payload);
        setLocalMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...confirmed, isPending: false } : m))
        );
        invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      } catch {
        setLocalMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    },
    [user, sendMutation, buildPayload, queryClient, invalidateKeys]
  );

  const updateMessage = useCallback((updated) => {
    setLocalMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setLocalMessages((prev) =>
      prev.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: '[deleted]' } : m
      )
    );
  }, []);

  return { localMessages, handleSend, updateMessage, deleteMessage };
}
