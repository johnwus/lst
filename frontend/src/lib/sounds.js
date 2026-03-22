/**
 * Utility for playing notification sounds with optimized loading.
 */

// Proven-good notification sound (Mentions/Replies)
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
// Light, minimal 'bubble' pop for standard room messages
const MESSAGE_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

let notificationAudio = null;
let messageAudio = null;

/**
 * Initializes the audio objects.
 */
export const initNotificationSound = () => {
  if (!notificationAudio) {
    notificationAudio = new Audio(NOTIFICATION_SOUND_URL);
    notificationAudio.volume = 0.8;
    notificationAudio.load();
  }
  if (!messageAudio) {
    messageAudio = new Audio(MESSAGE_SOUND_URL);
    messageAudio.volume = 0.8; // Match notification volume
    messageAudio.load();
  }
};

/**
 * Plays the notification sound (mentions/replies).
 */
export const playNotificationSound = () => {
  if (!notificationAudio) initNotificationSound();
  playSound(notificationAudio);
};

export const playMessageSound = () => {
  if (!messageAudio) initNotificationSound();
  playSound(messageAudio);
};

const playSound = (audioObj) => {
  if (!audioObj) return;
  try {
    audioObj.currentTime = 0;
    const playPromise = audioObj.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => { /* Autoplay block is common */ });
    }
  } catch (err) {
    console.warn('[Sounds] Error:', err);
  }
};
