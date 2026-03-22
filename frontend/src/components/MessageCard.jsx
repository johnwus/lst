// import { useState, useRef, useEffect } from 'react';
// import Avatar from './Avatar';
// import { useAuth } from '../context/AuthContext';
// import { getSocket } from '../lib/socket';
// import { useReactMessage, useEditMessage, useDeleteMessage, useReportMessage, useFollowingStatus, useFollowUser } from '../hooks/useQueries';
// import likeIcon from '../asssets/like.png';
// import loveIcon from '../asssets/love.png';
// import funnyIcon from '../asssets/funny.png';
// import curiousIcon from '../asssets/curious.png';
// import insightfulIcon from '../asssets/insightful.png';
// import threadIcon from '../asssets/thread.png';

// const REACTION_ICONS = {
//   like: likeIcon,
//   love: loveIcon,
//   funny: funnyIcon,
//   curious: curiousIcon,
//   insightful: insightfulIcon,
// };

// function formatTime(dateStr) {
//   const d = new Date(dateStr);
//   const h = d.getHours();
//   const m = d.getMinutes().toString().padStart(2, '0');
//   const ampm = h >= 12 ? 'PM' : 'AM';
//   return `${h % 12 || 12}:${m} ${ampm}`;
// }

// export default function MessageCard({ 
//   message, 
//   onReply, 
//   onOpenThread, 
//   onOpenProfile,
//   showThread = true, 
//   showReply = true,
//   showParentPreview = false,
//   showReplyCount = true,
//   threadRootId = null,
//   isOwnMessage = false,
//   isPending = false,
//   isFollowing,
//   onFollow,
//   onMessageUpdate,
//   onMessageDelete,
//   onScrollToMessage
// }) {
//   const { user } = useAuth();
//   const [reactions, setReactions] = useState(message.reactions || []);
//   const [showActions, setShowActions] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editContent, setEditContent] = useState(message.content);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isReporting, setIsReporting] = useState(false);
//   const [reportReason, setReportReason] = useState('');
//   const [error, setError] = useState('');
//   const editInputRef = useRef(null);

//   // TanStack Query mutations
//   const reactMutation = useReactMessage();
//   const editMutation = useEditMessage();
//   const deleteMutation = useDeleteMessage();
//   const reportMutation = useReportMessage();

//   useEffect(() => {
//     if (isEditing && editInputRef.current) {
//       editInputRef.current.focus();
//     }
//   }, [isEditing]);

//   // Listen for reaction updates from socket
//   useEffect(() => {
//     const socket = getSocket && getSocket();
//     if (!socket) return;
//     const handler = (data) => {
//       if (data.messageId === message._id) {
//         setReactions(data.reactions);
//       }
//     };
//     socket.on('reaction_update', handler);
//     return () => {
//       socket.off('reaction_update', handler);
//     };
//   }, [message._id]);

//   const handleReact = async (type) => {
//     try {
//       const updated = await reactMutation.mutateAsync({ id: message._id, type });
//       setReactions(updated);
      
//       // Emit reaction via socket to notify other users
//       const socket = getSocket();
//       if (socket) {
//         socket.emit('reaction', {
//           messageId: message._id,
//           reactions: updated,
//           topicId: message.topicId,
//           isGlobal: message.isGlobal
//         });
//       }
//     } catch {}
//   };

//   const handleEdit = async () => {
//     if (!editContent.trim() || editContent === message.content) {
//       setIsEditing(false);
//       return;
//     }
//     try {
//       const updated = await editMutation.mutateAsync({ id: message._id, content: editContent.trim() });
//       setIsEditing(false);
//       if (onMessageUpdate) {
//         onMessageUpdate(updated);
//       }
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await deleteMutation.mutateAsync(message._id);
//       setIsDeleting(false);
//       if (onMessageDelete) {
//         onMessageDelete(message._id);
//       }
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleReport = async () => {
//     if (!reportReason.trim()) {
//       setError('Please provide a reason for the report');
//       return;
//     }
//     try {
//       await reportMutation.mutateAsync({ id: message._id, reason: reportReason.trim() });
//       setIsReporting(false);
//       setReportReason('');
//       alert('Report submitted successfully. Thank you for keeping our community safe.');
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const cancelEdit = () => {
//     setEditContent(message.content);
//     setIsEditing(false);
//     setError('');
//   };

//   const cancelReport = () => {
//     setIsReporting(false);
//     setReportReason('');
//     setError('');
//   };

//   const authorId = message.author?._id || message.author?.id;
//   const { data: followStatus } = useFollowingStatus(authorId, {
//     enabled: !!authorId && !!user && authorId !== user.id,
//   });
//   const followMutation = useFollowUser();
//   const [isFollowingState, setIsFollowingState] = useState(false);

//   useEffect(() => {
//     if (typeof followStatus?.isFollowing === 'boolean') {
//       setIsFollowingState(followStatus.isFollowing);
//     }
//   }, [followStatus]);

//   const handleFollowToggle = async (author) => {
//     if (!authorId || !user || authorId === user.id) return;
//     try {
//       const result = await followMutation.mutateAsync(authorId);
//       if (result?.following !== undefined) {
//         setIsFollowingState(result.following);
//       } else {
//         setIsFollowingState(prev => !prev);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const isHost = message.author?.isAdmin;
//   const parentAuthor = message.parentMessage?.author || message.parentMessageId?.author;
//   const parentUsername = parentAuthor?.username || parentAuthor?.displayName;
//   const parentPreview = message.parentMessage?.content || message.parentMessageId?.content;
//   const parentId = message.parentMessage?._id || message.parentMessageId?._id || message.parentMessageId;

//   const shouldShowReplyPreview =
//     showParentPreview &&
//     parentId &&
//     threadRootId &&
//     parentId !== threadRootId;

//   // Show "[deleted]" for deleted messages
//   if (message.isDeleted) {
//     return (
//       <div id={`message-${message._id}`} className="bg-[hsla(0,0%,100%,0.04)] rounded-xl p-3 md:p-4 mb-2 border border-[hsla(0,0%,100%,0.08)] opacity-60">
//         <div className="flex items-start gap-2.5">
//           <Avatar 
//             user={message.author} 
//             size={36} 
//             onClick={() => onOpenProfile?.(message.author)}
//             className="cursor-pointer"
//           />
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 flex-wrap">
//               <span className="font-semibold text-white text-sm">
//                 {message.author?.displayName || message.author?.username || 'Unknown'}
//               </span>
//               <span className="text-xs text-gray-400 ml-auto">{formatTime(message.createdAt)}</span>
//             </div>
//             <p className="text-gray-500 text-sm mt-1 italic">This message has been deleted</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       id={`message-${message._id}`}
//       className={`bg-[hsla(0,0%,100%,0.04)] rounded-xl p-3 md:p-4 mb-2 border border-[hsla(0,0%,100%,0.08)] ${isPending ? 'opacity-60' : ''}`}
//       onMouseEnter={() => !isPending && setShowActions(true)}
//       onMouseLeave={() => setShowActions(false)}
//     >
//       <div className="flex items-start gap-2.5">
//         <Avatar 
//           user={message.author} 
//           size={36} 
//           onClick={() => onOpenProfile?.(message.author)}
//           className="cursor-pointer"
//         />
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <button onClick={() => onOpenProfile?.(message.author)} className="font-semibold text-white text-sm hover:text-green-300 text-left">
//               {message.author?.displayName || message.author?.username || 'Unknown'}
//             </button>
//             {isHost && (
//               <span className="text-[10px] border border-gray-400 text-gray-300 rounded-full px-1.5 py-0.5">Host</span>
//             )}
//             {!isOwnMessage && message.author && user && message.author._id !== user.id && (
//               <button
//                 onClick={() => {
//                   if (onFollow) {
//                     onFollow(message.author);
//                   } else {
//                     handleFollowToggle(message.author);
//                   }
//                 }}
//                 disabled={followMutation.isLoading}
//                 className={`text-[10px] rounded-full px-2 py-0.5 ${isFollowingState ? 'bg-gray-500 text-white' : 'bg-green-500 text-white hover:bg-green-400'}`}
//               >
//                 {followMutation.isLoading ? 'Updating...' : isFollowingState ? 'Following' : 'Follow'}
//               </button>
//             )}
//             <span className="text-xs text-gray-400 ml-auto">
//               {isPending ? (
//                 <span className="text-yellow-400">Sending...</span>
//               ) : (
//                 formatTime(message.createdAt)
//               )}
//             </span>
//           </div>

//           {message.editedAt && !isEditing && (
//             <span className="text-[10px] text-gray-500">edited</span>
//           )}

//           {isEditing ? (
//             <div className="mt-1">
//               <textarea
//                 ref={editInputRef}
//                 value={editContent}
//                 onChange={(e) => setEditContent(e.target.value)}
//                 className="w-full bg-white/10 text-white text-sm rounded-lg p-2 outline-none border border-white/20"
//                 rows={Math.max(2, editContent.split('\n').length)}
//               />
//               {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
//               <div className="flex gap-2 mt-2">
//                 <button
//                   onClick={handleEdit}
//                   className="text-xs bg-green-500 hover:bg-green-400 text-white rounded-full px-3 py-1"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={cancelEdit}
//                   className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* Show parent message if this is a reply */}
//               {shouldShowReplyPreview && (
//                 <div 
//                   className="mb-2 p-2 bg-white/5 rounded-lg border-l-2 border-green-500 cursor-pointer hover:bg-white/10"
//                   onClick={() => onScrollToMessage?.(message.parentMessage?._id || message.parentMessageId?._id || message.parentMessageId)}
//                 >
//                   <div className="text-xs text-gray-400 mb-1">
//                     Replying to <span className="text-green-400">@{parentUsername || 'user'}</span>
//                   </div>
//                   <p className="text-gray-300 text-sm line-clamp-2">
//                     {parentPreview || 'Original message'}
//                   </p>
//                 </div>
//               )}
//               <p className="text-white text-sm mt-1 leading-relaxed">{message.content}</p>
//             </>
//           )}

//           {showReplyCount && message.replyCount > 0 && !isEditing && (
//             <button
//               onClick={() => onOpenThread?.(message)}
//               className="text-[11px] text-gray-400 border border-white/10 rounded-full px-2 py-0.5 mt-1 hover:bg-white/5"
//             >
//               {message.replyCount} replies →
//             </button>
//           )}

//           {!isEditing && (
//             <div className="flex flex-wrap items-center gap-1.5 mt-2">
//               {reactions.map(r => (
//                 <button
//                   key={r.type}
//                   onClick={() => handleReact(r.type)}
//                   className="flex items-center gap-1 bg-white/5 hover:bg-white/10 rounded-full px-2 py-1 text-[12px] transition-colors"
//                 >
//                   <img src={REACTION_ICONS[r.type]} alt={r.type} className="w-4 h-4" />
//                   <span className="text-gray-300 text-[11px]">{r.count}</span>
//                 </button>
//               ))}
//             </div>
//           )}

//           {/* Delete Confirmation */}
//           {isDeleting && (
//             <div className="mt-2 p-2 bg-red-500/20 rounded-lg">
//               <p className="text-red-300 text-xs mb-2">Are you sure you want to delete this message?</p>
//               <div className="flex gap-2">
//                 <button
//                   onClick={handleDelete}
//                   className="text-xs bg-red-500 hover:bg-red-400 text-white rounded-full px-3 py-1"
//                 >
//                   Yes, Delete
//                 </button>
//                 <button
//                   onClick={() => setIsDeleting(false)}
//                   className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Report Dialog */}
//           {isReporting && (
//             <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/20">
//               <p className="text-white text-xs mb-2">Report this message</p>
//               <textarea
//                 value={reportReason}
//                 onChange={(e) => setReportReason(e.target.value)}
//                 placeholder="Why are you reporting this message?"
//                 className="w-full bg-transparent text-white text-sm rounded p-2 outline-none border border-white/20 resize-none"
//                 rows={2}
//               />
//               {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
//               <div className="flex gap-2 mt-2">
//                 <button
//                   onClick={handleReport}
//                   className="text-xs bg-red-500 hover:bg-red-400 text-white rounded-full px-3 py-1"
//                 >
//                   Submit Report
//                 </button>
//                 <button
//                   onClick={cancelReport}
//                   className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           {!isEditing && !isDeleting && !isReporting && (
//             <div className="flex items-center gap-2 mt-2 flex-wrap">
//               {showThread && (
//                 <button
//                   onClick={() => onOpenThread?.(message)}
//                   className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
//                 >
//                   <img src={threadIcon} alt="Open threads" className="w-4 h-4" />
//                   Open threads
//                 </button>
//               )}
//               {showReply && (
//                 <button
//                   onClick={() => onReply?.(message)}
//                   className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
//                 >
//                   ↩ Reply
//                 </button>
//               )}
//               {isOwnMessage && (
//                 <>
//                   <button 
//                     onClick={() => setIsEditing(true)}
//                     className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
//                   >
//                     ✏️ Edit
//                   </button>
//                   <button 
//                     onClick={() => setIsDeleting(true)}
//                     className="text-[11px] text-red-400 bg-white/5 hover:bg-red-500/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
//                   >
//                     🗑 Delete
//                   </button>
//                 </>
//               )}
//               {!isOwnMessage && user && (
//                 <button 
//                   onClick={() => setIsReporting(true)}
//                   className="text-[11px] text-gray-400 bg-white/5 hover:bg-red-500/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
//                 >
//                   🚩 Report
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useRef, useEffect, useMemo } from "react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import {
  useReactMessage,
  useEditMessage,
  useDeleteMessage,
  useReportMessage,
  useFollowingStatus,
  useFollowUser,
} from "../hooks/useQueries";
import likeIcon from "../asssets/like.png";
import loveIcon from "../asssets/love.png";
import funnyIcon from "../asssets/funny.png";
import curiousIcon from "../asssets/curious.png";
import insightfulIcon from "../asssets/insightful.png";
import threadIcon from "../asssets/thread.png";

const REACTION_ICONS = {
  like: likeIcon,
  love: loveIcon,
  funny: funnyIcon,
  curious: curiousIcon,
  insightful: insightfulIcon,
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function renderContentWithMentions(content) {
  if (!content) return null;

  return content.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={`${part}-${i}`}
          className="font-medium text-green-400 bg-green-500/10 rounded px-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MessageCard({
  message,
  onReply,
  onOpenThread,
  onOpenProfile,
  showThread = true,
  showReply = true,
  showParentPreview = false,
  showReplyCount = true,
  threadRootId = null,
  isOwnMessage = false,
  isPending = false,
  isFollowing,
  onFollow,
  onMessageUpdate,
  onMessageDelete,
  onScrollToMessage,
  isHighlighted = false,
}) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(message.reactions || []);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [error, setError] = useState("");
  const [isFollowingState, setIsFollowingState] = useState(false);
  const editInputRef = useRef(null);

  const reactMutation = useReactMessage();
  const editMutation = useEditMessage();
  const deleteMutation = useDeleteMessage();
  const reportMutation = useReportMessage();
  const followMutation = useFollowUser();

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setReactions(message.reactions || []);
    setEditContent(message.content || "");
  }, [message._id, message.reactions, message.content]);

  useEffect(() => {
    if (typeof isFollowing === "boolean") {
      setIsFollowingState(isFollowing);
    }
  }, [isFollowing]);

  useEffect(() => {
    const socket = getSocket && getSocket();
    if (!socket) return;

    const handler = (data) => {
      if (data.messageId === message._id) {
        setReactions(data.reactions || []);
      }
    };

    socket.on("reaction_update", handler);
    return () => {
      socket.off("reaction_update", handler);
    };
  }, [message._id]);

  const authorId = message.author?._id || message.author?.id;

  const { data: followStatus } = useFollowingStatus(authorId, {
    enabled: !!authorId && !!user && authorId !== user.id,
  });

  useEffect(() => {
    if (typeof followStatus?.isFollowing === "boolean") {
      setIsFollowingState(followStatus.isFollowing);
    }
  }, [followStatus]);

  const isHost = message.author?.isAdmin;
  const parentAuthor = message.parentMessage?.author || message.parentMessageId?.author;
  const parentUsername = parentAuthor?.username || parentAuthor?.displayName;
  const parentPreview = message.parentMessage?.content || message.parentMessageId?.content;
  const parentId = message.parentMessage?._id || message.parentMessageId?._id || message.parentMessageId;

  const shouldShowReplyPreview =
    showParentPreview && parentId && threadRootId && parentId !== threadRootId;

  const handleReact = async (type) => {
    try {
      const updated = await reactMutation.mutateAsync({ id: message._id, type });
      setReactions(updated || []);

      const socket = getSocket();
      if (socket) {
        socket.emit("reaction", {
          messageId: message._id,
          reactions: updated,
          topicId: message.topicId,
          isGlobal: message.isGlobal,
          threadId: threadRootId || message.threadId || message.originalMessageId || message.parentMessageId,
        });
      }
    } catch (err) {
      console.error("Failed to react to message", err);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === (message.content || "")) {
      setIsEditing(false);
      setError("");
      return;
    }

    try {
      const updated = await editMutation.mutateAsync({
        id: message._id,
        content: editContent.trim(),
      });
      setIsEditing(false);
      setError("");
      onMessageUpdate?.(updated);
    } catch (err) {
      setError(err?.message || "Unable to update message");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(message._id);
      setIsDeleting(false);
      onMessageDelete?.(message._id);
    } catch (err) {
      setError(err?.message || "Unable to delete message");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      setError("Please provide a reason for the report");
      return;
    }

    try {
      await reportMutation.mutateAsync({
        id: message._id,
        reason: reportReason.trim(),
      });
      setIsReporting(false);
      setReportReason("");
      setError("");
      alert("Report submitted successfully. Thank you for helping keep the community safe.");
    } catch (err) {
      setError(err?.message || "Unable to submit report");
    }
  };

  const cancelEdit = () => {
    setEditContent(message.content || "");
    setIsEditing(false);
    setError("");
  };

  const cancelReport = () => {
    setIsReporting(false);
    setReportReason("");
    setError("");
  };

  const handleFollowToggle = async () => {
    if (!authorId || !user || authorId === user.id) return;
    try {
      const result = await followMutation.mutateAsync(authorId);
      if (result?.following !== undefined) {
        setIsFollowingState(result.following);
      } else {
        setIsFollowingState((prev) => !prev);
      }
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleJumpToParent = () => {
    const targetId = message.parentMessage?._id || message.parentMessageId?._id || message.parentMessageId;
    if (targetId) {
      onScrollToMessage?.(targetId);
    }
  };

  if (message.isDeleted) {
    return (
      <div
        id={`message-${message._id}`}
        className={`bg-[hsla(0,0%,100%,0.04)] rounded-xl p-3 md:p-4 mb-2 border border-[hsla(0,0%,100%,0.08)] opacity-60 transition-all ${isHighlighted ? "ring-2 ring-green-400/70 shadow-[0_0_0_1px_rgba(74,222,128,0.35)] bg-green-500/5" : ""}`}
      >
        <div className="flex items-start gap-2.5">
          <Avatar
            user={message.author}
            size={36}
            onClick={() => onOpenProfile?.(message.author)}
            className="cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">
                {message.author?.displayName || message.author?.username || "Unknown"}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{formatTime(message.createdAt)}</span>
            </div>
            <p className="text-gray-500 text-sm mt-1 italic">This message has been deleted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message._id}`}
      className={`rounded-xl p-3 md:p-4 mb-2 border transition-all duration-150
        ${isPending ? "opacity-60" : ""}
        ${isHighlighted
          ? "ring-2 ring-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] bg-green-500/10 scale-[1.01] z-[5]"
          : isOwnMessage
            ? "bg-slate-800/30 border-slate-600/20 border-l-2 border-l-slate-500/25"
            : "bg-[hsla(0,0%,100%,0.04)] border-[hsla(0,0%,100%,0.08)]"
        } z-0`}
      onMouseEnter={() => !isPending && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2.5">
        <Avatar
          user={message.author}
          size={36}
          onClick={() => onOpenProfile?.(message.author)}
          className="cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenProfile?.(message.author)}
              className="font-semibold text-white text-sm hover:text-green-300 text-left truncate max-w-[12rem]"
            >
              {message.author?.displayName || message.author?.username || "Unknown"}
            </button>

            {isHost && (
              <span className="text-[10px] border border-gray-400 text-gray-300 rounded-full px-1.5 py-0.5 shrink-0">
                Host
              </span>
            )}

            {!isOwnMessage && message.author && user && authorId !== user.id && (
              <button
                onClick={() => (onFollow ? onFollow(message.author) : handleFollowToggle())}
                disabled={followMutation.isLoading}
                className="hidden"
              >
                {followMutation.isLoading ? "Updating..." : isFollowingState ? "Following" : "Follow"}
              </button>
            )}

            <span className="text-xs text-gray-400 ml-auto shrink-0">
              {isPending ? <span className="text-yellow-400">Sending...</span> : formatTime(message.createdAt)}
            </span>
          </div>

          {message.editedAt && !isEditing && (
            <span className="text-[10px] text-gray-500">edited</span>
          )}

          {isEditing ? (
            <div className="mt-1">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white/10 text-white text-sm rounded-lg p-2 outline-none border border-white/20"
                rows={Math.max(2, editContent.split("\n").length)}
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="text-xs bg-green-500 hover:bg-green-400 text-white rounded-full px-3 py-1"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {shouldShowReplyPreview && (
                <button
                  type="button"
                  className="mb-2 w-full p-2 bg-white/5 rounded-lg border-l-2 border-green-500 text-left hover:bg-white/10 transition-colors"
                  onClick={handleJumpToParent}
                  title="Jump to the message you replied to"
                >
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                    <span>
                      Replying to <span className="text-green-400">@{parentUsername || "user"}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Jump
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {parentPreview || "Original message"}
                  </p>
                </button>
              )}

              <p className="text-white text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">
                {renderContentWithMentions(message.content)}
              </p>
            </>
          )}

          {showReplyCount && message.replyCount > 0 && !isEditing && (
            <button
              onClick={() => onOpenThread?.(message)}
              className="text-[11px] text-gray-400 border border-white/10 rounded-full px-2 py-0.5 mt-1 hover:bg-white/5"
            >
              {message.replyCount} replies →
            </button>
          )}

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {reactions.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReact(r.type)}
                  className="flex items-center gap-1 bg-white/5 hover:bg-white/10 rounded-full px-2 py-1 text-[12px] transition-colors"
                >
                  <img src={REACTION_ICONS[r.type]} alt={r.type} className="w-4 h-4" />
                  <span className="text-gray-300 text-[11px]">{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {isDeleting && (
            <div className="mt-2 p-2 bg-red-500/20 rounded-lg">
              <p className="text-red-300 text-xs mb-2">Are you sure you want to delete this message?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded-full px-3 py-1"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isReporting && (
            <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white text-xs mb-2">Report this message</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Why are you reporting this message?"
                className="w-full bg-transparent text-white text-sm rounded p-2 outline-none border border-white/20 resize-none"
                rows={2}
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReport}
                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded-full px-3 py-1"
                >
                  Submit Report
                </button>
                <button
                  onClick={cancelReport}
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isEditing && !isDeleting && !isReporting && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {showThread && (
                <button
                  onClick={() => onOpenThread?.(message)}
                  className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                >
                  <img src={threadIcon} alt="Open threads" className="w-4 h-4" />
                  Open threads
                </button>
              )}
              {showReply && (
                <button
                  onClick={() => onReply?.(message)}
                  className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                >
                  ↩ Reply
                </button>
              )}
              {isOwnMessage && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="text-[11px] text-red-400 bg-white/5 hover:bg-red-500/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                  >
                    🗑 Delete
                  </button>
                </>
              )}
              {!isOwnMessage && user && (
                <button
                  onClick={() => setIsReporting(true)}
                  className="text-[11px] text-gray-400 bg-white/5 hover:bg-red-500/10 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                >
                  🚩 Report
                </button>
              )}
            </div>
          )}

          {showActions && !isEditing && !isDeleting && !isReporting && (
            <div className="absolute -top-2 right-2 opacity-0 pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
