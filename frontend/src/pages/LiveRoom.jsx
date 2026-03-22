import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Share2, X } from "lucide-react";
import Layout from "../components/Layout";
import TopicRoom from "./TopicRoom";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/use-mobile";
import { useGlobalTopic } from "../hooks/useQueries";
import AppLogo from "../asssets/AppLogo.png";
import desktopSplash from "../asssets/desktop_splash_screen.jpg";
import mobileSplash from "../asssets/mobile_splash_screen.jpg";

// Preload splash images for faster display
const splashImages = [desktopSplash, mobileSplash];
splashImages.forEach((src) => {
  const img = new Image();
  img.src = src;
});
import { ShareModalContent } from "../components/ShareScreen";
import { AnimatePresence } from "framer-motion";

function formatCount(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      if (!expiresAt) return;
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")} left`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span>{timeLeft}</span>;
}



function LiveRoomMobile({ topic, user }) {
  const [, setLocation] = useLocation();
  const [showShare, setShowShare] = useState(false);

  const handleShare = () => setShowShare(true);

  return (
    <Layout
      headerProps={{
        icon: <img src={AppLogo} alt="Let's Talk" className="w-6 h-6 object-contain rounded-md" />,
        title: "Let's Talk",
      }}
    >
      <div className="h-full flex flex-col relative w-full overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {showShare && topic && (
            <div
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowShare(false)}
            >
              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
                <ShareModalContent
                  url={globalThis.location.href}
                  topicTitle={topic?.title || "Let's Talk"}
                  topicDescription={topic?.description || "Join the conversation"}
                  onClose={() => setShowShare(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
        <div className="md:hidden flex-1 flex flex-col justify-center w-full pb-8">
          {topic ? (
            <div className="px-4 w-full max-w-sm mx-auto">
              <div className="bg-card/90 rounded-xl p-4 border border-border mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">Admin . Global</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,255,145,0.15)] text-white border border-[rgba(0,255,145,0.35)] shadow-[0_0_18px_rgba(0,255,145,0.25)] text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                    <span className="text-white">
                      <CountdownTimer expiresAt={topic?.expiresAt} />
                    </span>
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight mb-1">{topic?.title}</h2>
                <p className="text-gray-300 text-xs leading-snug mb-3">{topic?.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-300">
                  <span className="px-2 py-1 rounded-full bg-white/10">👥 {formatCount(topic?.participantCount || 0)} participants</span>
                  <span className="px-2 py-1 rounded-full bg-white/10">💬 {formatCount(topic?.messageCount || 0)} messages</span>
                </div>
              </div>
              <button
                onClick={() => setLocation(`/topic/${topic?._id}`)}
                className="w-full bg-linear-to-r from-primary to-accent text-primary-foreground font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg"
              >
                Join Live Discussion
              </button>
              <button
                onClick={handleShare}
                className="w-full mt-3 bg-linear-to-r from-[#25636e] to-[#5e7e86] text-white font-semibold py-2 rounded-xl shadow hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share this topic
              </button>
              <div className="mt-3 text-center text-gray-400 text-xs">
                The mobile view is simplified without the side participant panel.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <p className="text-gray-400 text-center mb-4">No active topics yet.</p>
              {user?.isAdmin && (
                <button
                  onClick={() => setLocation("/profile")}
                  className="bg-green-500 text-white px-6 py-2 rounded-full font-medium"
                >
                  Post a New Topic
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function LiveRoomDesktop({ topic }) {
  if (!topic) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background text-muted-foreground">
        No active topic.
      </div>
    );
  }
  // isLiveMode=true suppresses back button and uses live-mode header title
  return <TopicRoom topicId={topic?._id} isLiveMode={true} />;
}

export default function LiveRoom() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: topic = null, isLoading } = useGlobalTopic();

  if (isMobile === undefined) {
    const splashImage = desktopSplash;
    return (
      <div
        className="w-full h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${splashImage})`,
          backgroundColor: '#2C535F',
        }}
      />
    );
  }

  if (isLoading) {
    const splashImage = isMobile ? mobileSplash : desktopSplash;
    return (
      <div
        className="w-full h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${splashImage})`,
          backgroundColor: '#2C535F',
        }}
      />
    );
  }

  if (isMobile) {
    return <LiveRoomMobile topic={topic} user={user} />;
  }
  return <LiveRoomDesktop topic={topic} />;
}
