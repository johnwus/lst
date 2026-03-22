import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import Layout, { useOverlay } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useCreateTopic, useUpdateProfile, useUserProfile, useFollowingStatus, useFollowUser } from '../hooks/useQueries';
import { useToast } from '../hooks/use-toast';
import CreateTopicModal from '../components/CreateTopicModal';
import { getBackDestination } from '../lib/navigation';
import { getAvatarColor } from '../components/Avatar';
import { UserPen, ShieldCheck, LifeBuoy, UserCircle2, ChevronDown, ChevronUp, Mail, ExternalLink, Lock, Eye, Database, Bell, BellOff, Moon, Settings, LogOut, Info, Volume2, VolumeX } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const { user: currentUser, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/profile/:userId');
  const userId = params?.userId;
  const isViewingOther = !!userId && userId !== currentUser?._id;
  
  const { data: otherUserProfile, isLoading: isLoadingOtherUser } = useUserProfile(userId, {
    enabled: isViewingOther
  });

  const [isPushLoading, setIsPushLoading] = useState(false);

  const handleTogglePush = async () => {
    if (isPushLoading || isViewingOther) return;
    setIsPushLoading(true);
    try {
      const newStatus = !currentUser.pushNotifications;
      await api.put('/auth/me', { pushNotifications: newStatus });
      updateUser({ ...currentUser, pushNotifications: newStatus });
      toast({
        title: newStatus ? 'Notifications Enabled' : 'Notifications Disabled',
        description: newStatus ? "You'll now receive alerts even when away." : "We'll keep things quiet for now.",
      });
    } catch (err) {
      toast({
        title: 'Error updating settings',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsPushLoading(false);
    }
  };
  
  // Following status for other users
  const { data: followingStatus } = useFollowingStatus(userId, {
    enabled: isViewingOther
  });
  const followUserMutation = useFollowUser();
  
  // Determine which user to display
  const displayUser = isViewingOther ? otherUserProfile : currentUser;
  const isFollowing = followingStatus?.isFollowing ?? false;
  
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ displayName: currentUser?.displayName || '', bio: currentUser?.bio || '' });
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  // Mutations
  const updateProfileMutation = useUpdateProfile();
  const createTopicMutation = useCreateTopic();
  
  const handleFollowToggle = async () => {
    if (!userId) return;
    try {
      await followUserMutation.mutateAsync(userId);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to follow user",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfileMutation.mutateAsync(form);
      updateUser(updated);
      setEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated!",
        variant: "success"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const { isOverlayEnabled, setIsOverlayEnabled } = useOverlay();

  const handleToggleOverlay = () => {
    setIsOverlayEnabled((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/auth');
  };

  const handleCreateTopic = async (formData) => {
    try {
      const topic = await createTopicMutation.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Topic created!",
        variant: "success"
      });
      setLocation(`/topic/${topic._id}`);
    } catch (err) {
      throw err;
    }
  };

  const handleToggleSound = async () => {
    try {
      const newStatus = !currentUser?.soundNotifications;
      await api.patch('/users/settings/sound-enabled', { enabled: newStatus });
      updateUser({ ...currentUser, soundNotifications: newStatus });
    } catch (err) {
      console.error('[Profile] Failed to toggle sound:', err);
      toast({
        title: 'Error updating settings',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Show loading while fetching other user's profile
  if (isViewingOther && isLoadingOtherUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm mt-3">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!displayUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <UserCircle2 className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Sign in to view your profile</h2>
          <button onClick={() => setLocation('/auth')} className="bg-gradient-to-r from-purple-600 to-green-500 text-white px-6 py-2.5 rounded-full font-medium mt-4">
            Sign In
          </button>
        </div>
      </Layout>
    );
  }

  const avatarInitials = displayUser.avatarInitials || displayUser.username?.slice(0, 2).toUpperCase() || 'YO';
  const profileTitle = isViewingOther ? `@${displayUser.username}'s Profile` : 'Your Profile';

  const profileIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const followBtn = isViewingOther && (
    <button
      onClick={handleFollowToggle}
      disabled={followUserMutation.isPending}
      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
        isFollowing 
          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
          : 'bg-purple-600 text-white hover:bg-purple-500'
      }`}
    >
      {followUserMutation.isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );

  return (
    <Layout
      headerProps={{
        icon: profileIcon,
        title: profileTitle,
        rightElement: followBtn,
        showBack: isViewingOther,
        onBack: () => {
          const dest = getBackDestination();
          if (dest && dest !== '/') {
            setLocation(dest);
          } else {
            window.history.back();
          }
        },
      }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-4 max-w-lg mx-auto w-full flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="bg-[#1e3d3d]/60 rounded-2xl p-6 border border-white/5 mb-4 text-center flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl mb-3 relative"
              style={{ 
                background: `linear-gradient(135deg, ${getAvatarColor(displayUser)}, ${getAvatarColor(displayUser)}aa)` 
              }}
            >
              {avatarInitials}
              {!isViewingOther && <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1e3d3d]" />}
            </div>

            {!isViewingOther && editMode ? (
              <div className="space-y-3 mt-2 text-left">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1 px-1">Display Name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400"
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1 px-1">Bio <span className="text-gray-600">— tell people a little about yourself</span></label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 160) }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400 resize-none"
                    placeholder="Share something about yourself… (max 160 chars)"
                  />
                  <div className="text-right text-[10px] text-gray-500 mt-0.5 pr-1">{form.bio.length}/160</div>
                </div>
                <div className="flex gap-2 justify-center mt-2">
                  <button onClick={() => setEditMode(false)} className="px-4 py-1.5 text-sm text-gray-400 border border-white/10 rounded-lg hover:bg-white/5">Cancel</button>
                  <button onClick={handleSave} disabled={updateProfileMutation.isPending} className="px-4 py-1.5 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-60">
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-white font-bold text-lg">{displayUser.displayName || displayUser.username}</div>
                <div className="text-gray-400 text-sm">@{displayUser.username}</div>
                {displayUser.bio ? (
                  <div className="text-gray-400 text-sm mt-2 leading-relaxed">{displayUser.bio}</div>
                ) : !isViewingOther ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-purple-400/60 text-xs mt-2 hover:text-purple-400 transition-colors border border-dashed border-purple-400/20 rounded-lg px-3 py-1.5 hover:border-purple-400/40"
                  >
                    + Add a bio
                  </button>
                ) : null}
              </>
            )}

            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/10">
              <div>
                <div className="text-white font-bold text-xl">{(displayUser.commentCount || 0).toLocaleString()}</div>
                <div className="text-gray-400 text-xs mt-0.5">comments</div>
              </div>
              <div>
                <div className="text-white font-bold text-xl">{(displayUser.followingCount || 0).toLocaleString()}</div>
                <div className="text-gray-400 text-xs mt-0.5">following</div>
              </div>
              <div>
                <div className="text-white font-bold text-xl">{(displayUser.followersCount || 0).toLocaleString()}</div>
                <div className="text-gray-400 text-xs mt-0.5">followers</div>
              </div>
            </div>
          </div>

          {/* Only show these sections when viewing own profile */}
          {!isViewingOther && (
            <>
              {displayUser.isAdmin && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-gray-400 mb-1 px-1">ADMIN PANEL</div>
                  <button
                    onClick={() => {
                      setShowNewTopic(true);
                    }}
                    className="w-full bg-[#1e3d3d]/60 rounded-xl p-3.5 border border-white/5 hover:border-white/15 text-left flex items-center gap-3 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-white font-medium">Post New Global Topic</span>
                  </button>
                </div>
              )}

              {!isViewingOther && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-gray-400 mb-1 px-1">PREFERENCES</div>
                  <div className="bg-[#1e3d3d]/60 rounded-xl border border-white/5 divide-y divide-white/5">
                    {/* Push Notifications Toggle */}
                    <button
                      onClick={handleTogglePush}
                      disabled={isPushLoading}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors"
                    >
                      {currentUser?.pushNotifications ? (
                        <Bell className="w-[18px] h-[18px] text-green-400 flex-shrink-0" />
                      ) : (
                        <BellOff className="w-[18px] h-[18px] text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-gray-300 text-sm font-medium">Push Notifications</div>
                        <div className="text-gray-500 text-[10px]">
                          {currentUser?.pushNotifications ? 'Enabled (Browser alerts allowed)' : 'Disabled (No background alerts)'}
                        </div>
                      </div>
                      <div className={`w-10 h-5.5 rounded-full transition-all duration-300 relative flex items-center px-1 ${currentUser?.pushNotifications ? 'bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 ${currentUser?.pushNotifications ? 'translate-x-4.5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    {/* Dark Mode Overlay Toggle */}
                    <button
                      onClick={handleToggleOverlay}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors"
                    >
                      <Moon className={`w-[18px] h-[18px] flex-shrink-0 ${isOverlayEnabled ? 'text-blue-400' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="text-gray-300 text-sm font-medium">Enhanced Dark Mode</div>
                        <div className="text-gray-500 text-[10px]">
                          {isOverlayEnabled ? 'Overlay active for better contrast' : 'Standard dark interface'}
                        </div>
                      </div>
                      <div className={`w-10 h-5.5 rounded-full transition-all duration-300 relative flex items-center px-1 ${isOverlayEnabled ? 'bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 ${isOverlayEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    {/* Sound Toggle */}
                    <button
                      onClick={handleToggleSound}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors"
                    >
                      {currentUser?.soundNotifications ? (
                        <Volume2 className="w-[18px] h-[18px] text-purple-400 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-[18px] h-[18px] text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-gray-300 text-sm font-medium">Notification Sounds</div>
                        <div className="text-gray-500 text-[10px]">
                          {currentUser?.soundNotifications ? 'Enabled (Alerts & Messages)' : 'Muted (No audio alerts)'}
                        </div>
                      </div>
                      <div className={`w-10 h-5.5 rounded-full transition-all duration-300 relative flex items-center px-1 ${currentUser?.soundNotifications ? 'bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 ${currentUser?.soundNotifications ? 'translate-x-4.5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 mb-1 px-1">ACCOUNT</div>
                <div className="bg-[#1e3d3d]/60 rounded-xl border border-white/5 divide-y divide-white/5">
                  {/* Edit Profile */}
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors group"
                  >
                    <UserPen className="w-[18px] h-[18px] text-amber-500/80 group-hover:text-amber-400 flex-shrink-0 transition-colors" />
                    <span className="text-gray-300 flex-1 text-sm font-medium">Edit Profile</span>
                    <span className="text-gray-500 group-hover:text-gray-400 transition-colors">›</span>
                  </button>

                  {/* Privacy & Security */}
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors group"
                    >
                      <ShieldCheck className="w-[18px] h-[18px] text-indigo-500/80 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                      <span className="text-gray-300 flex-1 text-sm font-medium">Privacy &amp; Security</span>
                      {expandedSection === 'privacy' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    {expandedSection === 'privacy' && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                        <p className="text-gray-400 text-xs pt-3 leading-relaxed">Your data is stored securely and never sold to third parties. Let's Talk only collects data necessary to provide the service.</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 py-2">
                            <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div>
                              <div className="text-white text-xs font-medium">End-to-end messages</div>
                              <div className="text-gray-500 text-[11px]">Thread replies are stored securely</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 py-2">
                            <Eye className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div>
                              <div className="text-white text-xs font-medium">Profile visibility</div>
                              <div className="text-gray-500 text-[11px]">Your profile is visible to all users</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 py-2">
                            <Database className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div>
                              <div className="text-white text-xs font-medium">Data retention</div>
                              <div className="text-gray-500 text-[11px]">Topics expire after 27 hours; threads are preserved</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Help & Support */}
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'help' ? null : 'help')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors group"
                    >
                      <LifeBuoy className="w-[18px] h-[18px] text-emerald-500/80 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                      <span className="text-gray-300 flex-1 text-sm font-medium">Help &amp; Support</span>
                      {expandedSection === 'help' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    {expandedSection === 'help' && (
                      <div className="px-4 pb-4 space-y-1 border-t border-white/5">
                        <p className="text-gray-400 text-xs pt-3 pb-2 leading-relaxed">Need help? Reach out to us or browse our resources.</p>
                        <a
                          href="mailto:support@letstalk.app"
                          className="flex items-center gap-3 py-2.5 text-gray-300 hover:text-white transition-colors"
                        >
                          <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium">Email Support</div>
                            <div className="text-gray-500 text-[11px]">support@letstalk.app</div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-600 ml-auto" />
                        </a>
                        <div className="flex items-center gap-3 py-2.5">
                          <LifeBuoy className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <div className="text-white text-xs font-medium">Community Guidelines</div>
                            <div className="text-gray-500 text-[11px]">Be kind. Disagree with ideas, not people.</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 py-2.5">
                          <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <div className="text-white text-xs font-medium">Report a Problem</div>
                            <div className="text-gray-500 text-[11px]">Use the flag icon on any message to report</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 text-red-400/80 font-bold hover:text-red-400 transition-colors group"
              >
                <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>

      <CreateTopicModal 
        isOpen={showNewTopic} 
        onClose={() => setShowNewTopic(false)} 
        onCreate={handleCreateTopic}
        isAdmin={currentUser?.isAdmin}
      />
    </Layout>
  );
}
