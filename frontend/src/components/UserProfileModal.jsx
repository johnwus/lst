import { useEffect, useState } from 'react';
import { useFollowUser, useFollowingStatus, useUserProfile } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { X, UserCheck, UserPlus, MessageCircle, Users, Heart } from 'lucide-react';

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 text-gray-500" />
        <span className="text-white font-bold text-base">{value?.toLocaleString() ?? 0}</span>
      </div>
      <span className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded-full w-32" />
          <div className="h-3 bg-white/5 rounded-full w-20" />
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded-full w-3/4" />
      <div className="h-3 bg-white/5 rounded-full w-1/2" />
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-white/10 rounded-xl" />
    </div>
  );
}

export default function UserProfileModal({ userId, onClose, onFollowChange }) {
  const { user: me } = useAuth();
  const { data: profile, isLoading } = useUserProfile(userId);
  const { data: followStatus } = useFollowingStatus(userId);
  const followMutation = useFollowUser();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (followStatus) setIsFollowing(followStatus.isFollowing);
  }, [followStatus]);

  const handleFollow = async () => {
    if (!userId || !me || userId === me.id) return;
    try {
      const result = await followMutation.mutateAsync(userId);
      if (result?.following !== undefined) {
        setIsFollowing(result.following);
        onFollowChange?.(result.following, userId);
      }
    } catch (_) {
      // silent
    }
  };

  if (!userId) return null;

  const initials = profile?.avatarInitials
    || profile?.username?.slice(0, 2).toUpperCase()
    || '??';

  const isOwnProfile = me && profile?.id === me.id;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-[#0d2424] border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* Banner gradient */}
            <div
              className="h-20 w-full relative"
              style={{
                background: `linear-gradient(135deg, ${profile?.avatarColor || '#6366f1'}, ${profile?.avatarColor ? profile.avatarColor + '88' : '#8b5cf688'})`,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 pb-5">
              {/* Avatar — overlaps banner */}
              <div className="relative -mt-8 mb-3 flex items-end gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl ring-4 ring-[#0d2424] flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${profile?.avatarColor || '#6366f1'}, ${profile?.avatarColor ? profile.avatarColor + 'aa' : '#8b5cf6aa'})`,
                  }}
                >
                  {initials}
                </div>
                {profile?.isAdmin && (
                  <span className="mb-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>

              {/* Name & handle */}
              <div className="mb-3">
                <div className="text-white font-bold text-lg leading-tight">
                  {profile?.displayName || profile?.username || 'User'}
                </div>
                <div className="text-gray-400 text-sm">@{profile?.username || 'unknown'}</div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4 border-l-2 border-white/10 pl-3">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-around py-3 mb-4 bg-white/[0.03] rounded-xl border border-white/5">
                <StatCard value={profile?.commentCount} label="Posts" icon={MessageCircle} />
                <div className="w-px h-8 bg-white/10" />
                <StatCard value={profile?.followingCount} label="Following" icon={Users} />
                <div className="w-px h-8 bg-white/10" />
                <StatCard value={profile?.followersCount} label="Followers" icon={Heart} />
              </div>

              {/* Follow button — only shown when viewing someone else */}
              {me && !isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    isFollowing
                      ? 'bg-white/8 text-white border border-white/15 hover:bg-white/12'
                      : 'bg-gradient-to-r from-[#4fd165] to-[#7be495] text-white shadow-lg shadow-emerald-500/20 hover:opacity-90'
                  }`}
                >
                  {followMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <><UserCheck className="w-4 h-4" /> Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
