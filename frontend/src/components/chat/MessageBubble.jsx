import { formatMessageTime, isImageOnlyMessage } from "../../utils/chatHelpers";

const reactions = [
    { icon: "👍", tone: "bg-[#234c62]", text: "#d6f1ff" },
    { icon: "😍", tone: "bg-[#54411d]", text: "#ffe59b" },
    { icon: "❤️", tone: "bg-[#5a1e2e]", text: "#ffb0c1" },
];

function getInitials(user) {
    return user
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getReactionCount(message, offset) {
    const basis = (String(message.id).length + String(message.user).length + offset) % 3;
    return 120 + basis * 2;
}

export default function MessageBubble({ message, onOpenThread, compact = false }) {
    const isSelf = message.isSelf;
    const imageOnly = isImageOnlyMessage(message);
    const hasImage = Boolean(message.image);
    const hasText = Boolean(message.text);

    return (
        <article
            className={`rounded-[24px] border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${
                isSelf
                    ? "ml-auto bg-[rgba(46,63,104,0.94)]"
                    : "bg-[rgba(25,63,77,0.92)]"
            } ${
                compact
                    ? isSelf
                        ? "max-w-[96%] px-3 py-3"
                        : "max-w-[96%] px-3 py-3"
                    : isSelf
                        ? "max-w-[92%] px-4 py-4"
                        : "max-w-[86%] px-4 py-4"
            }`}
        >
            <div className={compact ? "flex items-start gap-3" : "flex items-start gap-4"}>
                <div className={`flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#13d5ff,#1571da)] font-medium text-white ${compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"}`}>
                    {getInitials(message.user)}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className={compact ? "text-base font-medium text-white" : "text-lg font-medium text-white"}>
                                {message.user}
                            </p>
                            {message.replyTo ? (
                                <p className="mt-0.5 text-xs text-white/50">
                                    Replying to {message.replyTo.user}
                                </p>
                            ) : null}
                        </div>

                        <p className="shrink-0 text-xs text-white/62">
                            {formatMessageTime(message.time)}
                        </p>
                    </div>

                    {hasImage ? (
                        <div className={`overflow-hidden rounded-[18px] border border-white/6 bg-[rgba(6,20,26,0.38)] p-2 ${compact ? "mt-3" : "mt-4"}`}>
                            <img
                                src={message.image}
                                alt="Sent attachment"
                                className={`w-full rounded-[14px] object-contain ${compact ? "max-h-64" : "max-h-[28rem]"}`}
                            />
                        </div>
                    ) : null}

                    {hasText ? (
                        <p className={`${hasImage ? (compact ? "mt-3" : "mt-4") : "mt-3"} text-white/95 ${compact ? "text-[0.92rem] leading-6" : "text-[0.98rem] leading-7"}`}>
                            {message.text}
                        </p>
                    ) : null}

                    {imageOnly ? null : (
                        <div className={`mt-4 flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
                            {reactions.map((reaction, index) => (
                                <span
                                    key={reaction.icon}
                                    className={`inline-flex items-center gap-1.5 rounded-full ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-xs"} ${reaction.tone}`}
                                    style={{ color: reaction.text }}
                                >
                                    <span>{reaction.icon}</span>
                                    {getReactionCount(message, index)}
                                </span>
                            ))}

                            <button
                                type="button"
                                onClick={() => onOpenThread?.(message)}
                                className={`rounded-xl bg-[#1f3c48] text-white/88 ${compact ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs"}`}
                            >
                                Reply
                            </button>

                            <button
                                type="button"
                                onClick={() => onOpenThread?.(message)}
                                className={`rounded-xl bg-[#1f3c48] text-white/88 ${compact ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs"}`}
                            >
                                Thread
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
