import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import api from "../lib/api";
import { useIsMobile } from "../hooks/use-mobile";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const MessageInput = forwardRef(function MessageInput(
  {
    placeholder = "Share your take...",
    replyTo,
    onClear,
    onSend,
    onFocus,
    onBlur,
    roomLabel = "#global-room",
    autoFocus = false,
  },
  ref,
) {
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionResults, setMentionResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const textRef = useRef(null);
  const highlighterRef = useRef(null);
  const mentionRef = useRef(null);
  const textareaWrapRef = useRef(null);
  const searchRequestRef = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        textRef.current?.focus();
      },
      clear: () => {
        setText("");
      },
    }),
    [],
  );

  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!autoFocus || isMobile) return undefined;
    const timer = setTimeout(() => {
      textRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [autoFocus, roomLabel, isMobile]);

  useEffect(() => {
    const textarea = textRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${clamp(textarea.scrollHeight, 24, 120)}px`;
  }, [text]);

  useEffect(() => {
    if (replyTo) {
      textRef.current?.focus();
    }
  }, [replyTo]);

  useEffect(() => {
    if (!showMentions) return undefined;

    const searchUsers = async () => {
      const currentRequest = ++searchRequestRef.current;
      try {
        const response = await api.get(
          `/users/search?q=${encodeURIComponent(mentionSearch)}`,
        );
        const payload = response?.data ?? response;
        const users = Array.isArray(payload)
          ? payload
          : payload?.users || payload?.data || [];

        if (currentRequest === searchRequestRef.current) {
          setMentionResults(users.slice(0, 5));
          setActiveIndex(0);
        }
      } catch (err) {
        if (currentRequest === searchRequestRef.current) {
          setMentionResults([]);
          setActiveIndex(0);
        }
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [mentionSearch, showMentions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mentionRef.current && !mentionRef.current.contains(e.target)) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateMentionState = (value, cursorPos) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionSearch(mentionMatch[1]);
      setActiveIndex(0);

      const inputRect = textRef.current?.getBoundingClientRect();
      if (inputRect) {
        setMentionPosition({
          top: inputRect.bottom + 4,
          left: inputRect.left,
        });
      }

      return;
    }

    setShowMentions(false);
    setMentionSearch("");
    setMentionResults([]);
    setActiveIndex(0);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    updateMentionState(value, e.target.selectionStart || value.length);
  };

  const handleScroll = () => {
    if (textRef.current && highlighterRef.current) {
      highlighterRef.current.scrollTop = textRef.current.scrollTop;
    }
  };

  const insertMention = (username) => {
    if (!username) return;

    const cursorPos = textRef.current?.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    
    // Find the latest @ prefix before the cursor
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      const startIndex = textBeforeCursor.length - mentionMatch[0].length;
      const newTextBefore = textBeforeCursor.slice(0, startIndex) + `@${username} `;
      const nextText = `${newTextBefore}${textAfterCursor}`;
      setText(nextText);

      requestAnimationFrame(() => {
        const nextCursor = newTextBefore.length;
        textRef.current?.focus();
        textRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    }

    setShowMentions(false);
    setMentionSearch("");
    setMentionResults([]);
    setActiveIndex(0);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText("");
    setShowMentions(false);
    setMentionSearch("");
    setMentionResults([]);
    setActiveIndex(0);

    // Call onSend but don't block the UI
    onSend(messageText).catch((err) => {
      console.error("[MessageInput] Send error:", err);
    });

    requestAnimationFrame(() => textRef.current?.focus());
  };

  const handleKeyDown = (e) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => clamp(prev + 1, 0, mentionResults.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => clamp(prev - 1, 0, mentionResults.length - 1));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(mentionResults[activeIndex]?.username);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        setMentionSearch("");
        setMentionResults([]);
        setActiveIndex(0);
        return;
      }
    }

    // Atomic Deletion Logic
    if (e.key === "Backspace" && textRef.current) {
      const start = textRef.current.selectionStart;
      const end = textRef.current.selectionEnd;

      if (start === end && start > 0) {
        const textBeforeCursor = text.slice(0, start);
        // Look for completed "@user " or partial "@user" at cursor
        const atomicMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]+)\s?$|@$/);

        if (atomicMatch) {
          e.preventDefault();
          const startIndex = start - atomicMatch[0].length;
          const newText = text.slice(0, startIndex) + text.slice(start);
          setText(newText);
          
          requestAnimationFrame(() => {
            textRef.current?.setSelectionRange(startIndex, startIndex);
          });
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyUp = (e) => {
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Backspace" ||
      e.key === "Delete"
    ) {
      updateMentionState(text, textRef.current?.selectionStart || text.length);
    }
  };

  const handleMentionClick = (username) => {
    insertMention(username);
  };

  return (
    <div
      ref={textareaWrapRef}
      className={`relative p-2 rounded-xl transition-all duration-300 border ${
        showMentions 
          ? "bg-[hsla(180,26%,16%,1)] border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/20 animate-pulse-ring" 
          : "bg-[hsl(var(--sidebar))] border-[hsla(0,0%,100%,0.08)]"
      }`}
    >
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="text-[hsl(var(--muted-foreground))]">
            Replying in this sub-room to
          </span>
          <span className="text-green-400 font-medium">
            @{replyTo.author?.username || replyTo.username || replyTo.displayName || "user"}
          </span>
          {onClear && (
            <button onClick={onClear} className="text-gray-500 hover:text-white ml-auto">
              ✕
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          {/* Highlighter Overlay */}
          <div 
            ref={highlighterRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none whitespace-pre-wrap break-words text-sm leading-relaxed overflow-hidden"
            style={{ 
              minHeight: "24px",
              padding: "2px 0", // Match textarea padding
              color: 'transparent'
            }}
          >
            {text === "" ? (
              <span className="text-gray-500 opacity-0">{placeholder}</span>
            ) : (
              text.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => {
                if (part.startsWith("@")) {
                  return (
                    <span key={i} className="text-green-400 bg-green-500/15 rounded-sm shadow-[0_0_0_1px_rgba(34,197,94,0.15)] transition-all duration-150">
                      {part}
                    </span>
                  );
                }
                return <span key={i} className="text-white">{part}</span>;
              })
            )}
            {/* Trailing space fix for cursor */}
            {text.endsWith('\n') ? '\n' : ''}
          </div>

          <textarea
            ref={textRef}
            value={text}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent text-transparent caret-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed overflow-auto relative z-10"
            style={{ 
              minHeight: "24px",
              padding: "2px 0",
              fontFamily: "inherit"
            }}
          />

          {showMentions && mentionResults.length > 0 && (
            <div
              ref={mentionRef}
              className="absolute z-50 w-64 bg-[hsla(180,26%,10%,0.85)] backdrop-blur-xl border border-[hsla(0,0%,100%,0.12)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in-up"
              style={{
                bottom: "calc(100% + 12px)", // Show above input since it's cleaner
                left: 0,
              }}
            >
              <div className="px-3 py-2 bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Suggested Users
              </div>
              <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                {mentionResults.map((user, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={user._id || user.id}
                      onClick={() => handleMentionClick(user.username)}
                      className={`w-full px-3 py-2.5 text-left flex items-center gap-3 transition-all duration-150 ${
                        isActive ? "bg-green-500/20" : "hover:bg-white/5"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 shadow-sm border border-white/10"
                        style={{ 
                          background: `linear-gradient(135deg, ${user.avatarColor || "#6b7280"}, ${user.avatarColor}dd)` 
                        }}
                      >
                        {user.avatarInitials || user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-semibold truncate">
                            {user.displayName || user.username}
                          </span>
                          {isActive && (
                            <span className="text-[10px] bg-green-500/30 text-green-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                              Mention
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          @{user.username}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showMentions && mentionSearch && mentionResults.length === 0 && (
            <div
              ref={mentionRef}
              className="absolute z-50 w-64 bg-[hsla(180,26%,10%,0.85)] backdrop-blur-xl border border-[hsla(0,0%,100%,0.12)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{
                bottom: "calc(100% + 12px)",
                left: 0,
              }}
            >
              <div className="text-gray-500 text-sm font-medium">No matches for "{mentionSearch}"</div>
              <div className="text-gray-600 text-[10px] mt-1 italic uppercase tracking-wider">Try a different username</div>
            </div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" />
          </svg>
        </button>
      </div>

      <div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))] flex items-center justify-between gap-2">
        <span>Default: public message</span>
        <span>Type @ to mention</span>
      </div>
    </div>
  );
});

export default MessageInput;