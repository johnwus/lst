import logoBanner from "../../assets/lets-talk-banner-speech-bubble-with-lets-talk-text-business-concept-3d-illustration-spiral-background-vector-line-icon-business_727385-3416.jpg";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function AuthLayout({
    title,
    children,
    footer,
    onSubmit,
    buttonLabel,
    buttonType = "button",
    onButtonClick,
    eyebrow = "Welcome back",
    mobileDescription = "Join the live room, keep up with threads, and move through conversations built for quick mobile reading.",
}) {
    const isMobile = useIsMobileView();

    return (
        <div className="auth-backdrop flex min-h-screen items-center justify-center px-4 py-8 text-white">
            <div
                className={`w-full overflow-hidden border border-white/12 bg-[#0f2430]/78 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${isMobile
                        ? "max-w-md rounded-[34px]"
                        : "grid max-w-5xl rounded-[32px] lg:grid-cols-[1.05fr_0.95fr]"
                    }`}
            >
                <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 px-10 py-12 lg:flex">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,210,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(187,76,255,0.16),transparent_28%)]" />
                    <div className="relative z-10">
                        <div className="mb-8 flex items-center gap-4">
                            <img
                                src={logoBanner}
                                alt="Let's Talk logo"
                                className="h-[54px] w-[54px] rounded-[18px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                            />
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                    Group 2 Interface
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                    Meaningful conversations,
                                    <br />
                                    redesigned for focus.
                                </h2>
                            </div>
                        </div>

                        <div className="glass-panel screen-noise rounded-[28px] p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm font-semibold text-white/80">
                                    Live room preview
                                </p>
                                <span className="rounded-full bg-[#21492d] px-3 py-1 text-xs text-[#7df06a]">
                                    live
                                </span>
                            </div>
                            <div className="rounded-[24px] bg-[#0b202a]/90 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                                            Today&apos;s topic
                                        </p>
                                        <p className="mt-2 max-w-sm text-xl font-semibold leading-tight">
                                            How do we keep public discussions thoughtful in fast-moving spaces?
                                        </p>
                                    </div>
                                    <div className="gradient-card flex h-16 w-16 items-center justify-center rounded-2xl text-2xl">
                                        Q
                                    </div>
                                </div>
                                <p className="text-sm leading-6 text-white/65">
                                    Join global threads, Explore active topics, and Move between live discussion and personal updates in one calm workspace.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={isMobile ? "px-5 py-6 sm:px-6" : "px-6 py-8 sm:px-10 sm:py-10"}>
                    <div className={`mb-8 ${isMobile ? "" : "flex items-center gap-4 lg:hidden"}`}>
                        {isMobile ? (
                            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,86,103,0.96),rgba(14,51,64,0.96))]">
                                <div className="flex items-center gap-3 px-4 pb-4 pt-5">
                                    <img
                                        src={logoBanner}
                                        alt="Let's Talk logo"
                                        className="h-[52px] w-[52px] rounded-[16px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-[0.32em] text-white/58">
                                            Group 2 Interface
                                        </p>
                                        <h2 className="mt-2 text-[1.7rem] font-semibold leading-9 tracking-tight">
                                            {title}
                                        </h2>
                                    </div>
                                </div>
                                <div className="border-t border-white/8 bg-[rgba(10,29,37,0.24)] px-4 py-3">
                                    <p className="text-sm leading-6 text-white/68">
                                        {mobileDescription}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={logoBanner}
                                    alt="Let's Talk logo"
                                    className="h-[54px] w-[54px] rounded-[18px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                                />
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                                        Group 2 Interface
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                                        {title}
                                    </h2>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mb-8 hidden lg:block">
                        <div className="mb-4 flex items-center gap-4">
                            <img
                                src={logoBanner}
                                alt="Let's Talk logo"
                                className="h-[54px] w-[54px] rounded-[18px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                            />
                            <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                                {eyebrow}
                            </p>
                        </div>
                        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                            {title}
                        </h1>
                    </div>

                    <form
                        onSubmit={onSubmit}
                        className={`glass-soft rounded-[28px] ${isMobile ? "p-4" : "p-5 sm:p-6"
                            }`}
                    >
                        <div className="space-y-4">{children}</div>

                        <button
                            type={buttonType}
                            onClick={onButtonClick}
                            className="mt-6 w-full rounded-2xl bg-[linear-gradient(135deg,#1fd2ff,#bb4cff)] px-4 py-3.5 font-semibold text-white shadow-[0_16px_36px_rgba(125,93,255,0.28)] transition hover:opacity-95"
                        >
                            {buttonLabel}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-white/62">{footer}</p>
                </div>
            </div>
        </div>
    );
}
