import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

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

export default function Settings() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="settingsShell">
      <header className="settingsTopbar">
        <button
          type="button"
          className="settingsBackBtn"
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <div className="settingsTopbarTitle">Settings</div>
      </header>

      <main className="settingsMain">
        <section className="settingsBlock" aria-label="Preferences">
          <div className="blockTitle">PREFERENCES</div>
          <div className="settingsCard">
            <SettingRow
              icon="bell"
              label="Push Notifications"
              right={
                <Toggle
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                  ariaLabel="Toggle push notifications"
                />
              }
            />
            <div className="settingsDividerRow" aria-hidden="true" />
            <SettingRow
              icon="alert"
              label="Real-time Alerts"
              right={
                <Toggle
                  checked={realTimeAlerts}
                  onChange={setRealTimeAlerts}
                  ariaLabel="Toggle real-time alerts"
                />
              }
            />
            <div className="settingsDividerRow" aria-hidden="true" />
            <SettingRow
              icon="sound"
              label="Sound Effects"
              right={
                <Toggle
                  checked={soundEffects}
                  onChange={setSoundEffects}
                  ariaLabel="Toggle sound effects"
                />
              }
            />
          </div>
        </section>

        <section className="settingsBlock" aria-label="Account Management">
          <div className="blockTitle">ACCOUNT MANAGEMENT</div>
          <div className="settingsCard">
            <SettingButtonRow
              icon="lock"
              label="Change Password"
              right={<span className="chev" aria-hidden="true">›</span>}
              onClick={() => {
                // Placeholder for change password
              }}
            />
            <div className="settingsDividerRow" aria-hidden="true" />
            <SettingButtonRow
              icon="shield"
              label="Data Privacy"
              right={<span className="chev" aria-hidden="true">›</span>}
              onClick={() => {
                // Placeholder for data privacy
              }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}