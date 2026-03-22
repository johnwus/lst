import Avatar from './Avatar';
import { useFollowingStatus, useFollowUser } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function ParticipantItem({ participant, onOpenProfile }) {
  const { user } = useAuth();
  const participantId = participant._id || participant.id;

  const { data: followStatus, isLoading: statusLoading } = useFollowingStatus(participantId, {
    enabled: !!user && participantId !== user.id
  });

  const followMutation = useFollowUser();

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (typeof followStatus?.isFollowing === 'boolean') {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  const handleFollow = async (e) => {
    e.stopPropagation();

    if (!user || participantId === user.id) return;

    try {
      const res = await followMutation.mutateAsync(participantId);

      // Optimistic UI update
      if (res?.following !== undefined) {
        setIsFollowing(res.following);
      } else {
        setIsFollowing(prev => !prev);
      }
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const isSelf = user && participantId === user.id;

  return (
    <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors">
      {/* Profile Click */}
      <button
        onClick={() => onOpenProfile?.(participant)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <Avatar user={participant} size={28} />

        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium truncate">
            {participant.displayName || participant.username}
          </div>
          <div className="text-gray-500 text-[10px] truncate">
            @{participant.username}
          </div>
        </div>
      </button>

      {/* Follow Button */}
      {!isSelf && user && (
        <button
          onClick={handleFollow}
          disabled={followMutation.isLoading || statusLoading}
          className={`text-[10px] rounded-full px-2.5 py-1 transition-all duration-150 ${
            isFollowing
              ? 'bg-gray-600 text-white hover:bg-gray-500'
              : 'bg-green-500 text-white hover:bg-green-400'
          } ${followMutation.isLoading ? 'opacity-50' : ''}`}
        >
          {followMutation.isLoading
            ? '...'
            : isFollowing
            ? 'Following'
            : 'Follow'}
        </button>
      )}
    </div>
  );
}