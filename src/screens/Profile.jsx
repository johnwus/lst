import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const DEFAULT_AVATAR_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef2ff"/>
          <stop offset="1" stop-color="#e0e7ff"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#g)"/>
      <circle cx="48" cy="38" r="14" fill="#818cf8"/>
      <path d="M20 84c6-16 20-24 28-24s22 8 28 24" fill="#6366f1"/>
    </svg>`
  );

function Stat({ label, value }) {
  return (
    <div className="profileStat">
      <div className="profileStatValue">{value}</div>
      <div className="profileStatLabel">{label}</div>
    </div>
  );
}

function SidebarIcon({ variant }) {
  return <span className={`profileSbIcon profileSbIcon--${variant}`} aria-hidden="true" />;
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? 'profileSbItem profileSbItemActive' : 'profileSbItem'}
      onClick={onClick}
    >
      <SidebarIcon variant={icon} />
      <span className="profileSbItemLabel">{label}</span>
      <span className="profileSbDot" aria-hidden="true" />
    </button>
  );
}

function SettingRow({ icon, label, right }) {
  return (
    <div className="settingRow">
      <div className="settingRowLeft">
        <span className={`settingIcon settingIcon--${icon}`} aria-hidden="true" />
        <span className="settingLabel">{label}</span>
      </div>
      <div className="settingRight">{right}</div>
    </div>
  );
}

function SettingButtonRow({ icon, label, right, onClick }) {
  return (
    <button type="button" className="settingRow settingRowBtn" onClick={onClick}>
      <div className="settingRowLeft">
        <span className={`settingIcon settingIcon--${icon}`} aria-hidden="true" />
        <span className="settingLabel">{label}</span>
      </div>
      <div className="settingRight">{right}</div>
    </button>
  );
}

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      className={checked ? 'toggle toggleOn' : 'toggle'}
      aria-pressed={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
    >
      <span className="toggleKnob" aria-hidden="true" />
    </button>
  );
}

export default function Profile() {
  const [username, setUsername] = useState('christ_user');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_DATA_URL);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState('christ_user');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(DEFAULT_AVATAR_DATA_URL);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicCategory, setNewTopicCategory] = useState('Society');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContext, setNewTopicContext] = useState('');
  const [newTopicMedia, setNewTopicMedia] = useState('none');

  const draftObjectUrlRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function openNewTopicModal() {
    setShowTopicModal(true);
  }

  function closeNewTopicModal() {
    setShowTopicModal(false);
  }

  function publishNewTopic() {
    if (!newTopicTitle.trim()) {
      window.alert('Topic title is required.');
      return;
    }

    const topic = {
      id: Date.now().toString(),
      category: newTopicCategory,
      title: newTopicTitle.trim(),
      context: newTopicContext.trim(),
      media: newTopicMedia,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('exploreTopics') || '[]');
    existing.unshift(topic);
    localStorage.setItem('exploreTopics', JSON.stringify(existing));

    setNewTopicTitle('');
    setNewTopicContext('');
    setNewTopicMedia('none');
    setNewTopicCategory('Society');
    setShowTopicModal(false);

    // Send to the "live" view by refreshing the explore list (no dedicated live page).
    setShowTopicModal(false);
  }

  function onPickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);

    if (draftObjectUrlRef.current) {
      URL.revokeObjectURL(draftObjectUrlRef.current);
    }
    draftObjectUrlRef.current = nextUrl;
    setDraftAvatarUrl(nextUrl);
  }

  const isDirty = draftUsername !== username || draftAvatarUrl !== avatarUrl;

  function startEditing() {
    setDraftUsername(username);
    setDraftAvatarUrl(avatarUrl);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (isDirty) {
      const discard = window.confirm('Discard your unsaved changes?');
      if (!discard) return;
    }

    if (draftObjectUrlRef.current) {
      URL.revokeObjectURL(draftObjectUrlRef.current);
      draftObjectUrlRef.current = null;
    }
    setDraftUsername(username);
    setDraftAvatarUrl(avatarUrl);
    setIsEditing(false);
  }

  function saveEditing() {
    if (!isDirty) {
      setIsEditing(false);
      return;
    }

    const ok = window.confirm('Save changes to your profile?');
    if (!ok) return;

    const cleaned = draftUsername.trim().replace(/^@+/, '');
    if (!cleaned) {
      window.alert('Username cannot be empty.');
      return;
    }

    setUsername(cleaned);
    setAvatarUrl(draftAvatarUrl);

    // If the draft avatar URL was a blob URL, it's now the saved one.
    draftObjectUrlRef.current = null;

    setIsEditing(false);
  }

  return (
    <div className="profileShell">
      <aside className="profileSidebar" aria-label="Primary navigation">
        <div className="profileSbTop">
          <div className="profileSbBrand" aria-hidden="true" />
        </div>

        <nav className="profileSbNav">
          <SidebarItem icon="live" label="Live Room" />
          <SidebarItem icon="explore" label="Explore" />
          <SidebarItem icon="threads" label="Your Threads" />
          <SidebarItem
            icon="notif"
            label="Notification"
            onClick={() => navigate('/notifications')}
          />
        </nav>

        <div className="profileSbSection">
          <div className="profileSbSectionTitle">CATEGORIES</div>
          <div className="profileSbCats">
            <button type="button" className="profileCat">
              <span className="profileCatDot profileCatDot--society" aria-hidden="true" />
              Society
            </button>
            <button type="button" className="profileCat">
              <span className="profileCatDot profileCatDot--tech" aria-hidden="true" />
              Tech
            </button>
            <button type="button" className="profileCat">
              <span className="profileCatDot profileCatDot--culture" aria-hidden="true" />
              Culture
            </button>
            <button type="button" className="profileCat">
              <span className="profileCatDot profileCatDot--money" aria-hidden="true" />
              Money
            </button>
          </div>
        </div>

        <div className="profileSbBottom">
          <button
            type="button"
            className="profileMe"
            onClick={() => navigate('/settings')}
            aria-label="Go to settings"
          >
            <div className="profileMeAvatar" aria-hidden="true">
              Y
            </div>
            <div className="profileMeText">
              <div className="profileMeTitle">
                YOU
                <span className="profileMeIcon" aria-hidden="true">⚙</span>
              </div>
              <div className="profileMeHandle">@{username}</div>
            </div>
          </button>
        </div>
      </aside>

      <main className="profileMain">
        <header className="profileTopbar">
          <div className="profileTopbarTitle">
            <span className="profileTopbarIcon" aria-hidden="true" />
            Your Profile
          </div>
          {isEditing ? (
            <div className="profileEditActions">
              <button
                type="button"
                className="profileEditBtn profileEditBtnGhost"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profileEditBtn"
                onClick={saveEditing}
                disabled={!isDirty}
              >
                Save
              </button>
            </div>
          ) : null}
        </header>

        <div className="profileContent">
          <section className="profileHeroCard" aria-label="Profile summary">
            <div className="profileHeroAvatar">
              <img
                className="avatarImg"
                src={isEditing ? draftAvatarUrl : avatarUrl}
                alt="Profile avatar"
              />
              <span className="profileOnlineDot" aria-hidden="true" />
              {isEditing ? (
                <button
                  type="button"
                  className="avatarEditBtn"
                  onClick={openFilePicker}
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  ✎
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                className="avatarFileInput"
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
              />
            </div>

            {isEditing ? (
              <label className="profileEditField">
                <span className="profileEditLabel">Username</span>
                <input
                  className="profileEditInput"
                  value={draftUsername}
                  onChange={(e) => setDraftUsername(e.target.value)}
                  placeholder="your_username"
                />
              </label>
            ) : (
              <div className="profileHeroHandle">@{username}</div>
            )}
            <div className="profileHeroTagline">
              joining conversations, one topic at a time
            </div>

            <div className="statsBar statsBarHero" role="group" aria-label="Profile stats">
              <Stat label="Followers" value={0} />
              <div className="statsDivider" aria-hidden="true" />
              <Stat label="Replies" value={0} />
              <div className="statsDivider" aria-hidden="true" />
              <Stat label="Following" value={0} />
            </div>
          </section>

          <section className="settingsBlock" aria-label="Admin Panel">
            <div className="blockTitle">ADMIN PANEL</div>
            <div className="settingsCard">
              <SettingButtonRow
                icon="bell"
                label="Post New Global Topic"
                right={<span className="chev" aria-hidden="true">›</span>}
                onClick={openNewTopicModal}
              />
            </div>
          </section>

          <section className="settingsBlock" aria-label="Preferences">
            <div className="blockTitle">PREFERENCES</div>
            <div className="settingsCard">
              <SettingRow
                icon="bell"
                label="Push Notification"
                right={
                  <Toggle
                    checked={pushEnabled}
                    onChange={setPushEnabled}
                    ariaLabel="Toggle push notifications"
                  />
                }
              />
            </div>
          </section>

          <section className="settingsBlock" aria-label="Account">
            <div className="blockTitle">ACCOUNT</div>
            <div className="settingsCard">
              <SettingButtonRow
                icon="user"
                label="Edit Profile"
                right={<span className="chev" aria-hidden="true">›</span>}
                onClick={() => {
                  if (isEditing) {
                    if (isDirty) {
                      const saveNow = window.confirm(
                        'You have unsaved changes. Save them now?'
                      );
                      if (saveNow) {
                        saveEditing();
                      } else {
                        cancelEditing();
                      }
                      return;
                    }
                    setIsEditing(false);
                    return;
                  }
                  startEditing();
                }}
              />
              <div className="settingsDividerRow" aria-hidden="true" />
              <SettingButtonRow
                icon="shield"
                label="Privacy & Security"
                right={<span className="chev" aria-hidden="true">›</span>}
                onClick={() => {
                  // Clickable placeholder (no action)
                }}
              />
              <div className="settingsDividerRow" aria-hidden="true" />
              <SettingButtonRow
                icon="help"
                label="Help & Support"
                right={<span className="chev" aria-hidden="true">›</span>}
                onClick={() => {
                  // Clickable placeholder (no action)
                }}
              />
            </div>
          </section>

          {/* Small sign-out text button at the bottom-right */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm('Are you sure you want to sign out?');
                if (confirmed) {
                  window.close();
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#e5e7eb',
                fontSize: '12px',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                opacity: 0.85,
              }}
            >
              Sign out
            </button>
          </div>

          {showTopicModal ? (
            <div className="modalOverlay" role="dialog" aria-modal="true">
              <div className="modalCard">
                <div className="modalHeader">
                  <div className="modalTitle">New Explore Topic</div>
                  <button
                    type="button"
                    className="modalClose"
                    aria-label="Close"
                    onClick={closeNewTopicModal}
                  >
                    ×
                  </button>
                </div>

                <div className="modalBody">
                  <div className="modalSection">
                    <div className="modalSectionTitle">Category</div>
                    <div className="modalOptions">
                      {['Society', 'Tech', 'Lifestyle', 'Education', 'Entertainment', 'Culture'].map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={
                              newTopicCategory === cat
                                ? 'modalOption modalOptionActive'
                                : 'modalOption'
                            }
                            onClick={() => setNewTopicCategory(cat)}
                          >
                            {cat}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="modalSection">
                    <label className="modalLabel">Topic Question/Title</label>
                    <input
                      className="modalInput"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="e.g. What's your favorite way to..."
                    />
                  </div>

                  <div className="modalSection">
                    <label className="modalLabel">Context</label>
                    <textarea
                      className="modalTextarea"
                      value={newTopicContext}
                      onChange={(e) => setNewTopicContext(e.target.value)}
                      placeholder="Add more details or a prompt."
                      rows={3}
                    />
                  </div>

                  <div className="modalSection">
                    <div className="modalSectionTitle">Media</div>
                    <div className="modalOptions">
                      {['image', 'video', 'none'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            newTopicMedia === option
                              ? 'modalOption modalOptionActive'
                              : 'modalOption'
                          }
                          onClick={() => setNewTopicMedia(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="modalActions">
                    <button
                      type="button"
                      className="modalBtn modalBtnGhost"
                      onClick={closeNewTopicModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="modalBtn modalBtnPrimary"
                      onClick={publishNewTopic}
                    >
                      Publish to explore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
