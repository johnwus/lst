import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

// ── Mock data generator (100 topics) ─────────────────────────────────────────
const CATEGORIES = ["Society", "Tech", "Culture", "Money"];
const CATEGORY_COLORS = {
    Society: "#ff6b35",
    Tech:    "#08d6ff",
    Culture: "#c939ff",
    Money:   "#ffd600",
};

const TRENDING_TITLES = [
    "Is AI going to replace software engineers within the next 5 years?",
    "Should student loans be fully forgiven by the government?",
    "Does streaming culture kill the art of the album?",
    "Crypto or index funds — where would you put $10K right now?",
    "How will you rate Dr. Linder at the end of the semester?",
    "Is hustle culture romanticized too much on social media?",
    "What is the most underrated programming language right now?",
    "Best decade for hip-hop music — make your case.",
    "Will remote work become the global standard by 2030?",
    "Should social media platforms be regulated like utilities?",
    "Is a college degree still worth it in 2025?",
    "Gen Z vs Millennials — who's reshaping the economy more?",
    "Should voting be mandatory in democratic countries?",
    "Is the 4-day work week practical at scale?",
    "Does cancel culture do more harm than good?",
    "Are electric vehicles actually better for the environment?",
    "Should billionaires exist?",
    "Is universal basic income a solution or a band-aid?",
    "Should coding be a mandatory subject in high school?",
    "Does social media cause more mental health harm than good?",
];

function generateTopics(count, prefix) {
    return Array.from({ length: count }, (_, i) => {
        const cat = CATEGORIES[i % CATEGORIES.length];
        const title = TRENDING_TITLES[i % TRENDING_TITLES.length];
        const opinions = Math.floor(Math.random() * 14000) + 200;
        const participants = Math.floor(opinions * (1.4 + Math.random() * 0.8));
        const hoursLeft = Math.floor(Math.random() * 24) + 1;
        const minsLeft = Math.floor(Math.random() * 60);
        const secsLeft = Math.floor(Math.random() * 60);
        return {
            id: `${prefix}-${i}`,
            title,
            category: cat,
            color: CATEGORY_COLORS[cat],
            opinions,
            participants,
            timeLeft: `${String(hoursLeft).padStart(2, "0")}:${String(minsLeft).padStart(2, "0")}:${String(secsLeft).padStart(2, "0")}`,
            trending: opinions > 5000,
        };
    });
}

const TRENDING_TOPICS  = generateTopics(100, "trend");
const YOUR_FEED_TOPICS = generateTopics(100, "feed");

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}

// ── Virtual list ──────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 148; // px — fixed row height enables simple virtual scroll
const OVERSCAN    = 4;   // extra rows above/below viewport

function useVirtualList(items, containerRef) {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(600);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        setViewportHeight(el.clientHeight);

        const onScroll = () => setScrollTop(el.scrollTop);
        const onResize = () => setViewportHeight(el.clientHeight);

        el.addEventListener("scroll", onScroll, { passive: true });
        const ro = new ResizeObserver(onResize);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", onScroll);
            ro.disconnect();
        };
    }, [containerRef]);

    return useMemo(() => {
        const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
        const visible  = Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2;
        const endIdx   = Math.min(items.length, startIdx + visible);

        return {
            totalHeight:   items.length * ITEM_HEIGHT,
            offsetY:       startIdx * ITEM_HEIGHT,
            visibleItems:  items.slice(startIdx, endIdx),
            startIdx,
        };
    }, [items, scrollTop, viewportHeight]);
}

// ── Topic card (fixed height = ITEM_HEIGHT) ────────────────────────────────
function TopicCard({ topic }) {
    return (
        <div
            className="group cursor-pointer rounded-2xl border border-white/8 bg-[#161616] p-4 transition hover:border-white/16 hover:bg-[#1c1c1c]"
            style={{ height: ITEM_HEIGHT - 12 }} // 12px gap
        >
            <div className="flex items-center justify-between mb-2">
                <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: `${topic.color}22`, color: topic.color }}
                >
                    {topic.category}
                </span>
                {topic.trending && (
                    <span className="rounded-full bg-[#ff4d1c]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#ff7043]">
                        TRENDING
                    </span>
                )}
            </div>

            <p className="mb-3 text-sm font-semibold leading-5 text-white/88 line-clamp-2 group-hover:text-white">
                {topic.title}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/48">
                <span>{fmt(topic.opinions)} opinions</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{fmt(topic.participants)} participants</span>
                <span className="ml-auto rounded-full border border-[#39ff74]/25 bg-[#10b85c]/12 px-2 py-0.5 text-[#8fff9d]">
                    {topic.timeLeft} left
                </span>
            </div>
        </div>
    );
}

// ── Virtualized feed list ─────────────────────────────────────────────────────
function VirtualFeed({ items }) {
    const containerRef = useRef(null);
    const { totalHeight, offsetY, visibleItems } = useVirtualList(items, containerRef);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]"
        >
            {/* Total height spacer so the scrollbar reflects all items */}
            <div style={{ height: totalHeight, position: "relative" }}>
                <div style={{ transform: `translateY(${offsetY}px)` }} className="space-y-3 px-4 py-1">
                    {visibleItems.map((topic) => (
                        <TopicCard key={topic.id} topic={topic} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Live dot ──────────────────────────────────────────────────────────────────
function LiveDot() {
    return (
        <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4444] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff4444]" />
        </span>
    );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function Tabs({ active, onChange }) {
    return (
        <div className="flex gap-1 px-4 pt-3 pb-0">
            {["Trending", "Your Feed"].map((tab) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(tab)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
                        active === tab
                            ? "text-white bg-[#161616]"
                            : "text-white/45 hover:text-white/70"
                    }`}
                >
                    {tab}
                    {active === tab && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#39ff74]" />
                    )}
                </button>
            ))}
        </div>
    );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
    return (
        <div className="px-4 pt-3 pb-3 border-b border-white/6">
            <label className="flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] px-3 text-white/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="h-4 w-4 shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search live topics…"
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/36"
                />
                {value && (
                    <button type="button" onClick={() => onChange("")}
                        className="text-white/30 hover:text-white/60 text-sm">
                        ✕
                    </button>
                )}
            </label>
        </div>
    );
}

// ── Category filter pills ─────────────────────────────────────────────────────
function CategoryPills({ active, onChange }) {
    const filters = ["All", ...CATEGORIES];
    return (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-white/6">
            {filters.map((f) => (
                <button
                    key={f}
                    type="button"
                    onClick={() => onChange(f)}
                    className={`h-7 shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors ${
                        active === f
                            ? "bg-[#39ff74]/15 text-[#39ff74] border border-[#39ff74]/30"
                            : "bg-white/6 text-white/58 hover:bg-white/10 hover:text-white/80"
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
    );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ count }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/36 border-b border-white/6">
            <span>{count} live topics</span>
            <span className="ml-auto flex items-center gap-1.5 text-white/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="h-3.5 w-3.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
                <span>32.4K active</span>
            </span>
        </div>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const [activeTab, setActiveTab]         = useState("Trending");
    const [search, setSearch]               = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const baseTopics = activeTab === "Trending" ? TRENDING_TOPICS : YOUR_FEED_TOPICS;

    const filteredTopics = useMemo(() => {
        const q = search.trim().toLowerCase();
        return baseTopics.filter((t) => {
            const catOk = activeCategory === "All" || t.category === activeCategory;
            const searchOk = !q || t.title.toLowerCase().includes(q);
            return catOk && searchOk;
        });
    }, [baseTopics, search, activeCategory]);

    // Reset category when switching tabs
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setSearch("");
        setActiveCategory("All");
    }, []);

    return (
        <AppShell>
            <div className="flex flex-col h-full bg-[#0D0D0D]">
                {/* ── Header ── */}
                <header className="shrink-0 px-4 pt-5 pb-0 border-b border-white/6">
                    <div className="flex items-center gap-2.5 mb-3">
                        <LiveDot />
                        <h1 className="text-xl font-bold tracking-tight text-white">LIVE TOPICS</h1>
                        <span className="ml-auto rounded-full bg-[#ff4444]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#ff7777] border border-[#ff4444]/20">
                            LIVE
                        </span>
                    </div>
                    <Tabs active={activeTab} onChange={handleTabChange} />
                </header>

                {/* ── Controls ── */}
                <div className="shrink-0 bg-[#0D0D0D]">
                    <SearchBar value={search} onChange={setSearch} />
                    <CategoryPills active={activeCategory} onChange={setActiveCategory} />
                    <StatsBar count={filteredTopics.length} />
                </div>

                {/* ── Virtualized feed ── */}
                {filteredTopics.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                        <p className="text-white/40 text-sm">No topics match your search.</p>
                        <button type="button" onClick={() => { setSearch(""); setActiveCategory("All"); }}
                            className="mt-3 text-xs text-[#39ff74]/70 hover:text-[#39ff74]">
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <VirtualFeed items={filteredTopics} />
                )}
            </div>
        </AppShell>
    );
}
