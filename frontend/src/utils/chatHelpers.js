export function formatMessageTime(time) {
    return new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function createMessage({
    user,
    text = "",
    isSelf = false,
    image = null,
    replyTo = null,
}) {
    return {
        id: Date.now() + Math.random(),
        user,
        text,
        isSelf,
        image,
        replyTo,
        time: Date.now(),
    };
}

export function isImageOnlyMessage(message) {
    return Boolean(message.image && !message.text);
}