import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, onOpenThread, compact = false }) {
    const parentRef = useRef(null);
    const shouldStickToBottomRef = useRef(true);

    const rowVirtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 250,
        overscan: 8,
    });

    useEffect(() => {
        const el = parentRef.current;
        if (!el || messages.length === 0) return;

        if (shouldStickToBottomRef.current) {
            requestAnimationFrame(() => {
                rowVirtualizer.scrollToIndex(messages.length - 1, {
                    align: "end",
                });
            });
        }
    }, [messages, rowVirtualizer]);

    const handleScroll = () => {
        const el = parentRef.current;
        if (!el) return;

        shouldStickToBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };

    return (
        <div
            ref={parentRef}
            onScroll={handleScroll}
            className={`h-full overflow-y-auto ${compact ? "px-2 py-3" : "px-4 py-4 sm:px-6"}`}
        >
            <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const message = messages[virtualRow.index];

                    return (
                        <div
                            key={message.id}
                            ref={rowVirtualizer.measureElement}
                            data-index={virtualRow.index}
                            className="absolute left-0 top-0 w-full"
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div className={compact ? "pb-3" : "pb-4 sm:pb-5"}>
                                <MessageItem
                                    message={message}
                                    onOpenThread={onOpenThread}
                                    compact={compact}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
