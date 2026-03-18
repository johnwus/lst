import { formatMessageTime } from "../../utils/chatHelpers";

export default function ThreadNode({
    node,
    children,
    isSelected = false,
    onSelect,
    compact = false,
}) {
    const replyCount = node.replies?.length || 0;

    return (
        <div className="relative">
            <div className={`absolute top-5 h-2.5 w-2.5 rounded-full border border-white/20 bg-[#1b5f72] ${compact ? "-left-[13px]" : "-left-[21px]"}`} />

            <div
                className={`rounded-[20px] border px-4 py-4 transition ${
                    isSelected
                        ? "border-[#39ff74]/35 bg-[rgba(29,76,92,0.92)]"
                        : "border-white/10 bg-[rgba(17,48,60,0.88)]"
                } ${onSelect ? "cursor-pointer hover:border-white/20" : ""} ${compact ? "px-3 py-3" : "px-4 py-4"}`}
                onClick={() => onSelect?.(node)}
            >
                <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-white">{node.user}</p>
                        <p className="text-xs text-white/44">
                            {node.time ? formatMessageTime(node.time) : "Now"}
                        </p>
                    </div>

                    {replyCount > 0 ? (
                        <span className="rounded-full bg-white/6 px-2 py-1 text-[11px] text-white/56">
                            {replyCount} repl{replyCount === 1 ? "y" : "ies"}
                        </span>
                    ) : null}
                </div>

                {node.image ? (
                    <div className="mb-3 overflow-hidden rounded-xl border border-white/6 bg-[rgba(6,20,26,0.38)] p-2">
                        <img
                            src={node.image}
                            alt="Thread attachment"
                            className="max-h-64 w-full rounded-lg object-contain"
                        />
                    </div>
                ) : null}

                {node.text ? (
                    <p className={`text-white/94 ${compact ? "text-sm leading-6" : "text-sm leading-7"}`}>{node.text}</p>
                ) : (
                    <p className="text-sm italic text-white/46">
                        Shared an attachment
                    </p>
                )}
            </div>

            {children ? <div className="mt-3">{children}</div> : null}
        </div>
    );
}
