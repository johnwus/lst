export const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#d946ef', // Fuchsia
  '#a855f7', // Purple
];

export function getAvatarColor(user) {
  const str = user?.username || user?.displayName || user?.id || 'user';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function Avatar({ user, size = 36, className = '', onClick }) {
  const initials = user?.avatarInitials || user?.username?.slice(0, 2).toUpperCase() || '??';
  const color = getAvatarColor(user);
  const px = size;

  const avatarContent = (
    <>
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={initials}
          style={{ width: px, height: px, minWidth: px, minHeight: px }}
          className={`rounded-full object-cover ${className}`}
        />
      ) : (
        <div
          style={{ width: px, height: px, minWidth: px, minHeight: px, background: color }}
          className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
        >
          <span style={{ fontSize: Math.floor(px * 0.38) }}>{initials}</span>
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`rounded-full transition-opacity hover:opacity-80 ${className}`}
        style={{ padding: 0, border: 'none', background: 'transparent' }}
      >
        {avatarContent}
      </button>
    );
  }

  return avatarContent;
}
