import { useMemo, useRef, useState } from 'react';
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

function ActivityRow({ title, meta }) {
  return (
    <div className="activityRow" role="listitem">
      <div className="activityRowTitle">{title}</div>
      {meta ? <div className="activityRowMeta">{meta}</div> : null}
    </div>
  );
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState('created');
  const [username, setUsername] = useState('christ_user');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_DATA_URL);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftUsername, setDraftUsername] = useState('christ_user');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(DEFAULT_AVATAR_DATA_URL);
  const draftObjectUrlRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const topicsCreated = useMemo(() => [], []);
  const topicsParticipated = useMemo(() => [], []);

  const activity = activeTab === 'created' ? topicsCreated : topicsParticipated;
  const emptyLabel = activeTab === 'created' ? 'created' : 'participated in';

  function openFilePicker() {
    fileInputRef.current?.click();
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
          <div className="profileMe">
            <div className="profileMeAvatar" aria-hidden="true">
              Y
            </div>
            <div className="profileMeText">
              <div className="profileMeTitle">YOU</div>
              <div className="profileMeHandle">@{username}</div>
            </div>
          </div>
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

          <section className="activitySection activitySectionTight">
            <div className="activityHeader">
              <div className="activityHeading">MY ACTIVITY</div>
              <div className="activityTabs" role="tablist" aria-label="My activity">
                <button
                  type="button"
                  role="tab"
                  className={activeTab === 'created' ? 'tabBtn tabBtnActive' : 'tabBtn'}
                  aria-selected={activeTab === 'created'}
                  onClick={() => setActiveTab('created')}
                >
                  Created
                </button>
                <button
                  type="button"
                  role="tab"
                  className={
                    activeTab === 'participated' ? 'tabBtn tabBtnActive' : 'tabBtn'
                  }
                  aria-selected={activeTab === 'participated'}
                  onClick={() => setActiveTab('participated')}
                >
                  Participated
                </button>
              </div>
            </div>

            <div className="activityList" role="list">
              {activity.length === 0 ? (
                <div className="activityEmpty">No topics {emptyLabel} yet.</div>
              ) : (
                activity.map((row) => (
                  <ActivityRow key={row.id} title={row.title} meta={row.meta} />
                ))
              )}
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
        </div>
      </main>
    </div>
  );
}
