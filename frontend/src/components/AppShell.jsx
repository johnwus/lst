import { NavLink } from "react-router-dom";
import logoBanner from "../assets/AppLogo.jpg";
import liveRoomIcon from "../assets/chat.png";
import searchIcon from "../assets/search.png";
import threadsIcon from "../assets/threads.png";
import notificationIcon from "../assets/bell.png";

// ── Inline SVG icons ────────────────────────────────────────────────────────
function HomeIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
            <path d="M9 21V12h6v9" />
        </svg>
    );
}

// ── Nav config ───────────────────────────────────────────────────────────────
const SIDEBAR_LINKS = [
    { to: "/home", label: "Home", renderIcon: (cls) => <HomeIcon className={cls} /> },
    { to: "/chat", label: "Live Room", img: liveRoomIcon },
    { to: "/explore", label: "Explore", img: searchIcon },
    { to: "/threads", label: "Threads", img: threadsIcon, disabled: true },
    { to: "/notifications", label: "Notifications", img: notificationIcon, disabled: true },
];

const BOTTOM_NAV_LINKS = [
    { to: "/home", label: "Home", renderIcon: (cls) => <HomeIcon className={cls} /> },
    { to: "/chat", label: "Live Room", img: liveRoomIcon, dot: true },
    { to: "/explore", label: "Explore", img: searchIcon },
    { to: "/threads", label: "Threads", img: threadsIcon, disabled: true },
    { to: "/notifications", label: "Notifications", img: notificationIcon, disabled: true },
];

const ICON_FILTER =
    "[filter:brightness(0)_saturate(100%)_invert(100%)] opacity-60 group-[.active]:opacity-100";
const ICON_FILTER_ACCENT =
    "[filter:brightness(0)_saturate(100%)_invert(39%)_sepia(82%)_saturate(2807%)_hue-rotate(255deg)_brightness(103%)_contrast(101%)]";

// ── Sidebar ──────────────────────────────────────────────────────────────────
function DesktopSidebar() {
    const currentUser = localStorage.getItem("user") || "You";

    return (
        <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen border-r border-white/8 bg-[#111111]"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-white/8">
                <img src={logoBanner} alt="Let's Talk"
                    className="h-9 w-9 rounded-xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.4)]" />
                <span className="text-sm font-semibold tracking-tight text-white/90">Let's Talk</span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {SIDEBAR_LINKS.map((link) => {
                    if (link.disabled) {
                        return (
                            <div key={link.label}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/28 cursor-not-allowed select-none">
                                {link.renderIcon ? link.renderIcon("h-5 w-5 opacity-30") : (
                                    <img src={link.img} alt="" className="h-5 w-5 object-contain opacity-25" />
                                )}
                                <span>{link.label}</span>
                            </div>
                        );
                    }
                    return (
                        <NavLink key={link.label} to={link.to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive
                                    ? "active bg-[#1a1a1a] text-white font-medium"
                                    : "text-white/60 hover:bg-white/5 hover:text-white/90"}`
                            }>
                            {({ isActive }) => (
                                <>
                                    {link.renderIcon ? (
                                        link.renderIcon(`h-5 w-5 ${isActive ? "text-[#39ff74]" : "text-white/50"}`)
                                    ) : (
                                        <img src={link.img} alt=""
                                            className={`h-5 w-5 object-contain ${isActive ? ICON_FILTER_ACCENT : ICON_FILTER}`} />
                                    )}
                                    <span>{link.label}</span>
                                    {link.dot && (
                                        <span className="ml-auto h-2 w-2 rounded-full bg-[#39ff74] shadow-[0_0_6px_rgba(57,255,116,0.8)]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User profile */}
            <div className="px-3 py-4 border-t border-white/8"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
                <button type="button"
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#08d6ff,#2968ff)] text-sm font-semibold text-white">
                        {currentUser.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/90">{currentUser}</p>
                        <p className="truncate text-[11px] text-white/40">Signed in</p>
                    </div>
                </button>
            </div>
        </aside>
    );
}

// ── Mobile Bottom Nav (56 px) ────────────────────────────────────────────────
function MobileNav() {
    return (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#111111] border-t border-white/8"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="flex items-center h-14">
                {BOTTOM_NAV_LINKS.map((link) => {
                    if (link.disabled) {
                        return (
                            <div key={link.label}
                                className="flex flex-1 flex-col items-center justify-center gap-0.5 h-14 text-white/22 cursor-not-allowed select-none">
                                {link.renderIcon ? link.renderIcon("h-5 w-5 opacity-25") : (
                                    <img src={link.img} alt="" className="h-5 w-5 object-contain opacity-20" />
                                )}
                                <span className="text-[9px]">{link.label}</span>
                            </div>
                        );
                    }
                    return (
                        <NavLink key={link.label} to={link.to}
                            className={({ isActive }) =>
                                `flex flex-1 flex-col items-center justify-center gap-0.5 h-14 transition-colors ${isActive ? "text-white" : "text-white/50 hover:text-white/80"}`
                            }>
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        {link.renderIcon ? (
                                            link.renderIcon(`h-5 w-5 ${isActive ? "text-[#39ff74]" : ""}`)
                                        ) : (
                                            <img src={link.img} alt=""
                                                className={`h-5 w-5 object-contain ${isActive ? ICON_FILTER_ACCENT : ICON_FILTER}`} />
                                        )}
                                        {link.dot && (
                                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#39ff74] shadow-[0_0_6px_rgba(57,255,116,0.8)]" />
                                        )}
                                    </div>
                                    <span className="text-[9px] font-medium leading-none">{link.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}

// ── Shell ────────────────────────────────────────────────────────────────────
export default function AppShell({ children }) {
    return (
        <div className="flex min-h-screen bg-[#0D0D0D] text-white"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <DesktopSidebar />

            {/* Main content area */}
            <main className="flex-1 min-w-0 flex flex-col
                pb-14 lg:pb-0
                h-screen overflow-hidden">
                {children}
            </main>

            <MobileNav />
        </div>
    );
}
