import { Link, useLocation } from "react-router-dom";
import liveRoomIcon from "../../assets/chat.png";
import searchIcon from "../../assets/search.png";
import threadsIcon from "../../assets/threads.png";
import notificationIcon from "../../assets/bell.png";

const navItems = [
    { label: "Live Room", icon: liveRoomIcon, to: "/chat" },
    { label: "Explore", icon: searchIcon, to: "/explore" },
    { label: "Your Threads", icon: threadsIcon, disabled: true },
    { label: "Notification", icon: notificationIcon, disabled: true },
    { label: "Profile", disabled: true },
];

function ProfileOutlineIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="url(#profileGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <defs>
                <linearGradient id="profileGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff00b8" />
                    <stop offset="100%" stopColor="#6f63ff" />
                </linearGradient>
            </defs>
            <circle cx="12" cy="7.5" r="4.5" />
            <path d="M4.5 20c0-3.4 3.4-6.2 7.5-6.2s7.5 2.8 7.5 6.2" />
        </svg>
    );
}

function MobileNavButton({ item, active }) {
    const content = (
        <div
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
                active
                    ? "bg-white/4 text-white"
                    : "text-white/78"
            }`}
        >
            <div className="relative">
                {item.label === "Profile" ? (
                    <div className={active ? "opacity-100" : "opacity-90"}>
                        <ProfileOutlineIcon />
                    </div>
                ) : (
                    <img
                        src={item.icon}
                        alt=""
                        className={`h-6 w-6 object-contain [filter:brightness(0)_saturate(100%)_invert(39%)_sepia(82%)_saturate(2807%)_hue-rotate(255deg)_brightness(103%)_contrast(101%)] ${
                            active ? "opacity-100" : "opacity-90"
                        }`}
                    />
                )}
                {["Live Room", "Notification"].includes(item.label) ? (
                    <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-[#39ff74] shadow-[0_0_8px_rgba(57,255,116,0.7)]" />
                ) : null}
            </div>
            <span className="leading-3">{item.label}</span>
        </div>
    );

    if (item.disabled) {
        return (
            <button
                type="button"
                aria-disabled="true"
                className="flex-1"
            >
                {content}
            </button>
        );
    }

    return (
        <Link to={item.to} className="flex-1">
            {content}
        </Link>
    );
}

export default function MobileBottomNav() {
    const location = useLocation();
    const normalizedPath =
        location.pathname === "/chat"
            ? "Live Room"
            : location.pathname === "/explore"
            ? "Explore"
            : "";

    return (
        <nav className="mobile-nav sticky bottom-0 z-20 px-0 pb-[env(safe-area-inset-bottom,0px)] pt-0 lg:hidden">
            <div className="flex items-center gap-1 border-t border-white/8 bg-[#3a3a40] px-2 py-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.22)]">
                {navItems.map((item) => (
                    <MobileNavButton
                        key={item.label}
                        item={item}
                        active={item.label === normalizedPath}
                    />
                ))}
            </div>
        </nav>
    );
}
