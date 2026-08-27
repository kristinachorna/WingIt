import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { saveImage, deleteImage, imageExists, readImage, generateReadToken, verifyReadToken } from '../services/storage.js';
import { recordInteraction } from '../services/streakService.js';
import { sendPushToUser } from '../services/pushService.js';

const DEFAULT_VIEW_SECONDS = 10;

async function getAcceptedFriendship(userA, userB) {
  const result = await query(
    `SELECT id, streak_days, stage FROM friendships
     WHERE status = 'accepted'
       AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))`,
    [userA, userB]
  );
  return result.rows[0] || null;
}

export async function sendPhoto(req, res) {
  const { recipient_id, caption, drawing_data, view_duration_seconds } = req.body;
  if (!recipient_id || !req.file) {
    return res.status(400).json({ error: 'recipient_id and an image file are required' });
  }

  const recipientId = Number(recipient_id);
  const friendship = await getAcceptedFriendship(req.user.id, recipientId);
  if (!friendship) {
    return res.status(403).json({ error: 'You can only send photos to accepted friends' });
  }

  const key = `${uuidv4()}.jpg`;
  saveImage(req.file.buffer, key);

  const result = await query(
    `INSERT INTO messages (sender_id, recipient_id, image_key, caption, drawing_data, view_duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, sender_id, recipient_id, caption, drawing_data, view_duration_seconds, created_at`,
    [req.user.id, recipientId, key, caption || null, drawing_data || null, view_duration_seconds || DEFAULT_VIEW_SECONDS]
  );

  const { milestone, streakDays } = await recordInteraction(friendship.id);

  res.status(201).json({ ...result.rows[0], streak_days: streakDays, milestone });

  const senderResult = await query('SELECT display_name FROM users WHERE id = $1', [req.user.id]);
  sendPushToUser(recipientId, {
    title: 'New photo',
    body: `${senderResult.rows[0]?.display_name || 'A friend'} sent you a photo`,
    data: { type: 'photo', messageId: result.rows[0].id },
  });
}

// Inbox-style list: latest message per friend, plus unread flag — feeds the Messages screen.
export async function listConversations(req, res) {
  const result = await query(
    `SELECT DISTINCT ON (other_user_id)
            other_user_id, u.username, u.display_name, u.avatar_url,
            m.id AS last_message_id, m.viewed_at, m.created_at
     FROM (
       SELECT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_user_id,
              id, viewed_at, created_at
       FROM messages
       WHERE sender_id = $1 OR recipient_id = $1
     ) m
     JOIN users u ON u.id = m.other_user_id
     ORDER BY other_user_id, m.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
}

export async function listThread(req, res) {
  const otherUserId = Number(req.params.userId);
  const result = await query(
    `SELECT id, sender_id, recipient_id, caption, drawing_data, viewed_at, expires_at, created_at,
            (expires_at IS NOT NULL AND expires_at < now()) AS expired
     FROM messages
     WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
     ORDER BY created_at ASC`,
    [req.user.id, otherUserId]
  );
  res.json(result.rows);
}

// Step 1 of viewing: recipient asks to open a photo. This marks it viewed,
// starts the expiration timer, and returns a short-lived token to fetch the
// actual image bytes — the image itself is never a public/static URL.
export async function openPhoto(req, res) {
  const { id } = req.params;
  const result = await query('SELECT * FROM messages WHERE id = $1', [id]);
  const message = result.rows[0];

  if (!message) return res.status(404).json({ error: 'Message not found' });
  if (message.recipient_id !== req.user.id) return res.status(403).json({ error: 'Not your message' });
  if (!imageExists(message.image_key)) return res.status(410).json({ error: 'Photo has expired' });

  if (!message.viewed_at) {
    await query(
      `UPDATE messages
       SET viewed_at = now(), expires_at = now() + (view_duration_seconds || ' seconds')::interval
       WHERE id = $1`,
      [id]
    );
  } else if (new Date(message.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Photo has expired' });
  }

  const token = generateReadToken(message.image_key, req.user.id);
  res.json({ read_token: token, view_duration_seconds: message.view_duration_seconds });
}

// Step 2: client fetches the actual bytes using the token from openPhoto.
export async function getPhotoBytes(req, res) {
  try {
    const { key, userId } = verifyReadToken(req.query.token);
    if (userId !== req.user.id) return res.status(403).end();
    if (!imageExists(key)) return res.status(410).json({ error: 'Photo has expired' });
    res.set('Content-Type', 'image/jpeg');
    res.send(readImage(key));
  } catch {
    res.status(401).json({ error: 'Invalid or expired read token' });
  }
}

// Called by the cleanup job (see services/expirationJob.js) — deletes the
// actual file for any message past its expires_at so it's really gone,
// not just hidden by the client.
export async function purgeExpiredImages() {
  const result = await query(
    `SELECT id, image_key FROM messages WHERE expires_at IS NOT NULL AND expires_at < now()`
  );
  for (const row of result.rows) {
    if (imageExists(row.image_key)) deleteImage(row.image_key);
  }
}
