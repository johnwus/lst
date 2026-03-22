import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, X, ArrowDown, Search, MessageCircle } from "lucide-react";
import { getBackDestination } from "../lib/navigation";

import Layout from "../components/Layout";
import MessageCard from "../components/MessageCard";
import MessageInput from "../components/MessageInput";
import ThreadPanel from "../components/ThreadPanel";
import ParticipantItem from "../components/ParticipantItem";
import UserProfileModal from "../components/UserProfileModal";
import { ShareModalContent } from "../components/ShareScreen";
import { AnimatePresence } from "framer-motion";

import { useIsMobile } from "../hooks/use-mobile";
import { useAuth } from '../context/AuthContext';
import { useThreadPanelState } from "../hooks/useThreadPanelState";
import { getSocket } from "../lib/socket";
import {
  useTopic,
  useTopicMessages,
  useTopicParticipants,
  useJoinTopic,
  useSendMessage,
  useSearchMessages,
} from "../hooks/useQueries";

const FILTERS = ["All", "Host only", "Your post"];

// Message skeleton for loading state
function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3 bg-white/10 rounded-full w-20" />
          <div className="h-2 bg-white/5 rounded-full w-12" />
        </div>
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
      </div>
    </div>
  );
}

// Participant skeleton
function ParticipantSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/10 rounded-full w-24" />
        <div className="h-2 bg-white/5 rounded-full w-16" />
      </div>
    </div>
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

function formatCount(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value?.toLocaleString() || "0";
}

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      if (!expiresAt) {
        setTimeLeft("");
        return;
      }

      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}:${s.toString().padStart(2, "0")} left`,
      );
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

function getAuthorId(message) {
  return message?.author?._id || message?.author?.id || null;
}

function mergeServerMessagesWithPending(previous, serverMessages) {
  const pending = previous.filter((m) => m?.isPending);
  const serverById = new Map(serverMessages.map((m) => [m._id, m]));

  const mergedServer = serverMessages.map((serverMsg) => {
    const localMatch = previous.find((m) => m._id === serverMsg._id);
    return localMatch
      ? {
          ...serverMsg,
          isPending: Boolean(localMatch.isPending),
        }
      : serverMsg;
  });

  const unresolvedPending = pending.filter((pm) => !serverById.has(pm._id));
  return [...mergedServer, ...unresolvedPending];
}

export default function TopicRoom({ topicId: topicIdProp, isLiveMode = false }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/topic/:id");
  const [, setLocation] = useLocation();

  const [threadPanelWidth, setThreadPanelWidth] = useState(320);
  const [participantPanelWidth, setParticipantPanelWidth] = useState(256);
  const isDraggingRef = useRef(false);

  const topicId = topicIdProp || params?.id;
  const isFromTopicCard = Boolean(topicIdProp);

  // fromExplore: set when navigated from /explore via ?from=explore
  const fromExplore =
    !isLiveMode && new URLSearchParams(window.location.search).get('from') === 'explore';

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [thread, setThread] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(!isFromTopicCard);
  const [localMessages, setLocalMessages] = useState([]);
  const [urlHighlightedMessageId, setUrlHighlightedMessageId] = useState(null);
  const [threadHighlightedMessageId, setThreadHighlightedMessageId] = useState(null);

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const isAtBottomRef = useRef(!isFromTopicCard);
  const joinedRef = useRef(false);
  const initialThreadIdRef = useRef(null);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const scrollHeightRef = useRef(0);

  // Keep refs of dynamic values for the socket effect
  const handleIncomingRef = useRef(null);
  const handleReactionRef = useRef(null);
  const handleEditRef = useRef(null);
  const handleDeleteRef = useRef(null);
  const handleReplyRef = useRef(null);
  const socketSeenIdsRef = useRef(new Set());

  const { data: topicData, isLoading: topicLoading } = useTopic(topicId);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTopicMessages(topicId);
  const { data: searchResultsData, isLoading: searchLoading } = useSearchMessages(
    topicId,
    search,
  );
  const { data: participants = [], isLoading: participantsLoading } = useTopicParticipants(topicId);

  const joinTopicMutation = useJoinTopic();
  const sendMessageMutation = useSendMessage();

  const { panelState, clearPanelState, saveForExpand } = useThreadPanelState();

  const topic = topicData || null;
  const loading = topicLoading || messagesLoading;
  const baseMessages = useMemo(() => normalizeMessageList(messagesData), [messagesData]);
  const searchResults = useMemo(
    () => normalizeMessageList(searchResultsData),
    [searchResultsData],
  );

  useEffect(() => {
    if (!isMobile) {
      messageInputRef.current?.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    if (topicId && user && !joinedRef.current) {
      joinedRef.current = true;
      joinTopicMutation.mutate(topicId);
    }
  }, [topicId, user, joinTopicMutation]);

  useLayoutEffect(() => {
    setLocalMessages((prev) => {
      if (!Array.isArray(baseMessages)) return prev;
      if (prev.length === 0) return baseMessages;
      return mergeServerMessagesWithPending(prev, baseMessages);
    });
  }, [baseMessages]);

  // Stable Socket connection effect
  useEffect(() => {
    if (!topicId) return;
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg) => handleIncomingRef.current?.(msg);
    const onReaction = (data) => handleReactionRef.current?.(data);
    const onEdit = (data) => handleEditRef.current?.(data);
    const onDelete = (data) => handleDeleteRef.current?.(data);
    const onReply = (data) => handleReplyRef.current?.(data);

    socket.emit("join_topic", topicId);
    socket.on("message", onMessage);
    socket.on("new_message", onMessage);
    socket.on("reaction_update", onReaction);
    socket.on("message_reaction", onReaction);
    socket.on("message_edited", onEdit);
    socket.on("message_deleted", onDelete);
    socket.on("reply_count_update", onReply);

    return () => {
      socket.off("message", onMessage);
      socket.off("new_message", onMessage);
      socket.off("reaction_update", onReaction);
      socket.off("message_reaction", onReaction);
      socket.off("message_edited", onEdit);
      socket.off("message_deleted", onDelete);
      socket.off("reply_count_update", onReply);
      socket.emit("leave_topic", topicId);
    };
  }, [topicId]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  useEffect(() => {
    if (isFromTopicCard) {
      isAtBottomRef.current = false;
      setIsAtBottom(false);
    }
  }, [isFromTopicCard]);

  useEffect(() => {
    if (!topicId || localMessages.length === 0) return;

    const paramsObj = new URLSearchParams(window.location.search);
    const threadId = paramsObj.get("thread");
    const messageId = paramsObj.get("messageId");
    
    // 1. Handle Mobile Redirect
    if (isMobile && threadId) {
      console.log("[TopicRoom] Mobile detected, redirecting to ThreadRoom for thread:", threadId);
      const target = `/thread/${threadId}${messageId ? `?messageId=${messageId}` : ""}`;
      setLocation(target);
      return;
    }

    // 2. Handle Desktop Thread Opening
    if (threadId) {
      if (initialThreadIdRef.current === threadId) return;
      initialThreadIdRef.current = threadId;

      const threadMessage = localMessages.find(
        (m) =>
          m._id === threadId ||
          m.parentMessageId?._id === threadId ||
          m.parentMessageId === threadId ||
          m.originalMessageId === threadId,
      );

      if (threadMessage) {
        setThread(threadMessage);
        setThreadHighlightedMessageId(messageId || null);
        
        // If we're linking to the root itself, scroll main list too
        if (!messageId || messageId === threadId) {
          setHighlightedMessageId(threadId);
          setTimeout(() => {
            const element = document.getElementById(`message-${threadId}`);
            if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setHighlightedMessageId(null), 1800);
          }, 100);
        }
      }
    } 
    // 3. Handle Top-level Message Highlighting (no thread)
    else if (messageId) {
      if (urlHighlightedMessageId === messageId) return;
      setUrlHighlightedMessageId(messageId);
      
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setTimeout(() => {
          setHighlightedMessageId(null);
          setUrlHighlightedMessageId(null);
        }, 3000);
      }, 100);
    }

    if (threadId || messageId) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    
    if (!paramsObj.get("thread") && !paramsObj.get("messageId") && panelState.threadId) {
      // Restore logic for non-URL arrivals
      const threadToRestore = localMessages.find(m => m._id === panelState.threadId);
      if (threadToRestore) {
        setThread(threadToRestore);
        clearPanelState();
      }
    }
  }, [topicId, localMessages, isMobile]);

  // Scroll restoration logic when fetching older messages using useLayoutEffect
  useLayoutEffect(() => {
    if (isFetchingNextPage) {
      setIsFetchingOlder(true);
      scrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    }
  }, [isFetchingNextPage]);

  useLayoutEffect(() => {
    if (isFetchingOlder && !isFetchingNextPage) {
      const container = messagesContainerRef.current;
      if (container && scrollHeightRef.current > 0) {
        const newScrollHeight = container.scrollHeight;
        const heightDiff = newScrollHeight - scrollHeightRef.current;
        if (heightDiff > 0) {
          container.scrollTop = container.scrollTop + heightDiff;
          // Successfully restored, now we can clear the flags
          setIsFetchingOlder(false);
          scrollHeightRef.current = 0;
        }
      }
    }
  }, [localMessages, isFetchingNextPage, isFetchingOlder]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Fetch older messages when reaching top
    if (scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }

    const atBottom = scrollHeight - scrollTop - clientHeight < 100;

    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);

    if (atBottom) {
      setUnreadCount(0);
      setFirstUnreadId(null);
    }
  };

  const scrollToFirstUnread = () => {
    console.log("[TopicRoom] scrollToFirstUnread clicked. firstUnreadId:", firstUnreadId);
    if (firstUnreadId) {
      const element = document.getElementById(`message-${firstUnreadId}`);
      if (element) {
        console.log("[TopicRoom] Element found for firstUnreadId. Scrolling...");
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMessageId(firstUnreadId);
        setTimeout(() => setHighlightedMessageId(null), 5000); // 5s highlight
        isAtBottomRef.current = false;
        setUnreadCount(0);
        setFirstUnreadId(null);
        return;
      } else {
        console.warn("[TopicRoom] Element NOT found for firstUnreadId:", `message-${firstUnreadId}`);
      }
    }
    scrollToBottom();
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    setFirstUnreadId(null);
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  };

  // Stable handlers for messages and UI actions
  const handleMessageUpdate = useCallback((updatedMessage) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
    );
  }, []);

  const handleMessageDelete = useCallback((messageId) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, content: "[deleted]" } : m))
    );
    queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    queryClient.invalidateQueries({ queryKey: ["topicMessages", topicId] });
  }, [topicId, queryClient]);

  const handleScrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  }, []);

  const handleSend = async (content) => {
    if (!user || !topicId) return;

    const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const pendingMessage = {
      _id: tempId,
      content,
      author: {
        _id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarInitials: user.avatarInitials,
        avatarColor: user.avatarColor,
      },
      parentMessageId: null,
      topicId,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setLocalMessages((prev) => [...prev, pendingMessage]);

    try {
      const msg = await sendMessageMutation.mutateAsync({
        content,
        topicId,
        parentMessageId: null,
      });

      setLocalMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...msg, isPending: false } : m)),
      );

      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topicMessages", topicId] });

      // Do not emit message here.
      // Backend broadcast should handle delivery to other clients.
    } catch (err) {
      console.error("Failed to send message:", err);
      setLocalMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };


  // Actual logic for handlers updated via refs
  useEffect(() => {
    handleIncomingRef.current = (msg) => {
      if (!msg?._id) return;
      const isOwnMessage = getAuthorId(msg) === user?.id;
      if (isOwnMessage) return;
      if (msg.topicId !== topicId || msg.parentMessageId) return;

      // De-duplicate socket events
      if (socketSeenIdsRef.current.has(msg._id)) return;
      socketSeenIdsRef.current.add(msg._id);
      setTimeout(() => socketSeenIdsRef.current.delete(msg._id), 10000);

      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topicMessages", topicId] });

      // Race condition fix: Trigger unread count even if already in cache/state
      if (!isAtBottomRef.current) {
        setUnreadCount((prev) => prev + 1);
        setFirstUnreadId((prevId) => {
          return prevId || msg._id;
        });
      }
    };
  }, [topicId, user, queryClient]);

  useEffect(() => {
    handleReactionRef.current = (data) => {
      if (!data?.messageId) return;
      setLocalMessages((prev) =>
        prev.map((m) => (m._id === data.messageId ? { ...m, reactions: data.reactions || [] } : m))
      );
    };
  }, []);

  useEffect(() => {
    handleEditRef.current = ({ message }) => {
      if (message?._id) handleMessageUpdate(message);
    };
  }, [handleMessageUpdate]);

  useEffect(() => {
    handleDeleteRef.current = ({ messageId }) => {
      if (messageId) handleMessageDelete(messageId);
    };
  }, [handleMessageDelete]);

  useEffect(() => {
    handleReplyRef.current = ({ messageId, replyCount }) => {
      if (!messageId) return;
      console.log(`[TopicRoom] reply_count_update: ${messageId} -> ${replyCount}`);
      setLocalMessages(prev => prev.map(m => String(m._id) === String(messageId) ? { ...m, replyCount } : m));
    };
  }, []);

  const handleShare = () => setShowShare(true);

  const isSearching = search.trim().length > 0;
  const displayedMessages = isSearching ? searchResults : localMessages;
  const filteredMessages = displayedMessages.filter((m) => {
    if (filter === "Host only") return m.author?.isAdmin;
    if (filter === "Your post") {
      return user && (m.author?._id === user.id || m.author?.id === user.id);
    }
    return true;
  });

  if (!topic) {
    if (loading) {
      return (
        <Layout>
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p className="text-base font-medium">Loading topic...</p>
          </div>
        </Layout>
      );
    }

    const errorHeaderProps = {
      title: "Today's Topic",
      subtitle: (
        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          live
        </span>
      ),
      rightElement: (
        <button
          onClick={handleShare}
          className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-400 flex items-center gap-1 max-sm:hidden"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Discussion
        </button>
      ),
    };

    return (
      <Layout headerProps={errorHeaderProps}>
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Topic not found</h2>
          <p className="text-gray-400 mb-8 max-w-sm">
            We couldn't find the topic you're looking for. It may have expired or been removed.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="bg-white/10 hover:bg-white/15 text-white px-6 py-2.5 rounded-full font-medium inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  const shareBtn = (
    <button
      onClick={handleShare}
      className="bg-green-500 text-white text-xs px-3 py-2.5 rounded-lg hover:bg-green-400 flex items-center gap-1 max-sm:hidden"
    >
      <Share2 className="w-3.5 h-3.5" />
      Share Discussion
    </button>
  );

  const statusBadge = topic?.isPurged ? (
    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
      archived
    </span>
  ) : topic?.isLive ? (
    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      live
    </span>
  ) : (
    <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      ended
    </span>
  );

  const headerProps = {
    title: isLiveMode ? "Today's Topic" : (topic?.title || "Today's Topic"),
    subtitle: statusBadge,
    rightElement: shareBtn,
    showBack: !isLiveMode,
    onBack: () => {
      console.log("[TopicRoom] Back button clicked.");
      console.log("[TopicRoom] window.history.length:", window.history.length);
      console.log("[TopicRoom] fromExplore:", fromExplore);
      
      const dest = getBackDestination(fromExplore ? '/explore' : '/');
      console.log("[TopicRoom] Navigating to:", dest);
      setLocation(dest);
    }
  };

  return (
    <Layout hideMobileNav headerProps={headerProps}>
      <div className="flex h-full max-h-full overflow-hidden">
        <AnimatePresence>
          {showShare && topic && (
            <div
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
              onClick={() => setShowShare(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <ShareModalContent
                  url={window.location.href}
                  topicTitle={topic?.title || "Let's Talk"}
                  topicDescription={topic?.description || "Join the conversation"}
                  onClose={() => setShowShare(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Topic card — hidden on mobile, visible on desktop */}
          <div className="hidden md:block bg-[hsl(var(--topic-open))]/95 px-4 py-4 border-b border-[hsla(0,0%,100%,0.08)] flex-shrink-0">
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white leading-snug break-words">
                    {topic.title}
                  </h2>
                  {statusBadge}
                </div>
                {topic.description && (
                  <p className="text-gray-300 text-xs leading-relaxed mb-2 break-words">
                    {topic.description}
                  </p>
                )}
                {topic.isPurged && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-2">
                    <p className="text-amber-400 text-[10px] leading-relaxed">
                      <strong>Discussion Archived</strong>: General chat has been removed to save space. Ongoing conversations continue in the threads below.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,255,145,0.15)] border border-[rgba(0,255,145,0.35)] text-white text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                    <CountdownTimer expiresAt={topic.expiresAt} />
                  </span>
                  <span className="text-gray-300">
                    •{" "}
                    <strong className="text-white">
                      {formatCount(topic.messageCount || 0)}
                    </strong>{" "}
                    opinions
                  </span>
                  <span className="text-gray-300">
                    •{" "}
                    <strong className="text-white">
                      {formatCount(topic.participantCount || 0)}
                    </strong>{" "}
                    participants
                  </span>
                </div>
              </div>
              {topic.imageUrl && (
                <img
                  src={topic.imageUrl}
                  alt=""
                  className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 flex-shrink-0 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filter === f
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
            <div className="ml-auto flex items-center">
              <button
                onClick={() => setShowSearch((o) => !o)}
                className={`flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 transition-all ${
                  showSearch ? 'w-48' : 'w-auto'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-gray-200 flex-shrink-0" />
                {showSearch ? (
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search messages..."
                    autoFocus
                    className="bg-transparent text-white text-xs outline-none w-full min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-gray-200 text-xs whitespace-nowrap">
                    Search
                  </span>
                )}
              </button>
              {showSearch && search.trim() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                  }}
                  className="ml-1 text-gray-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#1e3d3d]/30 mx-4 mt-2 rounded-xl px-3 py-2 border border-dashed border-white/10 flex-shrink-0">
            <p className="text-gray-400 text-xs leading-relaxed">
              <span className="text-green-400 font-medium">Welcome to Let's Talk.</span>{" "}
              Every Topic runs for 27 hours. Replies are public, threads, and reportable.
              Be kind: Disagree with ideas not people.
            </p>
          </div>

          <div
            className="flex-1 overflow-y-auto px-3 py-3 relative"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasNextPage && localMessages.length > 0 && (
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
                {unreadCount} new message{unreadCount !== 1 ? "s" : ""}
              </button>
            )}

            {messagesLoading && localMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">Loading messages...</div>
            ) : searchLoading ? (
              <div className="text-center text-gray-400 py-10 text-xs">Searching...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-10 text-sm">
                {isSearching
                  ? "No messages match your search."
                  : "Be the first to share your take!"}
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <MessageCard
                  key={msg._id}
                  message={msg}
                  isOwnMessage={
                    user &&
                    (msg.author?._id === user.id || msg.author?.id === user.id)
                  }
                  isPending={msg.isPending}
                  showThread={true}
                  showReply={false}
                  showParentPreview={false}
                  onOpenThread={(messageToOpen = msg) => {
                    if (isMobile) {
                      saveForExpand({
                        threadId: messageToOpen._id,
                        replyTo: null,
                        parentMessage: messageToOpen,
                      });
                      setLocation(`/thread/${messageToOpen._id}`);
                    } else {
                      setThread(messageToOpen);
                    }
                  }}
                  onReply={(messageToReply = msg) => {
                    if (isMobile) {
                      saveForExpand({
                        threadId: messageToReply._id,
                        replyTo: messageToReply,
                        parentMessage: messageToReply,
                      });
                      setLocation(`/thread/${messageToReply._id}`);
                    } else {
                      setThread(messageToReply);
                    }
                  }}
                  onOpenProfile={(author) => {
                    const id = author?._id || author?.id;
                    if (id) setSelectedProfileUserId(id);
                  }}
                  onMessageUpdate={handleMessageUpdate}
                  onMessageDelete={handleMessageDelete}
                  onScrollToMessage={handleScrollToMessage}
                  isHighlighted={String(msg._id) === String(highlightedMessageId)}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {!isAtBottom ? (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 bg-purple-500 hover:bg-purple-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ width: "36px", height: "36px" }}
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          ) : null}

          <div className="flex-shrink-0 bg-[hsl(var(--sidebar))] border-t border-white/5">
            {user ? (
              <div className="px-4 py-3 bg-[hsl(var(--topic-open))]/95">
                {!topic.isPurged ? (
                  <MessageInput
                    ref={messageInputRef}
                    onSend={handleSend}
                    onFocus={isMobile ? scrollToBottom : undefined}
                    replyTo={null}
                    onClear={undefined}
                    roomLabel={`#${topic.category?.toLowerCase() || "topic"}-room`}
                    placeholder="Share your take..."
                    autoFocus
                  />
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-gray-400 text-xs italic">General chat closed. You can still reply to threads.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#0f2929]/95 border-t border-white/10 px-4 py-3 text-center text-sm text-gray-400">
                <a href="/auth" className="text-purple-400">
                  Sign in
                </a>{" "}
                to join the conversation
              </div>
            )}
          </div>
        </div>

        {/* Thread panel — desktop only (rendered inside TopicRoom content area) */}
        {thread && !isMobile && (
          <>
            <div
              className={`hidden lg:flex w-1 cursor-col-resize hover:bg-white/20 active:bg-purple-500 transition-colors z-10 flex-shrink-0`}
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingRef.current = true;
                const startX = e.pageX;
                const startWidth = threadPanelWidth;
                
                const onMouseMove = (moveEvent) => {
                  if (!isDraggingRef.current) return;
                  const deltaX = startX - moveEvent.pageX;
                  // Allow thread panel to be between 250px and half screen
                  const newWidth = Math.max(250, Math.min(startWidth + deltaX, window.innerWidth - 550));
                  setThreadPanelWidth(newWidth);
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
              className="hidden lg:flex flex-col border-l border-white/5 flex-shrink-0"
              style={{ width: `${threadPanelWidth}px` }}
            >
              <ThreadPanel
                parentMessage={thread}
                highlightedMessageId={threadHighlightedMessageId}
                onClose={() => {
                  console.log("[TopicRoom] ThreadPanel onClose clicked -> Setting thread to null");
                  setThread(null);
                  setThreadHighlightedMessageId(null);
                }}
                roomLabel={`#${topic?.category?.toLowerCase() || 'topic'}-room`}
                onOpenProfile={(author) => {
                  const id = author?._id || author?.id;
                  if (id) setSelectedProfileUserId(id);
                }}
              />
            </div>
          </>
        )}

        {/* Active Participants panel — desktop only */}
        {!thread && !isMobile && (
          <>
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
                <p className="text-xs text-gray-400">
                  {participantsLoading ? 'Loading...' : `${participants.length} people in this room`}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {participantsLoading
                  ? <div className="text-center text-gray-500 text-xs py-6">Loading participants...</div>
                  : participants.slice(0, 8).map((p) => (
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
          </>
        )}
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