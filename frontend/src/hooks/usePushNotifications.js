import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook to manage Web Push notification registration
 */
export function usePushNotifications() {
  const { user, token } = useAuth();

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      // 1. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push] Service Worker registered');

      // 2. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Notification permission denied');
        return;
      }

      // 3. Get VAPID public key from server
      if (!token) {
        console.warn('[Push] No auth token available');
        return;
      }
      
      const { data: { publicKey } } = await axios.get(`${API_URL}/users/settings/push-public-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!publicKey) {
        console.error('[Push] Failed to get public key');
        return;
      }

      // 4. Subscribe to Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 5. Send subscription to server
      await axios.post(`${API_URL}/users/settings/push-subscription`, 
        { subscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('[Push] Successfully subscribed to Web Push');
    } catch (err) {
      console.error('[Push] Registration error:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Register push when user logs in or app starts with user
      registerPush();
    }
  }, [user, registerPush]);

  return { registerPush };
}
