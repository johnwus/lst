export async function fetchMessages() {
    return [
        {
            id: 1,
            user: "Kojo",
            text: "Hello everyone 👋",
            isSelf: false,
            time: Date.now() - 60000,
        },
        {
            id: 2,
            user: "Ama",
            text: "Hi Kojo!",
            isSelf: false,
            time: Date.now() - 30000,
            replyTo: {
                user: "Kojo",
                text: "Hello everyone 👋",
            },
        },
    ];
}

export async function sendMessage(messagePayload) {
    return {
        success: true,
        data: messagePayload,
    };
}