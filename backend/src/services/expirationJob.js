import cron from 'node-cron';
import { purgeExpiredImages } from '../controllers/messagesController.js';

// Runs every 30 seconds — fine for a 10-second view window. In production,
// this could move to a cheaper interval or a dedicated worker process.
export function startExpirationJob() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await purgeExpiredImages();
    } catch (err) {
      console.error('Expiration job failed:', err);
    }
  });
}
