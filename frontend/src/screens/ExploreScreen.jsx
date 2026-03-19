import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileBottomNav from "../components/mobile/MobileBottomNav";
import useIsMobileView from "../hooks/useIsMobileView";
import logoBanner from "../assets/AppLogo.jpg";
import searchImage from "../assets/search.png";
import liveRoomIcon from "../assets/chat.png";
import threadsIcon from "../assets/threads.png";
import notificationIcon from "../assets/bell.png";
import societyIcon from "../assets/pngtree-blue-globe-colours-east-sphere-photo-image_1463369.jpg";
import techIcon from "../assets/robot-head-illustration-vector.jpg";
import cultureIcon from "../assets/pngtree-cinemas-clapper-in-flat-style-on-white-background-png-image_4933608.png";
import moneyIcon from "../assets/money-wings-flying-symbol-cartoon-illustration-vector.jpg";
import arrowLeft from "../assets/arrow-left.png";

const desktopNavItems = [
    { label: "Live Room", icon: liveRoomIcon },
    { label: "Explore", active: true, icon: searchImage },
    { label: "Your Threads", icon: threadsIcon },
    { label: "Notification", icon: notificationIcon, dot: true },
];

const categories = [
    { icon: societyIcon, label: "Society" },
    { icon: techIcon, label: "Tech" },
    { icon: cultureIcon, label: "Culture" },
    { icon: moneyIcon, label: "Money" },
];

const categoryFilters = ["All", "Society", "Tech", "Culture", "Money"];

const MOCK_EXPLOSIVE_TOPICS = [
    {
        id: "exp-1",
        title: "How will you rate Dr. Linder at the end of the semester?",
        category: "Society",
        opinions: 3800,
        participants: 6800,
        timeLeft: "24:14:08",
        color: "#ff6b35",
    },
    {
        id: "exp-2",
        title: "Is AI going to replace software engineers within the next 5 years?",
        category: "Tech",
        opinions: 5200,
        participants: 9100,
        timeLeft: "11:42:00",
        color: "#ff3b6e",
    },
    {
        id: "exp-3",
        title: "Does streaming culture kill the art of the album?",
        category: "Culture",
        opinions: 2100,
        participants: 4300,
        timeLeft: "18:09:33",
        color: "#c939ff",
    },
    {
        id: "exp-4",
        title: "Should student loans be fully forgiven by the government?",
        category: "Society",
        opinions: 7700,
        participants: 12500,
        timeLeft: "03:55:14",
        color: "#ff6b35",
    },
];

const MOCK_NEW_TOPICS = [
    {
        id: "new-1",
        title: "What is the most underrated programming language right now?",
        category: "Tech",
        opinions: 14,
        participants: 38,
        timeLeft: "26:51:00",
        color: "#08d6ff",
    },
    {
        id: "new-2",
        title: "Is hustle culture romanticized too much on social media?",
        category: "Society",
        opinions: 7,
        participants: 22,
        timeLeft: "26:58:12",
        color: "#39ff74",
    },
    {
        id: "new-3",
        title: "Best decade for hip-hop music — make your case.",
        category: "Culture",
        opinions: 31,
        participants: 67,
        timeLeft: "26:44:40",
        color: "#c939ff",
    },
    {
        id: "new-4",
        title: "Crypto or index funds — where would you put $10K right now?",
        category: "Money",
        opinions: 5,
        participants: 19,
        timeLeft: "26:59:01",
        color: "#ffd600",
    },
];

function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}

function AssetIcon({ src, alt, className = "" }) {
    return <img src={src} alt={alt} className={className} />;
}

function TopicCardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-white/8 bg-[#1a4a5a]/60 p-4">
            <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-16 rounded-full bg-white/10" />
            </div>
            <div className="mb-2 h-4 w-4/5 rounded bg-white/10" />
            <div className="mb-4 h-4 w-3/5 rounded bg-white/10" />
            <div className="flex gap-4">
                <div className="h-3 w-20 rounded-full bg-white/10" />
                <div className="h-3 w-20 rounded-full bg-white/10" />
            </div>
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/14 bg-[#1a4a5a]/30 px-6 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-white/30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
            </div>
            <p className="text-sm font-medium text-white/50">No {label} topics yet</p>
            <p className="mt-1 text-xs text-white/30">Check back soon — this section fills up fast.</p>
        </div>
    );
}

function TopicCard({ topic, variant }) {
    const isExplosive = variant === "explosive";

    return (
        <div className="group cursor-pointer rounded-2xl border border-white/8 bg-[#1a4a5a]/60 p-4 transition hover:border-white/18 hover:bg-[#1f5570]/70">
            <div className="mb-2.5 flex items-center justify-between">
                <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: `${topic.color}22`, color: topic.color }}
                >
                    {topic.category}
                </span>
                {isExplosive && (
                    <span className="rounded-full bg-[#ff4d1c]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#ff7043]">
                        TRENDING
                    </span>
                )}
            </div>

            <p className="mb-3 text-sm font-semibold leading-5 text-white/92 line-clamp-2 group-hover:text-white">
                {topic.title}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/52">
                <span>{formatCount(topic.opinions)} opinions</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{formatCount(topic.participants)} participants</span>
                <span className="ml-auto rounded-full border border-[#39ff74]/25 bg-[#10b85c]/12 px-2 py-0.5 text-[#8fff9d]">
                    {topic.timeLeft} left
                </span>
            </div>
        </div>
    );
}

function SectionHeader({ title, count, accentColor, accentBg }) {
    return (
        <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
            {count !== null && (
                <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: accentBg, color: accentColor }}
                >
                    {count}
                </span>
            )}
            <div className="ml-auto h-px flex-1 bg-white/8" />
        </div>
    );
}

function TopicSection({ title, topics, variant, loading, accentColor, accentBg }) {
    const skeletonCount = 3;

    return (
        <section>
            <SectionHeader
                title={title}
                count={loading ? null : topics.length}
                accentColor={accentColor}
                accentBg={accentBg}
            />
            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: skeletonCount }).map((_, i) => (
                        <TopicCardSkeleton key={i} />
                    ))}
                </div>
            ) : topics.length === 0 ? (
                <EmptyState label={title.toLowerCase()} />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {topics.map((topic) => (
                        <TopicCard key={topic.id} topic={topic} variant={variant} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function ExploreScreen() {
    const isMobile = useIsMobileView();
    const navigate = useNavigate();
    const currentUser = localStorage.getItem("user") || "You";

    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [explosiveTopics, setExplosiveTopics] = useState([]);
    const [newTopics, setNewTopics] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExplosiveTopics(MOCK_EXPLOSIVE_TOPICS);
            setNewTopics(MOCK_NEW_TOPICS);
            setLoading(false);
        }, 1400);
        return () => clearTimeout(timer);
    }, []);

    const filterTopics = (topics) => {
        return topics.filter((topic) => {
            const matchesCategory =
                activeCategory === "All" || topic.category === activeCategory;
            const normalizedSearch = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !normalizedSearch || topic.title.toLowerCase().includes(normalizedSearch);
            return matchesCategory && matchesSearch;
        });
    };

    const filteredExplosive = filterTopics(explosiveTopics);
    const filteredNew = filterTopics(newTopics);

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#1b6478_0%,#0c5568_34%,#0a4e61_100%)] text-white">
            <div
                className={`mx-auto min-h-screen max-w-[1540px] px-0 ${
                    isMobile
                        ? "flex flex-col"
                        : "lg:grid lg:grid-cols-[128px_minmax(0,1fr)_280px]"
                }`}
            >
                {/* Desktop sidebar */}
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
                                onClick={() => {
                                    if (item.label === "Live Room") navigate("/chat");
                                }}
                                className="relative flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center text-[11px] text-white/86 transition hover:bg-white/6"
                            >
                                {item.active ? (
                                    <span className="absolute left-0 top-3 h-12 w-1 rounded-full bg-[#39ff74]" />
                                ) : null}
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
                                    onClick={() => setActiveCategory(category.label)}
                                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-white/6 ${
                                        activeCategory === category.label
                                            ? "text-white"
                                            : "text-white/84"
                                    }`}
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

                {/* Main content */}
                <section className="flex min-h-screen min-w-0 flex-col">
                    {/* Header */}
                    <header
                        className={`border-b border-white/10 bg-[#1f677c]/92 ${
                            isMobile ? "px-4 py-4" : "px-4 py-4 sm:px-6 lg:px-8"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {isMobile && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/chat")}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8"
                                    aria-label="Back"
                                >
                                    <img src={arrowLeft} alt="" className="h-4 w-4 object-contain invert" />
                                </button>
                            )}
                            <div>
                                <h1
                                    className={`font-semibold tracking-tight ${
                                        isMobile ? "text-[1.85rem]" : "text-2xl"
                                    }`}
                                >
                                    Explore
                                </h1>
                                {!isMobile && (
                                    <p className="mt-0.5 text-sm text-white/58">
                                        Discover what the world is talking about
                                    </p>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Search + filters */}
                    <div
                        className={`border-b border-white/10 bg-[rgba(42,87,101,0.42)] ${
                            isMobile ? "px-4 py-3" : "px-4 py-4 sm:px-6 lg:px-8"
                        }`}
                    >
                        <label className="flex h-12 items-center gap-3 rounded-[8px] border border-white/12 bg-[#1A1A1A] px-4 text-white/68">
                            <img
                                src={searchImage}
                                alt=""
                                className="h-4 w-4 shrink-0 object-contain opacity-80"
                            />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search topics..."
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/48"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="text-sm text-white/35 hover:text-white/70"
                                >
                                    x
                                </button>
                            )}
                        </label>

                        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {categoryFilters.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`h-8 shrink-0 rounded-full px-4 text-xs transition ${
                                        activeCategory === cat
                                            ? "bg-[#274855] text-white"
                                            : "bg-[#2b4954]/92 text-white/84 hover:bg-[#274855]/80"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topic sections */}
                    <div
                        className={`flex-1 space-y-8 overflow-y-auto bg-[linear-gradient(180deg,rgba(11,83,103,0.98),rgba(20,86,103,0.92))] ${
                            isMobile ? "px-4 py-5 pb-24" : "px-4 py-6 sm:px-6 lg:px-8"
                        }`}
                    >
                        <TopicSection
                            title="Explosive"
                            topics={filteredExplosive}
                            variant="explosive"
                            loading={loading}
                            accentColor="#ff7043"
                            accentBg="rgba(255,112,67,0.15)"
                        />

                        <TopicSection
                            title="New"
                            topics={filteredNew}
                            variant="new"
                            loading={loading}
                            accentColor="#08d6ff"
                            accentBg="rgba(8,214,255,0.12)"
                        />
                    </div>

                    {isMobile && <MobileBottomNav />}
                </section>

                {/* Desktop right sidebar */}
                <aside className="hidden min-h-screen border-l border-white/10 bg-[#34363d]/96 lg:flex lg:flex-col">
                    <div className="border-b border-white/10 px-5 py-5">
                        <p className="text-xl font-medium text-white">Trending Tags</p>
                        <p className="mt-1 text-sm text-white/56">Most active right now</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="space-y-2">
                            {[
                                { tag: "#education", count: "12.3K" },
                                { tag: "#tech", count: "9.1K" },
                                { tag: "#money", count: "7.8K" },
                                { tag: "#society", count: "6.4K" },
                                { tag: "#culture", count: "5.2K" },
                                { tag: "#ai", count: "4.9K" },
                                { tag: "#politics", count: "3.7K" },
                            ].map(({ tag, count }) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/6"
                                >
                                    <span className="text-sm text-white/84">{tag}</span>
                                    <span className="text-xs text-white/44">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
