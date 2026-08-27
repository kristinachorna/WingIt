import { Expo } from 'expo-server-sdk';
import { query } from '../db/index.js';

const expo = new Expo();

// Looks up a user's push token and sends a notification if they have one.
// Silently does nothing if the user never registered a device (e.g. running
// in Expo Go without a dev build, or notifications not yet set up).
export async function sendPushToUser(userId, { title, body, data }) {
  const result = await query('SELECT push_token FROM users WHERE id = $1', [userId]);
  const token = result.rows[0]?.push_token;
  if (!token || !Expo.isExpoPushToken(token)) return;

  try {
    await expo.sendPushNotificationsAsync([{ to: token, sound: 'default', title, body, data }]);
  } catch (err) {
    // Never let a notification failure break the actual request (friend add, photo send)
    console.error('Push notification failed:', err.message);
  }
}
