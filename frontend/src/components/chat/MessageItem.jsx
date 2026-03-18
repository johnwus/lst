import MessageBubble from "./MessageBubble";

export default function MessageItem({ message, onOpenThread, compact = false }) {
    return (
        <MessageBubble message={message} onOpenThread={onOpenThread} compact={compact} />
    );
}
