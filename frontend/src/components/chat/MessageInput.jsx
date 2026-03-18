import { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function SendIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M3.4 20.4L22 12 3.4 3.6 3.3 10l13.2 2-13.2 2z" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 16V5" />
            <path d="M8 9l4-4 4 4" />
            <path d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
        </svg>
    );
}

export default function MessageInput({
    onSend,
    recipientLabel = "#global-room",
    recipientType = "chatroom",
    compact = false,
}) {
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if (!input.trim() && !selectedImage) return;

        onSend({
            text: input.trim(),
            image: selectedImage,
        });

        setInput("");
        setSelectedImage(null);
        setShowEmojiPicker(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleEmojiClick = (emojiData) => {
        setInput((prev) => prev + emojiData.emoji);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const dataUrl = await readFileAsDataUrl(file);

        setSelectedImage({
            file,
            previewUrl: dataUrl,
            name: file.name,
            mimeType: file.type,
        });
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const recipientPrefix = recipientType === "user" ? "sending to" : "reply into";

    return (
        <div className={`sticky bottom-0 z-10 bg-[#0b6278] ${compact ? "px-2 pb-2 pt-2" : "px-3 pb-3 pt-2 sm:px-5 lg:px-6"}`}>
            {showEmojiPicker ? (
                <div className={`absolute z-20 overflow-hidden rounded-2xl border border-white/10 shadow-lg ${compact ? "bottom-[106px] left-2 scale-[0.88] origin-bottom-left" : "bottom-[112px] left-3 sm:left-5 lg:left-6"}`}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                </div>
            ) : null}

            {selectedImage ? (
                <div className="mb-3 rounded-2xl border border-white/10 bg-[#112831] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-white/80">{selectedImage.name}</p>
                        <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="text-sm text-red-300 hover:text-red-200"
                        >
                            Remove
                        </button>
                    </div>

                    <img
                        src={selectedImage.previewUrl}
                        alt="Preview"
                        className="max-h-40 rounded-xl object-cover"
                    />
                </div>
            ) : null}

            <div className={`flex items-end ${compact ? "gap-2" : "gap-3"}`}>
                <div className={`flex-1 rounded-[18px] bg-[#3a3b42] ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div className={`min-w-0 italic text-white/78 ${compact ? "text-[10px]" : "text-xs"}`}>
                            <span>{recipientPrefix} </span>
                            <span className="font-semibold text-[#39ff74]">
                                {recipientLabel}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className={`flex shrink-0 items-center justify-center rounded-full text-xs text-white/68 transition hover:bg-white/8 hover:text-white ${compact ? "h-7 w-7" : "h-8 w-8"}`}
                            title="Open emoji picker"
                        >
                            :)
                        </button>

                        <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Share your take..."
                            rows={1}
                            className={`flex-1 resize-none bg-transparent italic text-white outline-none placeholder:text-white/78 ${compact ? "h-7 py-1 text-[0.92rem] leading-[18px]" : "h-8 py-[5px] text-sm leading-[18px]"}`}
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex shrink-0 items-center justify-center rounded-full text-white/78 transition hover:bg-white/8 hover:text-white ${compact ? "h-7 w-7" : "h-8 w-8"}`}
                            title="Upload file"
                        >
                            <UploadIcon />
                        </button>
                    </div>

                    <p className={`mt-2 italic text-white/78 ${compact ? "text-[10px]" : "text-xs"}`}>
                        Default: public message
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSend}
                    className={`flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#b7eaab,#7fd47a)] text-white shadow-[0_0_26px_rgba(147,255,136,0.28)] transition hover:scale-[1.02] ${compact ? "h-12 w-12" : "h-16 w-16"}`}
                    title="Send message"
                >
                    <SendIcon />
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
