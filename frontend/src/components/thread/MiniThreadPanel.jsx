import { useEffect, useMemo, useState } from "react";
import MessageInput from "../chat/MessageInput";
import ThreadTree from "./ThreadTree";
import {
    countReplies,
    createThreadRoot,
    findThreadNode,
} from "../../utils/threadHelpers";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function MiniThreadPanel({
    message,
    thread,
    onClose,
    onAddReply,
}) {
    const isMobile = useIsMobileView();
    const [selectedNodeId, setSelectedNodeId] = useState(message?.id ?? null);

    const threadData = useMemo(() => {
        if (!message) {
            return [];
        }

        return thread?.length ? thread : [createThreadRoot(message)];
    }, [message, thread]);

    useEffect(() => {
        setSelectedNodeId(message?.id ?? null);
    }, [message]);

    const totalReplies = useMemo(
        () => countReplies(threadData?.[0]?.replies || []),
        [threadData]
    );

    const rootNode = threadData?.[0] || null;
    const replyNodes = rootNode?.replies || [];

    const selectedNode = useMemo(
        () =>
            findThreadNode(threadData, selectedNodeId) || threadData?.[0] || null,
        [selectedNodeId, threadData]
    );

    if (!message) return null;

    const handleSendReply = ({ text, image }) => {
        if (!selectedNode) return;

        onAddReply?.({
            rootMessageId: message.id,
            parentId: selectedNode.id,
            text,
            image: image?.previewUrl || null,
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close mini thread"
                className="fixed inset-0 z-30 bg-black/35"
            />

            <aside
                className={`fixed top-0 z-40 flex h-full w-full flex-col bg-[linear-gradient(180deg,#123a49_0%,#0c2d38_100%)] ${
                    isMobile
                        ? "left-0 max-w-[92vw] border-r border-white/10 shadow-[24px_0_60px_rgba(0,0,0,0.28)]"
                        : "right-0 max-w-[420px] border-l border-white/10 shadow-[-24px_0_60px_rgba(0,0,0,0.28)]"
                }`}
            >
                <div className={`border-b border-white/10 ${isMobile ? "px-4 py-4" : "px-5 py-4"}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-white/55">
                                Mini Thread
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-white">
                                {message.user}
                            </h2>
                            <p className="mt-1 text-sm text-white/58">
                                {totalReplies} repl{totalReplies === 1 ? "y" : "ies"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-white/82 transition hover:bg-white/10"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className={`border-b border-white/10 bg-[rgba(255,255,255,0.04)] ${isMobile ? "px-4 py-4" : "px-5 py-4"}`}>
                    <p className="text-xs uppercase tracking-[0.12em] text-white/50">
                        Thread starter
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                        {message.user}
                    </p>
                    {message.image ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-white/6 bg-[rgba(6,20,26,0.38)] p-2">
                            <img
                                src={message.image}
                                alt="Thread starter attachment"
                                className="max-h-56 w-full rounded-lg object-contain"
                            />
                        </div>
                    ) : null}
                    <p className="mt-2 text-sm leading-6 text-white/74">
                        {message.text || "Shared an attachment"}
                    </p>
                </div>

                <div className={`min-h-0 flex-1 overflow-y-auto ${isMobile ? "px-3 py-3" : "px-4 py-4"}`}>
                    {replyNodes.length > 0 ? (
                        <ThreadTree
                            nodes={replyNodes}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={(node) => setSelectedNodeId(node.id)}
                            compact={isMobile}
                        />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-6 text-sm text-white/54">
                            No replies yet. Start the thread by replying to {message.user}.
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 bg-[rgba(7,29,37,0.28)]">
                    <div className="px-4 pb-2 pt-3">
                        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-white/46">
                                Reply target
                            </p>
                            <p className="mt-1 text-sm font-medium text-white">
                                {selectedNode?.user || message.user}
                            </p>
                            <p className="mt-1 truncate text-sm text-white/58">
                                {selectedNode?.text || "Shared an attachment"}
                            </p>
                        </div>
                    </div>

                    <MessageInput
                        onSend={handleSendReply}
                        recipientLabel={`@${selectedNode?.user || message.user}`}
                        recipientType="user"
                        compact={isMobile}
                    />
                </div>
            </aside>
        </>
    );
}
