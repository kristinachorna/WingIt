import { query } from '../db/index.js';
import { sendPushToUser } from '../services/pushService.js';

// Search users by username (for adding friends). Never returns email or password data.
export async function searchUsers(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  const result = await query(
    `SELECT id, username, display_name, avatar_url
     FROM users
     WHERE username ILIKE $1 AND id != $2
     LIMIT 20`,
    [`%${q}%`, req.user.id]
  );
  res.json(result.rows);
}

export async function sendRequest(req, res) {
  const { recipient_username } = req.body;
  if (!recipient_username) return res.status(400).json({ error: 'recipient_username is required' });

  const recipientResult = await query('SELECT id FROM users WHERE username = $1', [recipient_username]);
  const recipient = recipientResult.rows[0];
  if (!recipient) return res.status(404).json({ error: 'User not found' });
  if (recipient.id === req.user.id) return res.status(400).json({ error: "Can't add yourself" });

  try {
    const result = await query(
      `INSERT INTO friendships (requester_id, recipient_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, requester_id, recipient_id, status, created_at`,
      [req.user.id, recipient.id]
    );
    res.status(201).json(result.rows[0]);

    // Fire-and-forget: don't hold up the response waiting on push delivery.
    const senderResult = await query('SELECT display_name FROM users WHERE id = $1', [req.user.id]);
    sendPushToUser(recipient.id, {
      title: 'New friend request',
      body: `${senderResult.rows[0]?.display_name || 'Someone'} wants to add you`,
      data: { type: 'friend_request' },
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Friend request already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to send request' });
  }
}

// Shared helper: only the recipient of a pending request can accept/decline it,
// and only a participant can remove/block an existing friendship.
async function getFriendshipForUser(friendshipId, userId) {
  const result = await query(
    'SELECT * FROM friendships WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2)',
    [friendshipId, userId]
  );
  return result.rows[0];
}

export async function respondToRequest(req, res) {
  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'

  const friendship = await getFriendshipForUser(id, req.user.id);
  if (!friendship) return res.status(404).json({ error: 'Request not found' });
  if (friendship.recipient_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the recipient can respond to this request' });
  }

  if (action === 'decline') {
    await query('DELETE FROM friendships WHERE id = $1', [id]);
    return res.json({ status: 'declined' });
  }

  const result = await query(
    "UPDATE friendships SET status = 'accepted' WHERE id = $1 RETURNING *",
    [id]
  );
  res.json(result.rows[0]);
}

export async function removeFriend(req, res) {
  const { id } = req.params;
  const friendship = await getFriendshipForUser(id, req.user.id);
  if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

  await query('DELETE FROM friendships WHERE id = $1', [id]);
  res.json({ status: 'removed' });
}

export async function blockUser(req, res) {
  const { id } = req.params; // friendship id
  const friendship = await getFriendshipForUser(id, req.user.id);
  if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

  await query("UPDATE friendships SET status = 'blocked' WHERE id = $1", [id]);
  res.json({ status: 'blocked' });
}

export async function listFriends(req, res) {
  // Accepted friendships in either direction, plus whether they have an
  // unopened message waiting — used for the friend-list status dot.
  const result = await query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url,
            f.stage, f.streak_days,
            EXISTS (
              SELECT 1 FROM messages m
              WHERE m.sender_id = u.id AND m.recipient_id = $1 AND m.viewed_at IS NULL
            ) AS has_unread
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.recipient_id ELSE f.requester_id END
     WHERE (f.requester_id = $1 OR f.recipient_id = $1) AND f.status = 'accepted'`,
    [req.user.id]
  );
  res.json(result.rows);
}

export async function listPendingRequests(req, res) {
  const result = await query(
    `SELECT f.id, u.id AS from_user_id, u.username, u.display_name, u.avatar_url, f.created_at
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.recipient_id = $1 AND f.status = 'pending'`,
    [req.user.id]
  );
  res.json(result.rows);
}
