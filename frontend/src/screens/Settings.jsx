import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '../components/mobile/MobileBottomNav';
import useIsMobileView from '../hooks/useIsMobileView';
import './Settings.css';

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
  const navigate = useNavigate();
  const isMobile = useIsMobileView();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);

  return (
    <div className="settingsShell" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
      <header className="settingsTopbar">
        <button
          type="button"
          className="settingsBackBtn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <div className="settingsTopbarTitle">Settings</div>
      </header>

      <main className="settingsMain">
        <section className="settingsBlock">
          <div className="blockTitle">PREFERENCES</div>
          <div className="settingsCard">
            <div className="settingRow">
              <div className="settingRowLeft">
                <span className="settingIcon settingIcon--bell" aria-hidden="true" />
                <span className="settingLabel">Push Notifications</span>
              </div>
              <Toggle
                checked={pushNotifications}
                onChange={setPushNotifications}
                ariaLabel="Toggle push notifications"
              />
            </div>
            <div className="settingsDividerRow" aria-hidden="true" />
            <div className="settingRow">
              <div className="settingRowLeft">
                <span className="settingIcon settingIcon--bell" aria-hidden="true" />
                <span className="settingLabel">Real-time Alerts</span>
              </div>
              <Toggle
                checked={realTimeAlerts}
                onChange={setRealTimeAlerts}
                ariaLabel="Toggle real-time alerts"
              />
            </div>
            <div className="settingsDividerRow" aria-hidden="true" />
            <div className="settingRow">
              <div className="settingRowLeft">
                <span className="settingIcon settingIcon--bell" aria-hidden="true" />
                <span className="settingLabel">Sound Effects</span>
              </div>
              <Toggle
                checked={soundEffects}
                onChange={setSoundEffects}
                ariaLabel="Toggle sound effects"
              />
            </div>
          </div>
        </section>

        <section className="settingsBlock">
          <div className="blockTitle">ACCOUNT MANAGEMENT</div>
          <div className="settingsCard">
            <button
              type="button"
              className="settingRow settingRowBtn"
              onClick={() => {}}
            >
              <div className="settingRowLeft">
                <span className="settingIcon settingIcon--shield" aria-hidden="true" />
                <span className="settingLabel">Change Password</span>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </button>
            <div className="settingsDividerRow" aria-hidden="true" />
            <button
              type="button"
              className="settingRow settingRowBtn"
              onClick={() => {}}
            >
              <div className="settingRowLeft">
                <span className="settingIcon settingIcon--shield" aria-hidden="true" />
                <span className="settingLabel">Data Privacy</span>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          </div>
        </section>
      </main>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}