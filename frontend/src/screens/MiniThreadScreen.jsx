import ThreadTree from "../components/thread/ThreadTree";
import MobileBottomNav from "../components/mobile/MobileBottomNav";
import useIsMobileView from "../hooks/useIsMobileView";

const threadData = [
    {
        id: 1,
        user: "Kojo",
        text: "This is the main thread message.",
        replies: [
            {
                id: 2,
                user: "Ama",
                text: "This is a first-level reply.",
                replies: [
                    {
                        id: 3,
                        user: "Yaw",
                        text: "This is a second-level reply.",
                        replies: [
                            {
                                id: 4,
                                user: "Esi",
                                text: "This is a third-level reply.",
                                replies: [
                                    {
                                        id: 5,
                                        user: "Kofi",
                                        text: "This is a fourth-level reply.",
                                        replies: [],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                id: 6,
                user: "Abena",
                text: "Another first-level reply.",
                replies: [],
            },
        ],
    },
];

export default function MiniThreadScreen() {
    const isMobile = useIsMobileView();

    return (
        <div className="app-shell min-h-screen text-white">
            <div className={`mx-auto min-h-screen ${isMobile ? "flex max-w-md flex-col" : "px-4 py-6 sm:px-6"}`}>
                {isMobile ? (
                    <>
                        <header className="border-b border-white/10 bg-[#1f677c]/92 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-white/58">
                                        Your Threads
                                    </p>
                                    <h1 className="mt-1 text-[1.7rem] font-semibold tracking-tight">
                                        Mini Thread
                                    </h1>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/82"
                                >
                                    Edit
                                </button>
                            </div>
                        </header>

                        <div className="border-b border-white/10 bg-[rgba(42,87,101,0.46)] px-4 py-4">
                            <div className="rounded-[24px] border border-dashed border-white/18 bg-[rgba(255,255,255,0.04)] px-4 py-4">
                                <p className="text-[1.05rem] leading-8 text-white">
                                    Welcome. Every topic runs for 27 hours. Replies are public, thread and reportable. Be kind; disagree with ideas and not people.
                                </p>
                                <p className="mt-2 text-sm text-white/54">
                                    Welcome. Every topic runs for 27 hours. Replies are public and reportable.
                                </p>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                            <ThreadTree nodes={threadData} compact />
                        </div>

                        <MobileBottomNav />
                    </>
                ) : (
                    <div className="glass-panel screen-noise mx-auto max-w-4xl rounded-[28px] p-6">
                        <h1 className="mb-6 text-xl font-semibold text-accent-purple">
                            Mini Thread Screen
                        </h1>

                        <ThreadTree nodes={threadData} />
                    </div>
                )}
            </div>
        </div>
    );
}
