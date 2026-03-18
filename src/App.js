import { Routes, Route } from 'react-router-dom';
import Profile from './screens/Profile';
import { NotificationFeed } from './screens/Notificationfeed';
import Settings from './screens/Settings';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/notifications" element={<NotificationFeed />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;