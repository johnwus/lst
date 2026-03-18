import { useEffect, useState } from "react";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import MiniThreadPanel from "../components/thread/MiniThreadPanel";
import MobileBottomNav from "../components/mobile/MobileBottomNav";
import {
    connectSocket,
    disconnectSocket,
    emitNewMessage,
} from "../services/socketService";
import { fetchMessages, sendMessage } from "../services/messageService";
import { createMessage } from "../utils/chatHelpers";
import { addReplyToThread, createThreadRoot } from "../utils/threadHelpers";
import logoBanner from "../assets/AppLogo.jpg";
import searchImage from "../assets/search.png";
import shareImage from "../assets/share.png";
import liveRoomIcon from "../assets/chat.png";
import threadsIcon from "../assets/threads.png";
import notificationIcon from "../assets/bell.png";
import societyIcon from "../assets/pngtree-blue-globe-colours-east-sphere-photo-image_1463369.jpg";
import techIcon from "../assets/robot-head-illustration-vector.jpg";
import cultureIcon from "../assets/pngtree-cinemas-clapper-in-flat-style-on-white-background-png-image_4933608.png";
import moneyIcon from "../assets/money-wings-flying-symbol-cartoon-illustration-vector.jpg";
import useIsMobileView from "../hooks/useIsMobileView";

const desktopNavItems = [
    { label: "Live Room", active: true, icon: liveRoomIcon },
    { label: "Explore", icon: searchImage },
    { label: "Your Threads", icon: threadsIcon },
    { label: "Notification", icon: notificationIcon, dot: true },
];

const categories = [
    { icon: societyIcon, label: "Society" },
    { icon: techIcon, label: "Tech" },
    { icon: cultureIcon, label: "Culture" },
    { icon: moneyIcon, label: "Money" },
];

const filters = ["All", "Host only", "Your post"];
const participants = [
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
    "Lorem ipsum dolor",
];

function DotsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
        </svg>
    );
}

function AssetIcon({ src, alt, className = "" }) {
    return <img src={src} alt={alt} className={className} />;
}

function ParticipantAvatar({ label }) {
    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#08d6ff,#2968ff)] text-base font-medium text-white">
            {label}
        </div>
    );
}

export default function GlobalChatScreen() {
    const isMobile = useIsMobileView();
    const [messages, setMessages] = useState([]);
    const [selectedThreadMessage, setSelectedThreadMessage] = useState(null);
    const [threadsByMessageId, setThreadsByMessageId] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const currentUser = localStorage.getItem("user") || "You";

    const upsertMessage = (incomingMessage) => {
        setMessages((prev) => {
            const optimisticIndex = prev.findIndex(
                (message) =>
                    (incomingMessage.clientId &&
                        message.clientId === incomingMessage.clientId) ||
                    message.id === incomingMessage.id
            );

            if (optimisticIndex >= 0) {
                const next = [...prev];
                next[optimisticIndex] = {
                    ...next[optimisticIndex],
                    ...incomingMessage,
                    pending: false,
                };
                return next;
            }

            return [...prev, incomingMessage];
        });
    };

    useEffect(() => {
        async function loadMessages() {
            try {
                setMessages(await fetchMessages());
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        }

        loadMessages();

        const socket = connectSocket();
        const handleIncomingMessage = (incomingMessage) => {
            upsertMessage(incomingMessage);
        };

        socket.on("message", handleIncomingMessage);
        socket.on("new-message", handleIncomingMessage);

        return () => {
            socket.off("message", handleIncomingMessage);
            socket.off("new-message", handleIncomingMessage);
            disconnectSocket();
        };
    }, []);

    const openThread = (message) => {
        setSelectedThreadMessage(message);
        setThreadsByMessageId((prev) => ({
            ...prev,
            [message.id]: prev[message.id] || [createThreadRoot(message)],
        }));
    };

    const handleSendMessage = async ({ text, image }) => {
        const newMessage = createMessage({
            user: currentUser,
            text,
            image: image?.previewUrl || null,
            isSelf: true,
        });

        setMessages((prev) => [...prev, { ...newMessage, pending: true }]);
        emitNewMessage(newMessage);

        try {
            const response = await sendMessage(newMessage);
            if (response?.data) {
                upsertMessage({
                    ...response.data,
                    clientId: newMessage.clientId,
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) =>
                prev.map((message) =>
                    message.id === newMessage.id
                        ? { ...message, pending: false, failed: true }
                        : message
                )
            );
        }
    };

    const handleAddThreadReply = ({ rootMessageId, parentId, text, image = null }) => {
        const reply = createMessage({
            user: currentUser,
            text,
            image,
            isSelf: true,
        });
        setThreadsByMessageId((prev) => ({
            ...prev,
            [rootMessageId]: addReplyToThread(prev[rootMessageId] || [], parentId, {
                ...reply,
                replies: [],
            }),
        }));
    };

    const visibleMessages = messages.filter((message) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return true;
        }

        const replyText = message.replyTo?.text || "";
        return [message.user, message.text, replyText]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch));
    });

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#1b6478_0%,#0c5568_34%,#0a4e61_100%)] text-white">
            <div className={`mx-auto min-h-screen max-w-[1540px] px-0 ${isMobile ? "flex flex-col" : "lg:grid lg:grid-cols-[128px_minmax(0,1fr)_280px]"}`}>
                <aside className="hidden border-r border-white/10 bg-[#33353c]/96 lg:flex lg:min-h-screen lg:flex-col">
                    <div className="flex h-[88px] items-center justify-center border-b border-white/10">
                        <img
                            src={logoBanner}
                            alt="Let's Talk logo"
                            className="h-12 w-12 rounded-xl object-cover shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                        />
                    </div>

                    <div className="space-y-5 px-2 py-6">
                        {desktopNavItems.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                className="relative flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center text-[11px] text-white/86 transition hover:bg-white/6"
                            >
                                {item.active ? <span className="absolute left-0 top-3 h-12 w-1 rounded-full bg-[#39ff74]" /> : null}
                                <div className="relative">
                                    <AssetIcon
                                        src={item.icon}
                                        alt={`${item.label} icon`}
                                        className="h-9 w-9 object-contain [filter:brightness(0)_saturate(100%)_invert(40%)_sepia(84%)_saturate(2315%)_hue-rotate(257deg)_brightness(103%)_contrast(101%)]"
                                    />
                                    {item.dot ? (
                                        <span className="absolute -right-0.5 top-0 h-2.5 w-2.5 rounded-full bg-[#39ff74]" />
                                    ) : null}
                                </div>
                                <span className="max-w-[82px] leading-4">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-white/10 py-4">
                        <p className="mb-3 px-4 text-[11px] uppercase tracking-[0.12em] text-white/68">
                            Categories
                        </p>

                        <div className="space-y-1">
                            {categories.map((category) => (
                                <button
                                    key={category.label}
                                    type="button"
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/84 transition hover:bg-white/6"
                                >
                                    <AssetIcon
                                        src={category.icon}
                                        alt={`${category.label} icon`}
                                        className="h-4 w-4 rounded-sm object-cover"
                                    />
                                    {category.label}
                                </button>
                            ))}
                        </div>

                    </div>

                    <div className="mt-auto border-t border-white/10 px-3 py-4">
                        <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/6"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#08d6ff,#2968ff)] text-xl font-medium">
                                {currentUser.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">
                                    {currentUser}
                                </p>
                                <p className="truncate text-[12px] text-white/58">
                                    Current signed in user
                                </p>
                            </div>
                        </button>
                    </div>
                </aside>

                <section className="flex min-h-screen min-w-0 flex-col">
                    <header className={`border-b border-white/10 bg-[#1f677c]/92 ${isMobile ? "px-4 py-4" : "px-4 py-4 sm:px-6 lg:px-8"}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="hidden items-center gap-4 lg:flex">
                                    <h1 className="text-[1.05rem] font-light italic text-white/96">
                                        Today&apos;s Topic
                                    </h1>
                                    <span className="rounded-full border border-[#39ff74]/40 bg-[#0db75b]/15 px-4 py-1 text-sm italic text-[#8dff9d]">
                                        live
                                    </span>
                                </div>

                                <h1 className={`${isMobile ? "text-[1.85rem] font-semibold tracking-tight" : "text-2xl font-semibold tracking-tight lg:hidden"}`}>
                                    Global Chat
                                </h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="hidden items-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-4 py-2.5 text-sm text-white/92 lg:flex"
                                >
                                    <img src={shareImage} alt="" className="h-4 w-4 object-contain" />
                                    Share
                                </button>

                                <button
                                    type="button"
                                    className="hidden items-center gap-2 rounded-2xl bg-[#a7dc9d] px-4 py-2.5 text-sm font-medium text-white lg:flex"
                                >
                                    <img src={searchImage} alt="" className="h-4 w-4 object-contain" />
                                    Share Discussion
                                </button>

                                <button
                                    type="button"
                                    className="rounded-full border border-white/15 bg-white/8 p-2 text-white/90 lg:hidden"
                                    aria-label="More options"
                                >
                                    <DotsIcon />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className={`border-b border-white/10 bg-[#0b5367]/95 ${isMobile ? "px-4 pb-4 pt-3" : "px-4 py-5 sm:px-6 lg:px-8"}`}>
                            <div className={`grid gap-5 ${isMobile ? "" : "lg:grid-cols-[minmax(0,1fr)_160px] lg:items-stretch"}`}>
                                <div>
                                    {!isMobile ? null : (
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/68">
                                            Today&apos;s topic
                                        </p>
                                    )}
                                    <h2 className={`${isMobile ? "text-[1.45rem] font-semibold leading-8" : "max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-[2.7rem]"}`}>
                                        How will you rate Dr. Linder at the end of the semester
                                    </h2>
                                    <p className={`max-w-4xl font-semibold italic text-white/90 ${isMobile ? "mt-2 text-[0.95rem] leading-6" : "mt-2 text-sm leading-6 sm:text-base"}`}>
                                        Drop your honest take. Share an experience, a story or a perspective. No DMs, just one shared room for everyone for the next 27 hours
                                    </p>
                                    <div className={`mt-4 flex flex-wrap items-center font-semibold text-white/92 ${isMobile ? "gap-2.5 text-xs" : "gap-4 text-sm"}`}>
                                        <span className={`rounded-full border border-[#39ff74]/35 bg-[#10b85c]/18 text-[#8fff9d] ${isMobile ? "px-3 py-1.5" : "px-4 py-2"}`}>
                                            24:14:08 left
                                        </span>
                                        <span>3.8K opinions</span>
                                        <span>6.8K participants</span>
                                    </div>
                                </div>

                                {!isMobile ? (
                                    <div className="overflow-hidden rounded-3xl border border-white/10 lg:rounded-[28px]">
                                        <img
                                            src={logoBanner}
                                            alt="Topic visual"
                                            className="h-36 w-full object-cover lg:h-full"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className={`border-b border-white/10 bg-[rgba(42,87,101,0.42)] ${isMobile ? "px-4 py-3" : "px-4 py-4 sm:px-6 lg:px-8"}`}>
                            {!isMobile ? (
                                <div className="hidden items-center gap-3 lg:flex">
                                    {filters.map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            className={`rounded-full px-6 py-2.5 text-sm ${
                                                filter === "All"
                                                    ? "bg-[#274855] text-white"
                                                    : "bg-[#2b4954]/92 text-white/84"
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}

                                    <label className="ml-auto flex max-w-[420px] flex-1 items-center gap-3 rounded-full bg-[#294954] px-5 py-2.5 text-white/68">
                                        <img src={searchImage} alt="" className="h-4 w-4 object-contain" />
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder="Search"
                                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/48"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/76">
                                        <span>Filter</span>
                                        <div className="flex flex-wrap gap-2">
                                            {filters.map((filter) => (
                                                <button
                                                    key={filter}
                                                    type="button"
                                                    className={`rounded-full px-3 py-1.5 text-[11px] ${
                                                        filter === "All"
                                                            ? "bg-[#274855] text-white"
                                                            : "bg-[#2b4954]/92 text-white/84"
                                                    }`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-full border border-white/12 bg-[#5d7f8e]/25 px-4 py-2.5 text-white/68">
                                        <img src={searchImage} alt="" className="h-4 w-4 object-contain opacity-80" />
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder="Search in this topic"
                                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/48"
                                        />
                                        <span className="text-sm text-white/35">x</span>
                                    </label>
                                </>
                            )}

                            <div className={`rounded-2xl border border-dashed border-white/18 bg-[rgba(17,61,74,0.56)] text-sm leading-6 text-white/82 ${isMobile ? "mt-3 px-3 py-2.5 text-[0.92rem]" : "mt-4 px-4 py-3"}`}>
                                <span className="text-[#00d5ff]">Welcome to Let&apos;s Talk.</span> Every topic runs for 27 hours. Replies are public, threaded, and reportable. Be kind; disagree with ideas, not people.
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(11,83,103,0.98),rgba(20,86,103,0.92))]">
                            <MessageList
                                messages={visibleMessages}
                                onOpenThread={openThread}
                                compact={isMobile}
                            />
                        </div>

                        <MessageInput
                            onSend={handleSendMessage}
                            recipientLabel="#global-room"
                            recipientType="chatroom"
                            compact={isMobile}
                        />

                        {isMobile ? <MobileBottomNav /> : null}
                    </div>
                </section>

                <aside className="hidden min-h-screen border-l border-white/10 bg-[#34363d]/96 lg:flex lg:flex-col">
                    <div className="border-b border-white/10 px-5 py-5">
                        <p className="text-xl font-medium text-white">Active Participants</p>
                        <p className="mt-1 text-sm text-white/56">71 people in this room</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="space-y-4">
                            {participants.map((name, index) => {
                                const initials =
                                    String.fromCharCode(65 + (index % 26)) +
                                    String.fromCharCode(68 + (index % 20));

                                return (
                                    <div
                                        key={`${name}-${index}`}
                                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/6"
                                    >
                                        <ParticipantAvatar label={initials} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-base leading-5 text-white">
                                                {name}
                                            </p>
                                            <p className="text-xs text-white/54">participant</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="rounded-lg bg-[#2ba05d] px-3 py-1.5 text-xs text-[#e3ffea]"
                                        >
                                            Follow
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            <MiniThreadPanel
                key={selectedThreadMessage?.id || "thread-panel"}
                message={selectedThreadMessage}
                thread={selectedThreadMessage ? threadsByMessageId[selectedThreadMessage.id] : null}
                onAddReply={handleAddThreadReply}
                onClose={() => setSelectedThreadMessage(null)}
            />
        </div>
    );
}
